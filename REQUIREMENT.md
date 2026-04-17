# Sensei - Project Specification

> A mode system for Claude Code that helps developers learn more effectively, countering AI dependency that erodes independent problem-solving capability.

---

## 1. Background & Motivation

### The Core Problem
Research based on an RCT with 1,222 participants reveals:
- AI improves performance in-the-moment but reduces independent work capability and persistence when AI is removed
- Negative effects appear remarkably fast — within just 10-15 minutes of interaction
- Users who rely on AI for **direct answers** suffer the worst impact
- Users who engage AI for **hints or clarification** do not experience capability decline

### Product Hypothesis
If Claude is configured to act as a mentor (asking questions, providing tiered hints, scaffolding) rather than a code generator (giving immediate answers), users will preserve and develop their independent problem-solving capability.

---

## 2. Strategic Decisions (Locked)

| Decision | Rationale |
|---|---|
| **Name: Sensei** | Short, memorable, reflects mentor philosophy, doesn't collide with existing AI concepts |
| **Target: Claude Code users (developers)** | Audience accepts friction, has strong infrastructure (skills/agents/hooks), faster feedback loop |
| **Start with a single Tutor Mode** | Avoid mode proliferation, validate hypothesis first |
| **Manual install first, NO CLI** | Low-cost, validate product-market fit before investing in tooling |
| **Escape hatch via `/emergency-mode`** | Respect users, prevent abandonment. Includes friction and meta-awareness. |
| **Explicit decision tree, NOT vague rules** | Prevent Claude from drifting back to default behavior after a few turns |
| **Measurement at Level 1 + Level 2 for Phase 1** | Proxy metrics + self-report, sufficient to validate hypothesis |

---

## 3. Core Design Principles

### 3.1. Mentor Philosophy
Sensei operates like a good mentor:
- Asks questions instead of providing answers
- Delivers hints in layers, from open-ended to specific
- Knows when to stay silent so the user can struggle productively
- Adapts to the user's current capability level

### 3.2. Productive Struggle
Protect "productive struggle" — the process of wrestling with problems that helps users discover their own capability and develop real skills. This is the core value.

### 3.3. Respect User Agency
Users are adults. No forcing, no moral lecturing. Provide tools, escape hatches, and meta-awareness — let users decide.

### 3.4. Anti-Drift
Every behavior must be encoded as explicit rules. "It depends on the situation" = drift back to default behavior within 5-10 turns.

---

## 4. Tutor Mode Architecture

### 4.1. Directory Structure
```
sensei/
├── .claude/
│   ├── CLAUDE.md              # Main system prompt for Tutor Mode
│   ├── skills/
│   │   └── socratic-hint/     # Skill for tiered hint delivery
│   │       └── SKILL.md
│   └── commands/
│       ├── struggle.md        # /struggle - user reports being stuck
│       ├── reveal.md          # /reveal - unlock answer after multiple attempts
│       └── emergency-mode.md  # /emergency-mode - temporarily disable Tutor Mode
├── docs/
│   ├── installation.md        # Manual installation guide
│   ├── decision-tree.md       # Decision tree (to be built with you)
│   └── metrics.md             # Measurement methodology
└── README.md
```

### 4.2. Four Core Components

**(1) System Prompt (CLAUDE.md)**
- Defines the mentor persona
- Explicit rules of engagement
- Non-negotiable red lines
- Decision tree for common situations

**(2) Behavioral Skills**
- `socratic-hint` skill with 4-tier logic:
  - Level 1: Open-ended question
  - Level 2: Directional hint
  - Level 3: Pseudo-code or structure
  - Level 4: Full answer (only when user genuinely needs it)

**(3) Escape Hatches**
- `/reveal`: Unlock the answer after user has attempted 2-3 times
- `/emergency-mode`: Disable Tutor Mode for the current session

**(4) Meta-awareness**
- End of session: Claude reflects on the interaction
- Weekly summary: `/emergency-mode` usage rate, learning patterns

---

## 5. Escape Hatch Design

### 5.1. `/emergency-mode` Command

**Friction layer:**
- Name clearly signals the behavior: "you are bypassing learning mode"
- Confirmation: "You're disabling Tutor Mode for this session. What's the reason? (so mentor can suggest adjustments later)"
- Scope limited: only disabled for current session; new session re-enables mode automatically

**Meta-awareness:**
- End-of-week: "You used emergency-mode X/Y sessions this week — is the scope too ambitious?"
- Track frequency to suggest difficulty adjustments

### 5.2. Escape Hatch Principle
A good mentor DOES NOT REFUSE to help when the student genuinely needs it. Distinguish between:
- Laziness → maintain Tutor Mode
- Genuine urgency → allow conscious bypass

---

## 6. Measurement Strategy

### Phase 1: Level 1 + Level 2

