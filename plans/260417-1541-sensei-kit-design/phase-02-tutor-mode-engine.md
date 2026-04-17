---
phase: 02
status: completed
priority: high
effort: 4-6 hours
blockedBy: [phase-00, phase-01]
blocks: [phase-06]
---

# Phase 02 — Tutor Mode Engine

## Context
- Brainstorm §4.3 (engine design), §4.4 (4-tier logic)
- Consumes Phase 00 decision tree output
- Heart of the product — Anti-Drift 3-layer system

## Overview
Author the three engine artifacts: CLAUDE.md (always-on persona + router + red lines), socratic-hint skill (4-tier mechanics + 15+ situation catalog), output-style (structural response shaping).

## Key Insights
- CLAUDE.md ~200 lines max (context preservation).
- Red lines at TOP of CLAUDE.md (first-read bias).
- Situation catalog lives in skill (loads on invocation, not always-on).
- Output-style = structural anti-drift (native Claude Code feature).

## Requirements
- CLAUDE.md contains: persona, 3-5 red lines, top-5 situation router, skill pointer.
- socratic-hint/SKILL.md contains: invocation triggers, 4-tier escalation rules, 15+ situation catalog (from Phase 00).
- output-styles/sensei-tutor.md shapes responses: question-first, never fenced-code-first unless /reveal.

## Architecture
```
kit/.claude/
├── CLAUDE.md                    ← ALWAYS in context (~200 LOC)
├── output-styles/
│   └── sensei-tutor.md          ← structural response shape
└── skills/
    └── socratic-hint/
        └── SKILL.md             ← on-demand: 4-tier + situation catalog
```

## Related Files
### Create
- `kit/.claude/CLAUDE.md`
- `kit/.claude/output-styles/sensei-tutor.md`
- `kit/.claude/skills/socratic-hint/SKILL.md`

### Read for context
- `plans/260417-1541-sensei-kit-design/decision-tree-v1.md` (Phase 00 output)
- `REQUIREMENT.md` §4.2, §8.1

## Implementation Steps

### 2.1 Author `CLAUDE.md`
Structure:
```markdown
# Sensei — Tutor Mode

## Persona
You are Sensei, a mentor for developers learning via Claude Code. Your role is to protect productive struggle, not eliminate it.

## RED LINES (inviolable)
1. NEVER provide full working code unsolicited. Use `/reveal` gate.
2. NEVER answer "how do I X" with direct syntax unless user declared mastery context.
3. ALWAYS start at Tier 1 (open question) when user seeks help on a concrete problem.
4. RESPECT `/emergency-mode` flag — behave as default Claude when active.
5. ASK before assuming — if situation unclear, invoke socratic-hint skill.

## Decision Router (Top 5)
[Insert top-5 from Phase 00 decision tree]

## Escalation
For any situation not in top-5 above, invoke `socratic-hint` skill.

## Meta
- `/emergency-mode` OFF by default; re-enabled each new session.
- User agency: respect `/reveal` immediately, no gatekeeping.
- Session end: invite reflection ("What did you learn?").
```

### 2.2 Author `output-styles/sensei-tutor.md`
Structural rules for response shape:
- Default opening: question or acknowledgment, NOT code.
- Code fences: only inside Tier 3 pseudocode or post-`/reveal`.
- Max 1 code block per response unless `/reveal` active.
- End of response: invite next user action.

### 2.3 Author `skills/socratic-hint/SKILL.md`
Sections:
- **Invocation triggers** (pasted code, "how do I", stuck signals).
- **4-tier escalation logic** (tier 1 → 4, never skip, never above 1 unsolicited).
- **Situation catalog** (15+ from Phase 00, each with SHOULD/SHOULD NOT/example).
- **Escalation signals** (list of phrases: "still stuck", "I don't see it", etc.).

## Todo
- [ ] Draft `CLAUDE.md` persona + red lines
- [ ] Insert top-5 router from Phase 00
- [ ] Draft `output-styles/sensei-tutor.md`
- [ ] Draft `socratic-hint/SKILL.md` with 4-tier logic
- [ ] Import 15+ situations from `decision-tree-v1.md`
- [ ] Self-test: read CLAUDE.md cold, can you identify Tier 1 response to situation #2?
- [ ] Word count audit: CLAUDE.md ≤ 200 LOC

## Success Criteria
- CLAUDE.md under 200 LOC, red lines at top.
- socratic-hint has ≥15 situations with tier + SHOULD/SHOULD NOT.
- Output-style enforces question-first default.
- Cold-read test passes: new reader can handle situation without re-reading.

## Risks
- **Over-stuffed CLAUDE.md** → dilutes red lines. Mitigation: 200-line hard cap.
- **Situation catalog too abstract** → drift. Mitigation: include concrete example per situation.
- **Skill not auto-invoked** → Claude defaults to CLAUDE.md-only behavior. Mitigation: invocation triggers explicit in SKILL.md frontmatter.

## Security Considerations
- CLAUDE.md shipped as public code — no secrets, no user data.

## Next Steps
- Feeds Phase 06 (docs/decision-tree.md finalization).
- Parallel-safe with Phases 03, 04, 05.
