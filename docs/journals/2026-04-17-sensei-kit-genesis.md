# Sensei Kit — From Brainstorm to Code-Review Gauntlet

**Date**: 2026-04-17 22:45  
**Severity**: Medium (critical bugs in CLI, design sound)  
**Component**: npm distribution CLI + tutor-mode system prompt + anti-drift hooks  
**Status**: Resolved (all C1-C4 bugs patched, re-validated, committed)

---

## What Happened

Shipped **Sensei Kit** — a deliverable npm package + manual-copy toolkit that flips Claude Code from "code generator" mode into "Tutor Mode" (socratic hints, tiered escalation, anti-drift guardrails). Session arc: brainstorm (9 locked decisions + 7 resolved Qs) → 8-phase implementation plan → code delivery (7 phases, Phase 07 dogfood deferred) → parallel tester + code-reviewer validation → bug-fix cycle → 8 logical commits on main.

**Critical moment**: Code review uncovered 4 bugs in the JS CLI that would have shipped as security/UX failures. Path traversal in uninstall via unvalidated manifest paths. Readline hang on multi-prompt when run non-interactively (CI-breaking). Orphan files accumulating across kit upgrades. A `hooks_approved` boolean that was hardcoded `false` with no write path (doctor permanently lying to users). All four patched and re-validated before merge.

---

## The Brutal Truth

This should have been caught pre-review. The prompt layer (CLAUDE.md, skill catalog, 3-layer anti-drift) is *tight* — every design decision is traced to the RCT hypothesis or brainstorm trade-off, red lines are unambiguous, the 17-situation decision tree scales properly. But the CLI is *sloppy* — I shipped Node code without testing the error paths, skipped the non-TTY branch, didn't think about manifest injection, and copypasta'd a fake boolean field into the output schema.

Worse: the code review is *right* — none of those findings are edge-case nitpicks. Path traversal is a live CVE class. Piped stdin hang breaks CI/CD for anyone scripting the init. Stale-file accumulation is a silent data loss surface (future kit versions drop files, user project accumulates garbage forever). And the `hooks_approved` lie means a user could think L2 anti-drift is off when it's actually working — or vice versa. Users would chase non-issues or ignore real alerts.

The frustrating part: these are **not** subtle bugs. Path traversal is Injection 101 (validate manifest before using it as a FS path). Readline drain is a gotcha-but-well-known pattern in Node. Upgrade cleanup is textbook artifact management. The boolean should either be computed (check for hook registration) or not shipped at all. I optimized for "ship the prompt layer" and let the JS infrastructure rot. That's on me.

---

## Technical Details

**C1 — Path Traversal** (`src/commands/uninstall.js:36`)  
```js
// BROKEN:
const abs = path.join(targetRoot, entry.path); 
fs.unlinkSync(abs);  // entry.path = "../../evil.txt" → deletes /tmp/evil.txt

// FIXED:
const abs = path.resolve(targetRoot, entry.path);
const rel = path.relative(targetRoot, abs);
if (rel.startsWith('..') || path.isAbsolute(rel)) {
  process.stderr.write(`  ✗ refusing out-of-tree path: ${entry.path}\n`);
  continue;
}
```

The manifest (`.sensei-manifest.json`) is user-writable and often VCS-tracked. A hostile PR or shared tooling can seed `../../sensitive.txt` entries. Uninstall blindly trusts it and deletes arbitrary files the process can write. Code review confirmed live with test injection.

**C2 — Multi-prompt Readline Hang** (`src/lib/prompt.js`)  
First `ask()` creates a readline interface, closes it after one line. Second prompt has no input stream (stdin is drained). Repro: `printf "o\ns\n" | sensei init` with two conflicting files → hangs, partial install, no manifest. Breaks all CI/CD scripting.

**C3 — Stale File Orphans** (`src/commands/init.js`)  
`init --force` walks the *source* tree fresh and rewrites the manifest, but never diffs the *old* manifest to identify deleted files. Any file dropped in a new kit version accumulates in user projects indefinitely, and `uninstall` can't touch them (not in manifest). On future kit renames, projects become bloated with dead files.

**C4 — Hardcoded `hooks_approved: false`** (`src/lib/manifest.js`, `src/commands/doctor.js`)  
Field written but never set to `true` — no code path exists. `doctor` always outputs "no (L2 anti-drift disabled)" even when hooks are firing correctly. Brainstorm §9.6 decision ("Hooks optional: if user declines approval, doctor reports L2 disabled") assumes this field reflects reality. It doesn't. Users will either ignore a real signal or chase a phantom problem.

---

## What We Tried

**Initial validation approach**: tester + code-reviewer in parallel. Tester got 14/15 green (one async cleanup leak in a test fixture, minor). Reviewer got the 4 criticals + 4 highs. Instead of shipping, I staged both agents' findings, read the review carefully, and ran a fix cycle.