**Level 1 — Proxy Metrics:**
- Ratio of `/emergency-mode` calls / total sessions
- Conversation length before user "gives up"
- Return frequency at 7-day / 30-day marks
- Number of modes user tried before settling

**Level 2 — Self-reported Outcomes:**
- Post-session popup: "Did you feel you understood the problem better? (1-5)"
- Weekly check-in: "Can you solve last week's problem without AI now?"
- Track trend over time

### Phase 2+ (after validation): Level 3 — Behavioral Transfer Test

Recruit 10 friends, split into two groups:
- Group A: Use Sensei Tutor Mode for 2 weeks
- Group B: Use regular Claude Code for 2 weeks
- Then: run a no-AI test, compare results

---

## 7. Roadmap

### Phase 0: Foundation (THIS WEEK)
- [ ] Complete Decision Tree (15+ situations)
- [ ] Review decision tree with collaborator (me)
- [ ] Draft system prompt v1 based on decision tree
- [ ] Set up repo structure

### Phase 1: Tutor Mode MVP (2-3 weeks)
- [ ] Build system prompt + socratic-hint skill
- [ ] Implement `/reveal` and `/emergency-mode`
- [ ] Write manual install guide (copy `.claude/` into project)
- [ ] Dogfood: use it yourself for 1 week
- [ ] Iterate based on pain points

### Phase 2: Beta Testing (2 weeks)
- [ ] Recruit 5-10 developer friends
- [ ] Set up Level 1 + Level 2 measurement
- [ ] Weekly feedback sessions
- [ ] Document uncovered edge cases

### Phase 3: Expansion (conditional)
- Only if Phase 2 shows positive evidence
- Add 1-2 more modes (Sparring Partner? Executor?)
- Consider CLI if complexity justifies it
- Run Behavioral Transfer Test (Level 3)

---

## 8. What You Need to Do BEFORE Writing Code

### 8.1. Decision Tree (highest priority)

Write at least **15 situations** in this format:

```
Situation: [What the user says/does]
Context: [Where they are in the learning process]
Claude SHOULD: [Specific action]
Claude SHOULD NOT: [Anti-pattern to avoid]
Good response example: [1-2 sentences]
```

**Situations to cover:**

Already suggested 5 situations:
1. User asks about a new concept for the first time
2. User pastes buggy code and asks "fix this for me"
3. User asks "how do I do X" (X is a specific task)
4. User has tried 2-3 times without success, seems frustrated
5. User invokes `/emergency-mode`

**You need to come up with 10 more situations**, covering cases like:
- User copy-pastes homework from school/courses
- User asks about advanced concepts but hasn't grasped basics
- User disagrees with the hint, argues back
- User goes silent / doesn't respond to hints
- User asks unrelated questions (e.g., weather)
- User uses Tutor Mode for actual production work
- User already understands, just needs quick syntax
- User asks about best practices / architecture decisions
- User wants code review on already-written code
- User is a senior dev learning new tech (not a beginner)

### 8.2. Validate Branding

Search "Sensei" on:
- npm registry (any conflicting packages?)
- GitHub (any conflicting repos?)
- Domains (sensei.dev, sensei-ai.com, etc.)
- Trademark database

If Sensei has heavy conflicts, backup names: Scaffold, Socratic, Compass.

### 8.3. Write a 1-Sentence Pitch

Write one sentence explaining Sensei to a developer who knows nothing about it. This sentence becomes the north star for every design decision down the line.

Suggested format: "Sensei is [what] that helps [who] [achieve what] without [what problem]."

---

## 9. Anti-patterns to Avoid

- ❌ Building multiple modes in parallel before validating one
- ❌ Building a CLI before you have 20+ real users
- ❌ Writing vague system prompts like "it depends on the situation"
- ❌ Skipping the escape hatch because "education is what matters"
- ❌ Measuring only by user "feelings"
- ❌ Copy-pasting recommendations from the research paper without thinking about your context
- ❌ Applying Tutor Mode to every user type (students vs senior devs)
- ❌ Naming the product before positioning is clear

---

## 10. Open Questions (no answers yet)

Questions to think about during the build, not to answer immediately:

1. Should Tutor Mode differentiate between "learning code syntax" vs "learning system design"? These require different strategies.
2. After users have been on Sensei for months, should Claude's behavior adapt?
3. If the user is part of a team, should mode state be shareable across members?
4. Monetization: free forever, or a pro tier later?
5. Open source from day one? Trade-off between community contribution and commercial potential.

---

## Next Step

1. **Build your Decision Tree (15+ situations)** — spend 1-2 hours of focused time
2. **Send it back to me** — I'll review, challenge, and point out edge cases
3. **After decision tree is validated** → we draft system prompt v1 together

Good luck building! 🚀
