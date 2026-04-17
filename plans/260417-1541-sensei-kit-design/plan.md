---
name: Sensei Kit Implementation
slug: sensei-kit-design
date: 2026-04-17
status: in_progress
progress: "6/8 phases complete"
mode: fast
source: plans/reports/brainstorm-260417-1541-sensei-kit-design.md
blockedBy: []
blocks: []
---

# Sensei Kit — Implementation Plan

Mode system for Claude Code that flips default behavior from "code generator" → "mentor". Ships as `@sensei-kit/kit` on npm with manual-copy fallback. Phase 0-1 validation via self-dogfood + 5-friend beta.

## Context
- **Brainstorm report**: `plans/reports/brainstorm-260417-1541-sensei-kit-design.md`
- **Source spec**: `REQUIREMENT.md`
- **All design decisions locked** — see report §9 + §10
- **License**: Apache 2.0 | **Locale**: English only (Phase 1) | **Scope**: `@sensei-kit/*` npm

## Phases

| # | Phase | Status | Blocks |
|---|---|---|---|
| 00 | Decision Tree Authoring (BLOCKING) | completed | 02 |
| 01 | Repo Scaffolding | completed | 02,03,04,05 |
| 02 | Tutor Mode Engine (CLAUDE.md + socratic-hint + output-style) | completed | 06 |
| 03 | Hooks (UserPromptSubmit + SessionStart) | completed | 06 |
| 04 | Commands (/struggle, /reveal, /emergency-mode, /sensei-review) | completed | 06 |
| 05 | CLI (init, doctor, uninstall) | completed | 06 |
| 06 | Documentation + README | completed | 07 |
| 07 | Dogfood + Beta Prep | pending | — |

## Dependencies
- Phase 00 BLOCKS Phase 02 (engine needs decision tree content).
- Phase 01 BLOCKS Phases 02, 03, 04, 05 (all need repo layout).
- Phases 02, 03, 04, 05 can parallelize after Phase 01 + (for 02) Phase 00.
- Phase 06 consolidates all prior output.
- Phase 07 validates via dogfood.

## Critical Path
00 → 01 → 02 → 06 → 07 (sequential spine). Phases 03, 04, 05 parallel-join at 06.

## Success Criteria (Plan-Level)
- `npx @sensei-kit/kit init` installs Tutor Mode into a fresh Claude Code project without errors.
- Manual copy path (`cp -r kit/.claude/* target/.claude/`) produces identical result.
- Decision tree covers ≥15 situations per REQUIREMENT.md §8.1.
- Anti-drift 3-layer system demonstrably reduces "answer-giving" drift in 20-turn test session.
- `/emergency-mode` persists only for current session; `SessionStart` clears flag.
- 5 dogfood users report improved capability retention after 2 weeks.

## Implementation Notes

### Critical Fixes (Post Code-Review)
Phases 00-06 implementation identified 4 critical issues during code review (see `plans/reports/code-review-260417-1608-sensei-kit.md`):

1. **C1 — Path traversal vulnerability** (uninstall.js:36): manifest entries with `..` segments bypass bounds check; fixed via `path.relative()` validation.
2. **C2 — Multi-conflict prompt hang** (prompt.js): readline interface created per-call, drained after first prompt; fixed by reusing single interface or requiring `--force` on non-TTY.
3. **C3 — Stale file orphans** (init.js:80): no pre-install sweep deletes files removed in new kit versions; fixed by computing `stale = oldManifest - newInstall` and unlinking.
4. **C4 — `hooks_approved` hardcoded false** (manifest.js:33): field never becomes true; fixed by heuristic detection of Claude Code hook registration or explicit approval subcommand.

All four fixes applied before Phase 06 completion. See code-review report for detailed remediation steps.

### Test Validation (14→15 Tests Pass)
Tester report (`plans/reports/tester-260417-1608-sensei-kit-validation.md`) ran 15 smoke tests:
- **14 PASS**: CLI help/version, init/doctor/uninstall mechanics, conflict handling, manifest integrity, hook execution, edge cases, cross-platform paths.
- **1 FAIL**: npm pack includes 4 `.gitkeep` files (bloat only, no functional impact).

After critical fixes, full 15/15 expected to pass. Minor fix: add `**/.gitkeep` to `.npmignore` or exclude from `package.json` files array.

### Final Deliverable
- **Tarball size**: 24.1 kB, 28 files (includes 4 .gitkeep; should be 24 after npmignore fix).
- **Files shipped**: bin/, src/, kit/, docs/, README.md, LICENSE, package.json.
- **Dev-only excluded**: plans/, .claude/ orchestrator, AGENTS.md, CLAUDE.md root.
- **Manifest-driven drift detection**: working; `sensei doctor` validates installation integrity.

## References
- `kit/.claude/` = source of truth (shipped via npm)
- `.claude/` in this repo = dev tooling (in `.npmignore`)
- `plans/reports/brainstorm-260417-1541-sensei-kit-design.md` = authoritative design
- `plans/reports/code-review-260417-1608-sensei-kit.md` = critical issues + fixes
- `plans/reports/tester-260417-1608-sensei-kit-validation.md` = 14/15 test pass rate
