---
type: code-review
date: 2026-04-17
slug: sensei-kit
status: complete
---

# Sensei Kit — Code Review

## Verdict

Kit lands on-spec with the brainstorm (§9 locked decisions all satisfied — hybrid dist, single source of truth, project scope, manifest-driven uninstall, 3-layer anti-drift, graceful hook degrade). Prompt artifacts (CLAUDE.md / SKILL.md / output-style / 4 commands) are coherent, red lines unambiguous, top-5 router matches the 17-situation catalog, and the hook correctly short-circuits on the emergency flag. **Blocking issues are all in the JS CLI:** (a) path-traversal sink in `uninstall.js` via unvalidated manifest paths, (b) `init`'s interactive prompt breaks under piped/non-TTY stdin after the first conflict, (c) stale installed files are orphaned across versions because no sweep runs before rewriting the manifest on `init --force`, and (d) `hooks_approved` is hardcoded `false` with no code path to ever flip it, so doctor permanently lies. Fix those four and this is publishable.

---

## CRITICAL

### C1 — Path traversal via manifest-controlled `unlinkSync`
**File:** `src/commands/uninstall.js:36`
**Issue:** `const abs = path.join(targetRoot, entry.path); fs.unlinkSync(abs);` — if `entry.path` contains `..` segments, `path.join` happily resolves outside `targetRoot` and the CLI deletes arbitrary files the process can write. Confirmed live: a manifest entry `../../evil.txt` in a test project deleted `/tmp/evil.txt`. The manifest is plain JSON in a user-writable, often VCS-tracked location — hostile PR or shared tooling can seed entries.
**Fix:**
```js
const abs = path.resolve(targetRoot, entry.path);
const rel = path.relative(targetRoot, abs);
if (rel.startsWith('..') || path.isAbsolute(rel)) {
  process.stderr.write(`  ✗ refusing out-of-tree path: ${entry.path}\n`);
  continue;
}
```
Apply the same guard to the `parentDirs` walk (use `path.relative` bounds, not `startsWith(targetRoot)` — `startsWith` is vulnerable to sibling-prefix confusion, e.g., `/tmp/foo` vs `/tmp/foobar`).

### C2 — Multi-conflict `init` hangs under piped stdin
**File:** `src/lib/prompt.js:5-13`
**Issue:** `ask()` creates a new `readline.Interface` per call and closes it after one line. The first prompt works; on the second prompt the rl-close left stdin drained, and the second interface never receives data. Repro: two conflicting files + `printf "o\ns\n" | sensei init` → prints "unsettled top-level await", exits, partial install with no manifest. CI/scripting is completely broken.
**Fix:** create ONE readline interface at the top of `init`, reuse for every prompt, close once on exit. Or, detect non-TTY and require `--force`:
```js
if (!process.stdin.isTTY && !force) {
  throw new Error('non-TTY stdin: use --force to accept overwrites or run interactively');
}
```
Pick one. The reused-interface pattern is strictly better.

### C3 — Stale installed files orphaned across kit versions
**File:** `src/commands/init.js:80` + missing pre-install sweep
**Issue:** `init --force` walks the *source* tree and rewrites the manifest fresh, but never consults the *old* manifest to diff-and-delete files that previous versions shipped and this one doesn't. Confirmed live: injected a stale `legacy/old-file.md` into the manifest, re-ran `init --force`, manifest was rewritten (clean), file still on disk, subsequent `uninstall` leaves it. On any future kit rename/removal, user projects accumulate dead files that no CLI command can clean.
**Fix:** before `writeManifest`, read the existing manifest (if any), compute `stale = oldManifest.files.map(f=>f.path).filter(p => !installed.includes(p))`, unlink each (with same C1 path guard) and prune empty dirs. Surface "removed N stale files" in the output.

### C4 — `hooks_approved` is write-once `false`, perpetually misleading
**File:** `src/lib/manifest.js:33` + `src/commands/doctor.js:36`
**Issue:** `writeManifest` hardcodes `hooks_approved: false`. There is no other write path that can ever set it to `true`. `doctor` always prints "no (L2 anti-drift disabled)" even when the hooks are firing correctly — users will chase a non-issue or ignore a signal that should matter. The brainstorm §9 decision 6 assumes this field is real state.
**Fix:** either (a) remove the field and detect approval heuristically — e.g., check that `$HOME/.claude/settings.json` or project `.claude/settings.json` lists the hook paths; or (b) add a `sensei hooks approve` subcommand that flips the flag after the user confirms Claude Code registered them; or (c) drop the claim from doctor output until it's real. Option (a) is likely feasible since Claude Code stores hook registrations in JSON — worth one grep.

---

## HIGH

