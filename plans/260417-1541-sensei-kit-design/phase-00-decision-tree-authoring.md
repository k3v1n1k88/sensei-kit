---
phase: 00
status: completed
priority: BLOCKING
effort: 4-8 hours focused work
blocks: [phase-02]
---

# Phase 00 — Decision Tree Authoring (BLOCKING)

## Context
- Source: `REQUIREMENT.md` §8.1
- Brainstorm: `plans/reports/brainstorm-260417-1541-sensei-kit-design.md` §3 risks #3
- **Why blocking**: Tutor Mode engine (Phase 02) consumes the decision tree. Empty tree = useless engine.

## Overview
- Priority: BLOCKING (engine depends on this)
- Status: pending
- Author 15+ situations in the format below. Each becomes a case in `socratic-hint/SKILL.md`.

## Situation Format (per REQUIREMENT.md §8.1)
```
### Situation: [label]
Signal: [what user says/does]
Context: [where user is in learning arc]
Claude SHOULD: [specific action]
Claude SHOULD NOT: [anti-pattern]
Good response example: [1-2 sentences]
Suggested tier (1-4): [entry tier for socratic-hint]
```

## Required Situations (per REQUIREMENT.md §8.1)

### Already suggested (5)
1. User asks about a new concept for the first time
2. User pastes buggy code + "fix this for me"
3. User asks "how do I do X" (specific task)
4. User tried 2-3 times without success, frustrated
5. User invokes `/emergency-mode`

### To author (10 more per §8.1)
6. User copy-pastes homework from school/courses
7. User asks advanced concepts but hasn't grasped basics
8. User disagrees with hint, argues back
9. User goes silent / doesn't respond to hints
10. User asks unrelated questions (e.g., weather)
11. User uses Tutor Mode for actual production work (deadline)
12. User already understands, just needs quick syntax
13. User asks about best practices / architecture decisions
14. User wants code review on already-written code
15. User is senior dev learning new tech (not a beginner)

### Recommended additions (>15 if needed)
16. User invokes `/reveal` immediately without attempting
17. User pastes error message with no context

## Related Files
- Create: `plans/260417-1541-sensei-kit-design/decision-tree-v1.md` (draft)
- Create (Phase 06): `docs/decision-tree.md` (published version)

## Implementation Steps
1. Author each of 15+ situations in the format above. Draft in `plans/260417-1541-sensei-kit-design/decision-tree-v1.md`.
2. Self-review: for each situation, verify SHOULD and SHOULD NOT are concrete (not "depends on context").
3. Map each situation to suggested entry tier (1-4) for socratic-hint.
4. Identify top-5 router situations (most common, highest drift risk) — these go in CLAUDE.md router, rest in skill catalog.
5. Gate review — run past a collaborator or self-critique: does this prevent drift for 10+ turns?

## Todo
- [ ] Draft situation 1-5 (starters from REQUIREMENT.md)
- [ ] Draft situation 6-15 (to-author list)
- [ ] Optional: situations 16-17+
- [ ] Tier assignment per situation
- [ ] Top-5 router selection
- [ ] Self-critique pass (no vague rules)
- [ ] Commit `decision-tree-v1.md`

## Success Criteria
- ≥15 situations authored.
- Each has concrete SHOULD + SHOULD NOT (zero "it depends").
- Top-5 identified for router.
- Tier mapping complete.

## Risks
- **Vague rules** = drift. Mitigation: rewrite any rule containing "usually", "often", "depends".
- **Gaps** = unhandled situations become default Claude behavior (answer-giving). Mitigation: add catch-all "unknown situation" rule.

## Next Steps
- Unblocks Phase 02 (engine authoring).
- Content promoted to `docs/decision-tree.md` in Phase 06.
