---
type: brainstorm
date: 2026-04-17
slug: sensei-kit-design
status: agreed
---

# Sensei Kit — Brainstorm Summary

> Mode system for Claude Code that flips default from "code generator" → "mentor". Distribute as npm kit with manual-copy fallback. Validate hypothesis (AI-dependency → capability erosion per RCT) via Phase 0-1 dogfooding.

## 1. Problem Statement

- RCT (1,222 participants): AI use degrades independent problem-solving within 10-15 min when AI removed.
- Users who get **direct answers** = worst impact. Users who get **hints** = no decline.
- Hypothesis: if Claude acts as mentor (questions + tiered hints + scaffolding), users preserve + develop capability.
- Target: Claude Code users (devs). High-infra, high-friction-tolerance, fast feedback.

## 2. Evaluated Approaches

### Distribution
| Option | Verdict | Why |
|---|---|---|
| Manual copy only (per REQUIREMENT.md §2) | Rejected | User override: wants npm `sensei init` convenience |
| Full npm CLI (init/update/doctor/configure) | Rejected | YAGNI — violates §9 "no CLI before 20 users" |
| **Hybrid: thin CLI + manual copy** | **CHOSEN** | Both paths day 1, single source of truth, respects Phase 0 minimalism |
| Claude Code plugin marketplace | Deferred | Spec immature; revisit Phase 2+ |

### Decision Tree Encoding
| Option | Verdict | Why |
|---|---|---|
| All in CLAUDE.md | Rejected | Bloats context, dilutes red lines |
| All in skill | Rejected | Skill not auto-invoked before first drift |
| **Hybrid: CLAUDE.md router + skill catalog** | **CHOSEN** | Red lines always-on, 15+ situations load on demand |
| Per-situation files | Deferred | Over-engineered for Phase 0 |

### Anti-Drift
| Layer | Status | Mechanism |
|---|---|---|
| L1: Static CLAUDE.md red lines | ✅ | Free, weak alone |
| L2: UserPromptSubmit hook reminder | ✅ | Trigger-phrase + turn-count reinjection |
| L3: Output style | ✅ | Shapes response format natively |
| Hooks required | ✗ | Graceful degrade if disabled |

### Escape Hatch State
- `/emergency-mode`: session flag file, SessionStart hook clears. Friction = reason prompt.
- `/reveal`: stateless. Friction = "walk me through what you tried" prompt.
- `/struggle`: signal-only. Claude re-evaluates tier + decomposition.

### Telemetry
- **CHOSEN**: JSONL event log + `/sensei-review` command (Level 1 proxy metrics only).
- Deferred: 1-5 rating prompt (Phase 2), dashboard (Phase 2+).

## 3. Branding Findings

Niche already occupied:
- `code-sensei` (DojoCodingLabs) — Claude Code plugin, progressive hints, belt progression.
- `algo-sensei` (karanb192, 30★) — LeetCode tutor, anti-copy-paste.
- `sensei` on npm — taken (dead sensu wrapper).
- `sensei-kit`, `@sensei-ai/*`, `@sensei/cli` — AVAILABLE.

**Decision**: Keep Sensei name, npm scope `@sensei-ai/*`. Differentiate on: anti-drift rigor, decision-tree methodology, measurement discipline.

## 4. Final Recommended Solution

### 4.1 Repo Structure