### H1 — `init` on conflict-abort leaves partial files with no manifest
**File:** `src/commands/init.js:61-64`
**Issue:** On abort mid-loop, earlier `copyFile` writes remain but `writeManifest` is skipped. The hint "run `sensei uninstall` to clean" in the message is wrong — uninstall needs a manifest and there is none. User is stuck with a half-install and no CLI recovery path.
**Fix:** write a partial manifest before aborting, OR walk the `installed` array and unlink on abort (rollback). The rollback variant is simpler and matches the user mental model ("abort = nothing happened").

### H2 — `diffSummary` reads both files into memory as UTF-8 split on \n
**File:** `src/lib/copy.js:34-40`
**Issue:** A corrupted / binary existing file, or a huge one, will (a) produce misleading line counts, (b) double-read (also called by `filesIdentical` path… actually no, identical is a buffer compare, fine). Minor robustness — but the label "X to add / Y to remove at minimum" is actively misleading as a diff (two files of identical line count can differ entirely). Consider dropping the "add/remove" framing and just printing byte counts + "bytes differ" indicator.
**Fix:** either drop the delta math and display only `source N bytes vs existing M bytes, content differs`, or invoke a proper line diff (not worth the dep).

### H3 — Hook state path is cwd-relative; Claude Code payload carries `cwd`, unused
**File:** `kit/.claude/hooks/user-prompt-submit.js:13-15` + `kit/.claude/hooks/session-start.js:9-11`
**Issue:** Both hooks treat `'.claude/session-state'` as relative to `process.cwd()`. Claude Code's UserPromptSubmit payload includes an explicit `cwd` field — if Claude Code ever runs a hook from a different working directory (e.g., during subagent invocation or monorepo contexts), state splits across directories. Emergency-flag detection could fail silently in that case, which is a RED LINE violation.
**Fix:** prefer payload cwd: `const root = input.cwd || process.cwd(); const stateDir = path.join(root, '.claude/session-state');`. Apply to both hook files. Note session-start payload also carries `cwd` per Claude Code hook docs.

### H4 — Hook "<50ms exit" claim is false
**File:** `kit/.claude/hooks/user-prompt-submit.js:6`
**Issue:** Measured 118-140ms cold on Node 24 (Windows, no I/O). Node ESM startup alone is ~80-100ms. The comment is aspirational; either rewrite the hook as a shell script (portable problem) or drop the claim. Claude Code has its own hook-timeout default; this hook will exceed the 50ms self-claim on every invocation but should still finish within the platform's actual timeout.
**Fix:** change the comment to `Must exit promptly (<500ms)`. Don't ship a lie.

---

## MEDIUM

### M1 — `init.js:22` "package corrupted" message is premature-optimistic
**File:** `src/commands/init.js:21-22`
**Issue:** `if (!fs.existsSync(sourceRoot)) throw` triggers on a package file-system fault. OK. But many OSS package-dir corruptions manifest as the *target* copy failing (EACCES, disk full). Neither `copyFile`, `walkFiles`, nor the main loop catches per-file errors — a mid-copy EACCES throws up through `cli.js:42` with `sensei: <msg>` and exit 1. That's acceptable, but the user is left with whatever partial state existed before the throw and no rollback (also see H1). Consider wrapping the main loop in try/catch that rolls back `installed` entries on uncaught error.

### M2 — `input.user_message` fallback is dead code
**File:** `kit/.claude/hooks/user-prompt-submit.js:28`
**Issue:** Claude Code hook payload field is `prompt` per current docs; `user_message` is never set. Remove the fallback or comment why it's there (prior API? future-proofing?). If it's future-proofing, document it.
**Fix:** `const userMessage = input.prompt || '';`

