---
phase: 06
status: completed
priority: medium
effort: 2-3 hours
blockedBy: [phase-02, phase-03, phase-04, phase-05]
blocks: [phase-07]
---

# Phase 06 — Documentation + README

## Context
- Brainstorm §4.1 (docs/ shipped)
- All engine + CLI now implemented; docs consolidate

## Overview
Three shipped docs + public README. Everything user-facing, no dev-internal content.

## Requirements
- `docs/installation.md` — both paths (npm + manual), conflict handling, hook approval.
- `docs/decision-tree.md` — finalized 15+ situations from Phase 00, user-readable.
- `docs/metrics.md` — Level 1 metrics methodology + `/sensei-review` usage.
- `README.md` — 1-paragraph pitch + quick install + link to docs/.

## Related Files
### Create
- `docs/installation.md`
- `docs/decision-tree.md` (promotes `plans/.../decision-tree-v1.md`)
- `docs/metrics.md`
- `README.md`

## Implementation Steps

### 6.1 `README.md` (minimal, public-facing)
```markdown
# Sensei Kit

Mode system for Claude Code that flips default from **code generator** → **mentor**.

Based on RCT evidence (1,222 participants): users who receive direct AI answers lose independent problem-solving capability within 10-15 minutes. Users who receive hints do not. Sensei protects productive struggle.

## Install

**npm:**
    npx @sensei-kit/kit init

**Manual:**
    git clone https://github.com/sensei-kit/sensei-kit
    cp -r sensei-kit/kit/.claude/* your-project/.claude/

## Commands
- `/struggle` — signal frustration
- `/reveal` — unlock full answer (with cognitive friction)
- `/emergency-mode` — disable Tutor Mode for this session
- `/sensei-review` — weekly usage summary

## Docs
- [Installation](./docs/installation.md)
- [Decision Tree](./docs/decision-tree.md)
- [Metrics](./docs/metrics.md)

Apache 2.0. No telemetry. Your data stays local.
```

### 6.2 `docs/installation.md`
- Prereqs (Node ≥18, Claude Code installed).
- npm install path (detailed).
- Manual install path (detailed).
- Hook approval flow (what Claude Code prompts, what to click).
- Graceful degrade (if you decline hooks, what works, what doesn't).
- Existing `.claude/` conflict handling (diff preview UX, merge/overwrite/abort).
- Uninstall.

### 6.3 `docs/decision-tree.md`
- Preamble: philosophy (mentor, not generator).
- Each situation from Phase 00 → public-readable form.
- Remove internal notes ("drift risk", "tier suggested") or move to collapsible details.

### 6.4 `docs/metrics.md`
- Level 1 (proxy): event log schema, interpretation.
- Level 2 (self-report): deferred; document plan.
- Level 3 (behavioral transfer): Phase 2+ concept.
- `/sensei-review` output explanation.
- Privacy: all data local, never transmitted.

## Todo
- [ ] Write `README.md` (under 80 LOC)
- [ ] Write `docs/installation.md`
- [ ] Promote `decision-tree-v1.md` → `docs/decision-tree.md`
- [ ] Write `docs/metrics.md`
- [ ] Verify all docs linked from README
- [ ] Spell-check + markdownlint pass

## Success Criteria
- README under 80 LOC, scannable in 30s.
- Install path tested from docs (cold-read install works).
- Decision tree publishes without leaking internal notes.

## Risks
- **Docs drift from code** → Phase 07 dogfood catches this.
- **README too marketing-heavy** → keep to facts, cite RCT.

## Next Steps
- Phase 07 dogfood.
