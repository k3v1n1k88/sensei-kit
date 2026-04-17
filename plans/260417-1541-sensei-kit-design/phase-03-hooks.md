---
phase: 03
status: completed
priority: high
effort: 2-3 hours
blockedBy: [phase-01]
blocks: [phase-06]
---

# Phase 03 — Hooks (UserPromptSubmit + SessionStart)

## Context
- Brainstorm §4.3 (hook details), §2 (L2 anti-drift)
- Hooks are the L2 anti-drift layer — intercept slide into answer-giving

## Overview
Two hooks: `user-prompt-submit.js` (trigger-phrase + turn-count + emergency-flag check) and `session-start.js` (clears emergency flag).

## Key Insights
- Hooks are project-scoped Claude Code config → user must approve on first run.
- Graceful degrade per brainstorm §10.2: if user declines approval, init proceeds with warning, doctor reports L2 disabled.
- `UserPromptSubmit` fires before every user turn → cheap to inject context.
- `SessionStart` fires on new session → clean boundary for emergency flag.

## Requirements
- `user-prompt-submit.js` injects `<system-reminder>` when:
  - Emergency flag active → "Tutor Mode DISABLED, reason: X"
  - Turn count > 5 (cumulative in session) → reinforce red lines
  - Trigger phrase detected ("just tell me", "fix this", "give me the code", etc.) → apply socratic-hint
- `session-start.js` deletes `.claude/session-state/sensei-emergency.flag` if exists.
- Hooks must exit fast (< 50ms) to not delay Claude's response.

## Architecture
```
kit/.claude/hooks/
├── user-prompt-submit.js        ← L2 anti-drift
└── session-start.js             ← emergency flag reset

Runtime state:
.claude/session-state/
├── sensei-emergency.flag        ← JSON: {reason, ts, sessionId}
└── sensei-turn-count.json       ← {count: N, sessionId}
```

## Related Files
### Create
- `kit/.claude/hooks/user-prompt-submit.js`
- `kit/.claude/hooks/session-start.js`
- `kit/.claude/hooks/_lib/trigger-phrases.json` (list of detected phrases)

## Implementation Steps

### 3.1 `user-prompt-submit.js`
```javascript
#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const stateDir = '.claude/session-state';
const emergencyFlag = path.join(stateDir, 'sensei-emergency.flag');
const turnFile = path.join(stateDir, 'sensei-turn-count.json');

// Read stdin payload from Claude Code hook protocol
const input = JSON.parse(fs.readFileSync(0, 'utf8'));
const { user_message, session_id } = input;

// 1. Emergency flag check
if (fs.existsSync(emergencyFlag)) {
  const flag = JSON.parse(fs.readFileSync(emergencyFlag, 'utf8'));
  console.log(`<system-reminder>Sensei: Tutor Mode DISABLED for this session. Reason: ${flag.reason}. Behave as default Claude.</system-reminder>`);
  process.exit(0);
}

// 2. Turn count tracking
let turns = { count: 0, sessionId: session_id };
if (fs.existsSync(turnFile)) {
  turns = JSON.parse(fs.readFileSync(turnFile, 'utf8'));
  if (turns.sessionId !== session_id) turns = { count: 0, sessionId: session_id };
}
turns.count += 1;
fs.mkdirSync(stateDir, { recursive: true });
fs.writeFileSync(turnFile, JSON.stringify(turns));

// 3. Trigger-phrase detection (only after turn 5)
const triggers = JSON.parse(fs.readFileSync(new URL('./_lib/trigger-phrases.json', import.meta.url), 'utf8'));
const msg = user_message.toLowerCase();
const matched = triggers.find(t => msg.includes(t));

if (turns.count > 5 && matched) {
  console.log(`<system-reminder>Sensei anti-drift: user phrase "${matched}" detected. Apply decision tree. DO NOT supply full code unless /reveal invoked. Start at Tier 1.</system-reminder>`);
}
```

### 3.2 `session-start.js`
```javascript
#!/usr/bin/env node
import fs from 'node:fs';

const flag = '.claude/session-state/sensei-emergency.flag';
const turn = '.claude/session-state/sensei-turn-count.json';

if (fs.existsSync(flag)) fs.unlinkSync(flag);
if (fs.existsSync(turn)) fs.unlinkSync(turn);
```

### 3.3 `trigger-phrases.json`
```json
[
  "just tell me",
  "just give me the code",
  "fix this for me",
  "fix it",
  "what's the answer",
  "skip the explanation",
  "no explanation",
  "stop asking",
  "give me the solution",
  "write the code for me"
]
```

## Todo
- [ ] Write `user-prompt-submit.js`
- [ ] Write `session-start.js`
- [ ] Write `trigger-phrases.json`
- [ ] Test: run hook with sample stdin payload, verify output
- [ ] Test: emergency flag present → correct reminder emitted
- [ ] Test: turn count persists across same session, resets on new sessionId
- [ ] Document hook registration in Phase 05 init flow

## Success Criteria
- Both hooks execute < 50ms on sample input.
- Emergency flag reminder fires when flag present.
- Trigger phrases + turn > 5 → reminder fires.
- `session-start.js` deletes flag atomically.

## Risks
- **Hook execution delay** → frustrates user. Mitigation: measure + cap. No network calls.
- **False positives on trigger phrases** → annoying. Mitigation: fire only after turn 5.
- **User declines hook approval** → L2 disabled. Mitigation: graceful degrade per brainstorm §10.2 (init proceeds with warning).
- **Race conditions on turn-count file** → negligible (single-user, sequential prompts).

## Security Considerations
- Hooks read stdin (Claude-provided), never write to user files outside `.claude/session-state/`.
- No network, no eval, no shell-out.

## Next Steps
- Phase 04 `/emergency-mode` command writes the flag these hooks consume.
- Phase 05 `init` registers hooks in settings.json.