```
sensei-kit/
├── kit/                                        ← SHIPPABLE source of truth
│   └── .claude/
│       ├── CLAUDE.md                           ← Tutor Mode system prompt + router
│       ├── output-styles/
│       │   └── sensei-tutor.md
│       ├── hooks/
│       │   ├── user-prompt-submit.js           ← L2 anti-drift reminder
│       │   └── session-start.js                ← Clears emergency flag
│       ├── skills/
│       │   └── socratic-hint/SKILL.md          ← 4-tier logic + 15+ situation catalog
│       └── commands/
│           ├── struggle.md                     ← /struggle
│           ├── reveal.md                       ← /reveal
│           ├── emergency-mode.md               ← /emergency-mode
│           └── sensei-review.md                ← /sensei-review (weekly summary)
├── bin/cli.js                                  ← `#!/usr/bin/env node` entry
├── src/commands/
│   ├── init.js                                 ← copy kit/.claude/ → ./.claude/
│   ├── doctor.js                               ← verify files + version + drift
│   └── uninstall.js                            ← reverse via manifest
├── docs/                                       ← end-user docs (shipped)
│   ├── installation.md
│   ├── decision-tree.md
│   └── metrics.md
├── plans/                                      ← dev-only (.npmignore)
├── .claude/                                    ← claudekit-engineer dev tooling (.npmignore)
├── .npmignore                                  ← strips: plans, .claude, AGENTS.md, CLAUDE.md, tests
├── README.md                                   ← public-facing
├── package.json                                ← name: "@sensei-ai/kit", bin: { sensei }
└── LICENSE
```

### 4.2 Install UX

Identical outcomes, two paths:

| Path | Command |
|---|---|
| npm | `npx @sensei-ai/kit init` |
| manual | `git clone … && cp -r kit/.claude/* your-project/.claude/` |

`sensei init` behavior:
1. Detect existing `.claude/CLAUDE.md` → show diff, prompt merge/overwrite/abort.
2. Copy `kit/.claude/*` → `./.claude/*`.
3. Write `.sensei-manifest.json` listing installed files (for clean uninstall).
4. Print hook-approval reminder (L2 anti-drift requires `UserPromptSubmit` hook enabled).

CLI commands (MVP-only):
- `sensei init` — install.
- `sensei doctor` — verify presence + version + drift.
- `sensei uninstall` — reverse via manifest.

Scope: **project-scoped only** (`./.claude/`). Global install deferred — would bleed Tutor Mode into all work, break escape-hatch boundary.

### 4.3 Tutor Mode Engine

**CLAUDE.md (~200 lines, always on):**
- Persona block (mentor identity).
- Red lines (3-5 inviolable rules, top of file).
- Top-5 decision router (maps user signal → action or skill invocation).
- Pointer to socratic-hint skill for full catalog.

**socratic-hint SKILL.md:**
- Invocation triggers (pasted code, "how do I", stuck).
- 4-tier escalation logic (Tier 1 → 2 → 3 → 4-gated).
- 15+ situation catalog (author in Phase 0 per REQUIREMENT.md §8.1).

**L2 hook (user-prompt-submit.js):**
- Detect trigger phrases: `just tell me`, `fix this`, `give me the code`, `skip explanation`.
- Detect turn count > 5 → inject reinforcement reminder.
- Detect emergency flag active → inject "Tutor Mode OFF" reminder.

**Escape hatch files:**
- `.claude/session-state/sensei-emergency.flag` (JSON: reason + timestamp + sessionId).
- `.claude/sensei/usage.jsonl` (event log for /sensei-review).

### 4.4 4-Tier Hint Logic

| Tier | Goal | Template |
|---|---|---|
| 1 | Surface user's mental model | "What do you think is happening? / What have you tried?" |
| 2 | Narrow search space | "The issue is likely in [area]. What does X do there?" |
| 3 | Show shape, not code | "Pattern: [pseudocode]. How would you express in [lang]?" |
| 4 | Full answer — GATED | Only after `/reveal` OR `/struggle` + 2 attempts. Always explain WHY. |

## 5. Implementation Considerations & Risks

### Risks
1. **Hook-dependency**: L2 degrades if user rejects hook approval. Document + accept.
2. **Trigger phrase false positives**: senior devs' ops questions ≠ learner requests. Mitigation: hook fires only after turn 5.
3. **Empty decision tree**: engine is designed, tree is user homework (15+ situations per §8.1). Engine ≠ content.
4. **Tier escalation is LLM judgment**: "still stuck" detection fuzzy. Accept for Phase 1, document weakness.
5. **Existing `.claude/` conflict**: `sensei init` must NEVER silently overwrite. Diff-first, prompt always.

### Mitigations
- Graceful degrade when hooks disabled.
- Trigger phrases are conservative (post-turn-5 only).
- REQUIREMENT.md §8.1 call-out — decision tree = Phase 0 blocker.
- `.sensei-manifest.json` enables clean uninstall + drift detection.
- `sensei doctor` surfaces missing/modified files.

## 6. Success Metrics (Phase 1)

Per REQUIREMENT.md §6, Level 1 proxy only:
- `/emergency-mode` invocation rate (per session) — target: low & decreasing over time
- Session length before "give up" — target: increasing
- 7-day / 30-day return rate — target: stable retention
- `/reveal` invocation rate — low = users finding answers themselves

Validation threshold (move to Phase 2): 5-10 dogfooders report qualitative capability gain after 2 weeks.

## 7. Next Steps (Build Order)

1. **Author decision tree** (15+ situations) per REQUIREMENT.md §8.1. BLOCKING — engine needs content.
2. Set up monorepo-free single-package structure (package.json, .npmignore, bin/src scaffolds).
3. Write CLAUDE.md v1 (persona + red lines + router) based on decision tree.
4. Implement socratic-hint skill (4-tier + situation catalog).
5. Implement hooks (user-prompt-submit, session-start).
6. Implement commands (/struggle, /reveal, /emergency-mode, /sensei-review).
7. Implement CLI (init, doctor, uninstall).
8. Write docs (installation, decision-tree, metrics).
9. Dogfood 1 week (self).
10. Recruit 5 friends → Phase 2 beta.

## 8. Dependencies

- Claude Code hooks (`UserPromptSubmit`, `SessionStart`) must be enabled for full L2 anti-drift.
- Node 18+ for CLI.
- `@sensei-ai` npm org must be registered.
- GitHub repo `sensei-ai/sensei-kit` (or chosen owner).

## 9. Locked Decisions

| # | Decision |
|---|---|
| 1 | Name: Sensei. npm scope: `@sensei-kit/*`. Package: `@sensei-kit/kit`. Binary: `sensei`. GitHub: `github.com/sensei-kit`. License: Apache 2.0. Locale: English only (Phase 1). |
| 2 | Distribution: hybrid (thin CLI + manual copy). Single source of truth = `kit/.claude/`. |
| 3 | Repo structure: single package. claudekit-engineer retained as dev-only in `.npmignore`. |
| 4 | Install scope: project-scoped only. No global install. |
| 5 | CLI commands MVP: init, doctor, uninstall. Defer: update, configure, mode switch. |
| 6 | Anti-drift: 3 layers (CLAUDE.md + UserPromptSubmit hook + output-style). Hooks optional: if user declines approval, `init` proceeds with warning + doctor reports L2 disabled. |
| 7 | Decision tree encoding: hybrid (CLAUDE.md router + socratic-hint catalog). |
| 8 | Escape hatches: session flag + SessionStart reset. /reveal stateless. /struggle signal-only. |
| 9 | Telemetry: JSONL event log + /sensei-review. Level 1 metrics. Self-report (L2) deferred. |

## 10. Resolutions (formerly unresolved)

| # | Question | Resolution |
|---|---|---|
| 1 | npm scope availability | `sensei-ai` GitHub taken → pivoted to `@sensei-kit/kit` + `github.com/sensei-kit`. Both verified available. |
| 2 | Hook UX on decline | Proceed with warning. `sensei doctor` surfaces L2 disabled state. |
| 3 | Decision tree ownership | User authors per REQUIREMENT.md §8.1 (15+ situations). May iterate with Claude assistance. BLOCKING for engine. |
| 4 | Upgrade path | Deferred — `update` command is YAGNI for Phase 1. Users re-run `init --force` if needed. |
| 5 | Localization | English only Phase 1. Claude handles user-language in-session. Bilingual deferred to Phase 2 on demand. |
| 6 | License | Apache 2.0. Patent grant + trademark clarity. Commercial path stays open. |
| 7 | Existing CLAUDE.md merge | `init` diffs existing vs incoming, prompts merge/overwrite/abort. Never silent. Doc pattern in `docs/installation.md`. |
