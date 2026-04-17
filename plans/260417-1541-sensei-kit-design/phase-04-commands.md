---
phase: 04
status: completed
priority: high
effort: 2-3 hours
blockedBy: [phase-01]
blocks: [phase-06]
---

# Phase 04 — Commands

## Context
- Brainstorm §4.3 (escape hatch state model)
- REQUIREMENT.md §5 (escape hatch friction design)

## Overview
Four slash commands: `/struggle` (signal), `/reveal` (stateless friction), `/emergency-mode` (session disable), `/sensei-review` (weekly metrics summary).

## Requirements
- `/struggle` — user reports being stuck; Claude re-evaluates tier + problem decomposition.
- `/reveal` — cognitive-friction prompt before unlocking Tier 4 answer.
- `/emergency-mode` — write session flag with reason; user-facing friction: "What's the reason?"
- `/sensei-review` — read `.claude/sensei/usage.jsonl`, summarize Level 1 metrics.

## Related Files
### Create
- `kit/.claude/commands/struggle.md`
- `kit/.claude/commands/reveal.md`
- `kit/.claude/commands/emergency-mode.md`
- `kit/.claude/commands/sensei-review.md`

## Implementation Steps

### 4.1 `struggle.md`
```markdown
---
description: Signal that you're stuck. Sensei re-evaluates the approach.
---

You invoked `/struggle`. Acknowledge the user's frustration without judgment. Then:

1. Summarize what you understand about the user's current attempt (1 sentence).
2. Ask ONE decomposition question: "Before a hint — which sub-step is breaking: [A], [B], or [C]?"
3. Do NOT escalate to Tier 3 or 4 without user confirmation.
4. Append event to `.claude/sensei/usage.jsonl`: `{"type":"struggle_invoked","ts":"<iso>"}`

RED LINE: /struggle is a signal, not a reveal request. If user wants the answer, they must invoke /reveal.
```

### 4.2 `reveal.md`
```markdown
---
description: Unlock the full answer (Tier 4). Cognitive friction applies.
---

User invoked `/reveal`. Before answering:

1. Ask: "Walk me through what you've tried so far — even partial attempts."
2. After user responds, provide the full answer AND a post-explanation of WHY it works relative to what they tried.
3. End with: "Next time you hit this pattern, what's your first check going to be?"
4. Append event: `{"type":"reveal_invoked","ts":"<iso>"}`

NEVER refuse /reveal. User agency per REQUIREMENT.md §3.3.
NEVER reveal without the friction prompt first.
```

### 4.3 `emergency-mode.md`
```markdown
---
description: Disable Tutor Mode for this session. Re-enabled on next session.
---

User invoked `/emergency-mode`. Before activating:

1. Ask: "You're disabling Tutor Mode for this session. What's the reason? (helps calibrate later)"
2. After user responds, write `.claude/session-state/sensei-emergency.flag` with:
   ```json
   {"reason":"<user reason>","ts":"<iso>","sessionId":"<current>"}
   ```
3. Append event: `{"type":"emergency_invoked","reason":"<user reason>","ts":"<iso>"}` to `.claude/sensei/usage.jsonl`
4. Confirm: "Tutor Mode OFF for this session. Will auto-re-enable on next session. I'll behave as default Claude now."

RED LINE: always accept the invocation (respect user agency). Friction is the reason prompt, not refusal.
```

### 4.4 `sensei-review.md`
```markdown
---
description: Weekly Level 1 metrics summary from event log.
---

User invoked `/sensei-review`. Read `.claude/sensei/usage.jsonl` (tolerate missing file → report "no data yet").

Generate summary:
- Session count (rough via emergency/reveal/struggle event timestamps).
- `/emergency-mode` invocation rate (target: low, decreasing).
- `/reveal` invocation rate (target: low).
- `/struggle` invocation rate (engagement signal).
- Top emergency reasons (cluster similar text).
- Trend vs prior week (if data >7 days).

End with ONE reflection question: "Looking at this pattern, what would you adjust?"

DO NOT autotag sessions as "good" or "bad" — user interprets their own data.
```

## Todo
- [ ] Write `struggle.md`
- [ ] Write `reveal.md`
- [ ] Write `emergency-mode.md`
- [ ] Write `sensei-review.md`
- [ ] Verify frontmatter format matches Claude Code command schema
- [ ] Smoke-test each command via manual invocation in a test project

## Success Criteria
- All 4 commands registered correctly (appear in `/` menu).
- `/emergency-mode` writes flag file with correct schema.
- `/reveal` always asks friction question before answering.
- `/sensei-review` tolerates missing log file.

## Risks
- **Event-log write failures** → silent data loss. Mitigation: commands `mkdir -p` + append with try/catch; don't abort command on log failure.
- **Flag file orphaned** → `SessionStart` hook (Phase 03) clears it. Also: `sensei doctor` warns if flag older than 24h.

## Security Considerations
- User-provided reason text written to disk — length-cap to 500 chars, no shell interpolation.

## Next Steps
- `/emergency-mode` flag consumed by Phase 03 hook.
- Phase 05 `init` registers these command files.