**C1 fix**: Added `path.relative()` bounds check + early-exit. Confirmed via manual test: manifest with `../../` entry now silently skips instead of deleting.

**C2 fix**: Switched from per-call readline to a single reused interface, closed once on exit. Also added non-TTY guard: if `!process.stdin.isTTY && !force`, throw with guidance. Tested manually: `printf "o\ns\n" | sensei init` now works (respects first answer, uses `--force` for second).

**C3 fix**: Added pre-manifest sweep: read old manifest (if it exists), compute `stale = old.files.filter(f => !newInstalled.includes(f))`, unlink each (with C1 guard), prune empty dirs. Tested: injected a stale file, re-ran init, stale file was removed.

**C4 fix**: Dropped the field from the manifest entirely (heuristic detection of hook registration in Claude Code's config is scope-creep for Phase 0). Updated `doctor` output to omit the lie. Users will learn from Phase 1 dogfood whether this field is needed.

---

## Root Cause Analysis

**Why did this happen?** Three factors:

1. **Prompt-first mentality**: I spent 95% of planning energy on the tutor-mode engine (CLAUDE.md, skill catalog, hooks as L2 guardrail). The CLI was "just copy files and track what you copied" — felt like an implementation detail. Skipped the adversarial-input testing that would've caught C1 immediately.

2. **Node.js footguns are real**: Path traversal in fs operations, readline state management, and async error handling are *obvious* in retrospect, but the code was written in a "works on my machine" mode (TTY input, single conflict scenario, manifest fresh). Non-TTY, multiple conflicts, stale state → exposed all three at once.

3. **Schema without validation**: Manifest fields were declared in isolation ("hooks_approved is a boolean") without asking whether anything *sets* that field. No one read the manifest write path and said "wait, this is always false." That's a code-review win, but it should've been caught by me before that point.

---

## Lessons Learned

1. **CLI code needs the same rigor as security-sensitive code.** Path traversal is on the same tier as shell injection — validate manifests before dereferencing them as FS paths. This is not an edge case; it's "do you want attackers deleting user files?".

2. **Test error paths first.** The happy path (`init` on empty dir, no conflicts) was fully exercised. The error paths (C2: multi-prompt, C3: dirty install state, C4: grace degrade) were theoretical. If I'd tested those first, all four would've surfaced in an afternoon.

3. **Don't ship boolean fields that are write-once and always false.** If a field is meant to reflect dynamic state, ensure it has a *write path*. If it's always false, it's dead code — remove it. The brainstorm assumed this would be real state; I didn't challenge that assumption during implementation.

4. **Validate manifest entries as a data structure concern, not a file-operation concern.** I should have sanitized all manifest paths at read-time (into a `SafePath` object or validation wrapper) rather than scattering bounds-checks at every unlink call. Upfront validation > runtime guards.

5. **Non-TTY is not a "nice-to-have" compatibility mode.** If your CLI is going to be scripted (CI, cron, IDE integration), non-TTY *is* the primary use case. I should have tested that first and treated TTY as the bonus path.

---

## Next Steps

1. **Monitor Phase 1 dogfood (2-3 weeks):** 5 users, measure `/emergency-mode` invocation rate, session-length trend, and `/reveal` usage. These will tell us whether the 3-layer anti-drift is actually working or if the design is wrong.

2. **Revisit C4 during dogfood:** If users never ask "is L2 enabled?", drop the field entirely. If they do, implement either hook-registration detection or a `sensei hooks approve` subcommand.

3. **Add pre-merge CLI testing:** tester agent should run `npm test && npm pack --dry-run` as a gate before code-reviewer. That would have caught the `.gitkeep` leak (M4) and the test-script pointing at nonexistent dir (N2).

4. **High-level takeaway for future CLI projects:** Security-sensitive code path + user interaction + state management = review at the same tier as the prompt layer. I shipped an 8.5/10 design with a 6.5/10 implementation because I partitioned mental energy.

---

## Status

**DONE** — All criticals fixed and re-validated. 8 commits on main (no remote configured pending phase 1 validation). Kit is publishable pending Phase 1 user validation and potential C4 field decision.

**Evidence of completion:**
- brainstorm: `plans/reports/brainstorm-260417-1541-sensei-kit-design.md` (9 locked decisions, 7 resolutions)
- code-review: `plans/reports/code-review-260417-1608-sensei-kit.md` (4 C + 4 H issues identified + fixed)
- git: 8 commits covering brainstorm lock-in → phases 00-06 → tooling/docs → bin entry
- tarball: 24.1kB, 28 files, no dev leaks, clean `.npmignore`
