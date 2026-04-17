---
phase: 07
status: pending
priority: medium
effort: 2-3 weeks (elapsed)
blockedBy: [phase-06]
blocks: []
---

# Phase 07 — Dogfood + Beta Prep

## Context
- REQUIREMENT.md §7 Phase 1 Roadmap ("Dogfood 1 week, iterate")
- REQUIREMENT.md §7 Phase 2 ("Recruit 5-10 devs, Level 1+2 measurement")

## Overview
1 week solo dogfood → iterate → recruit 5 friends for 2-week beta → measure.

## Requirements
- Self-use Sensei on real projects for 7 days.
- Daily pain-log in `plans/260417-1541-sensei-kit-design/dogfood-log.md`.
- Iterate CLAUDE.md / decision tree based on drift incidents.
- Recruit 5 dogfood friends with brief onboarding.
- Set up Level 1 measurement baseline.

## Implementation Steps

### 7.1 Self-Dogfood (Week 1)
1. Install Sensei into 2-3 of own projects.
2. Use for real work. Log:
   - Drift incidents (Claude gave direct answer)
   - False positives (trigger phrase over-fired)
   - `/emergency-mode` invocations + reasons
   - Tier escalation failures
3. End of week: review log, patch CLAUDE.md + decision tree + trigger-phrases.json.
4. Repeat if drift rate > 1/day.

### 7.2 Beta Recruit (Week 2)
1. Short onboarding doc (1 page): what Sensei is, how to install, what to watch for.
2. Recruit 5 devs. Mix: 2 juniors, 2 mid, 1 senior.
3. Shared Discord/Slack channel or weekly check-in cadence.
4. Install Sensei together in live session (catch install bugs).

### 7.3 Measurement (Weeks 2-4)
1. Collect `.claude/sensei/usage.jsonl` weekly (opt-in share).
2. Aggregate Level 1 metrics across 5 users.
3. Self-report via weekly async prompt: "Did you feel you understood problems better this week? (1-5) Why?"
4. Document patterns: top emergency reasons, trigger phrase hits, tier-escalation rate.

### 7.4 Go/No-Go
- **GO Phase 2 (scale)**: if 3+ of 5 dogfooders report qualitative capability gain, drift rate < 1/session, emergency rate < 20%.
- **PIVOT**: if drift consistent, revisit decision tree + CLAUDE.md.
- **STOP**: if users abandon within 3 days, Tutor Mode too heavy — reconsider.

## Related Files
### Create (during phase)
- `plans/260417-1541-sensei-kit-design/dogfood-log.md`
- `plans/260417-1541-sensei-kit-design/beta-onboarding.md`
- `plans/260417-1541-sensei-kit-design/week-N-metrics.md` (N = 1, 2, 3)

## Todo
- [ ] Install Sensei into own 2-3 projects
- [ ] Week 1: daily dogfood + log
- [ ] Week 1 end: patch CLAUDE.md + decision tree
- [ ] Draft beta-onboarding.md
- [ ] Recruit 5 devs
- [ ] Live install session with each
- [ ] Weeks 2-3: collect metrics
- [ ] Week 3 end: Go/No-Go decision

## Success Criteria
- Drift rate < 1/session after Week 1 iteration.
- ≥3/5 beta users report qualitative capability gain.
- All 5 users complete 2-week beta (retention signal).

## Risks
- **Zero drift incidents in week 1** → either excellent design OR user not doing hard enough problems. Investigate ambiguity.
- **Friends as biased users** → bake in "honest feedback only, even if negative" into onboarding.
- **Measurement bias** → self-reports are noisy. Complement with event-log proxies.

## Next Steps (Conditional on GO)
- Phase 2 public launch.
- Level 3 behavioral transfer test (per REQUIREMENT.md §6).
- Consider additional modes (Sparring Partner? Executor?) per §7 Phase 3.