### M3 — Turn counter persists across `sessionId` races only by full reset
**File:** `kit/.claude/hooks/user-prompt-submit.js:47-55`
**Issue:** When `session-start.js` fails to run (e.g., user hasn't approved that hook but approved user-prompt-submit), the old turn file from a prior session is detected, its sessionId is compared to current, and the counter resets — fine, covers the common case. But if the stored JSON is garbage (disk corruption, crash mid-write), the `JSON.parse` throw is caught and counter resets to 0 — acceptable. No race (single-user, sequential invocation). Leave it; documentation-worthy.

### M4 — `.gitkeep` files ship in npm tarball
**File:** `.npmignore` / `package.json`
**Issue:** `npm pack --dry-run` shows 4× zero-byte `.gitkeep` files under `kit/.claude/commands/`, `hooks/`, `skills/`, `output-styles/`. `walkFiles` filters them at install time, but they bloat the package listing and add noise.
**Fix:** append `**/.gitkeep` to `.npmignore`.

### M5 — `uninstall` success exit when user answered "no"
**File:** `src/commands/uninstall.js:26-29`
**Issue:** User declined the "Continue?" prompt → returns `1`. That's exit-code-for-error territory, but the user *chose* this. Consider returning 0 on an intentional decline; reserve 1 for actual failures. Not strictly wrong but borderline.

---

## LOW

### L1 — `doctor` prints verbose file lists for modified/missing
**File:** `src/commands/doctor.js:28, 33`
**Issue:** With a large drift, output gets noisy. Cap at 10 entries + "…and N more" for readability. Minor UX.

### L2 — `manifest.js:31` `meta.version || '0.0.1'` fallback is dead
**File:** `src/lib/manifest.js:31`
**Issue:** Init always passes `pkg.version`. Fallback never fires; if it ever does, silently writing `0.0.1` would mislead. Throw instead if meta.version is falsy, or just remove the default.

### L3 — `filesIdentical` loads whole buffers; fine for kit files, not for arbitrary content
**File:** `src/lib/copy.js:42-47`
**Issue:** Kit files are all <15KB — no issue. Flagging for future-proofing: a sha-streaming comparison would be nicer if kit ever ships larger assets.

### L4 — `cli.js:26-29` uses `createRequire` for package.json
**File:** `bin/cli.js:26-29`
**Issue:** Works fine on Node 18+. Could use JSON import assertions (`with { type: 'json' }`), which are stable on Node 18.20+/20.10+. Current code is more portable. No change recommended — documenting for future.

---

## NIT

### N1 — Typography: em dashes, smart quotes in prompts
**File:** `kit/.claude/CLAUDE.md`, commands/*.md
**Issue:** Heavy em-dash usage in CLAUDE.md and skill. Claude will mirror this tone in output — that's intentional and consistent with the persona. Leave.

### N2 — `package.json:36` test script points at nonexistent `tests/`
**File:** `package.json:36`
**Issue:** `"test": "node --test tests/"` — no `tests/` directory exists yet (Phase 07). Current `npm test` would fail. Either remove the script or use `node --test tests/ 2>/dev/null || echo "no tests yet"`. Minor.

### N3 — Hook message "DO NOT supply full code unless /reveal" may over-restrict
**File:** `kit/.claude/hooks/user-prompt-submit.js:77-79`
**Issue:** The reinjection fires when trigger phrase AND turn > 5. Situation 12 (mastery-declared user) could trigger this false-positively if they say "just tell me". Current guidance says "suggest /reveal" — that's correct recovery, and SKILL.md §12 handles the bypass. Leave.

---

## Positive Callouts

- **Manifest-driven uninstall with sha256 drift detection** is exactly what the brainstorm §9.5 asked for; `doctor` surfaces it cleanly (apart from C4).
- **CLAUDE.md top-5 router + 17-situation skill** split is well-executed; red lines are truly inviolable-feeling ("NEVER refuse /reveal" is bold enough to stick), router scales to overflow via the skill invoke clause.
- **`.npmignore` discipline** — no dev content, no plans/, no `.claude/` orchestrator stuff leaked; `npm pack --dry-run` shows 24.1kB, 28 files, all intentional.
- **Hooks degrade gracefully** — malformed stdin, missing state dir, missing trigger file, corrupted turn file all exit 0 silently. Matches the "graceful hook degrade" lock from §9.6.
- **`/struggle` vs `/reveal` semantic split** is encoded precisely — struggle re-evaluates tier but gates Tier 4 behind reveal. That's the whole thesis in two commands.

---

## Score: 6.5 / 10

Prompt layer and design fidelity are 9/10 (ship-ready); the JS CLI has two CVE-class bugs (path traversal + broken non-TTY UX) and one silent-drift bug (orphan files on upgrade) that block publish. Fix C1-C4 and this is easily 8.5.

---

## Unresolved Questions

1. **Hook approval detection** (C4) — can `sensei doctor` read Claude Code's hook-registration state from `~/.claude/settings.json` or `.claude/settings.json`? If yes, C4 fix is trivial. If no (hooks are registered via Claude Code UI without a durable config file), the field should be dropped from the manifest entirely.
2. **Kit vs project CLAUDE.md merge strategy** — current `init` treats any existing `.claude/CLAUDE.md` as a file-level conflict (overwrite/skip/abort). For projects that already have a CLAUDE.md persona, section-level merge ("append RED LINES if absent") might be safer. Defer to Phase 1 dogfood — note for followup.
3. **Manifest forward-compat** — adding new fields (e.g., `hooks_approved` if it becomes real) requires migration logic in `verifyManifest`. Current code tolerates missing fields but doesn't version-gate. Consider a `manifest_version` field separate from `version`.

---

**Status:** DONE_WITH_CONCERNS — 4 critical issues require fix before npm publish; prompt-layer design is sound.
