# Metrics

Sensei measures its own effectiveness. All data is **local** — stored in `.claude/sensei/usage.jsonl`, never transmitted.

## Levels (per research methodology)

### Level 1 — Proxy metrics (implemented)

Lightweight event log. Hooks and commands append one JSON line per significant event.

**Event types:**
- `emergency_invoked` — user ran `/emergency-mode`, reason captured
- `reveal_invoked` — user ran `/reveal`
- `struggle_invoked` — user ran `/struggle`

**Derived metrics (via `/sensei-review`):**
- Session count
- Per-session invocation rates for emergency / reveal / struggle
- Top emergency reasons (clustered)
- Weekly trend (if data spans >7 days)

**Interpretation:**

| Pattern | Possible meaning |
|---|---|
| High emergency rate | Scope too ambitious, or Sensei friction poorly calibrated |
| High reveal rate, low struggle rate | Hints aren't specific enough — user jumps to `/reveal` |
| High struggle rate, low reveal rate | User engages with the process but hits dead ends |
| Low all-around | Either Sensei isn't active, or user has found a steady rhythm |

**Non-interpretation:** Sensei never autotags sessions as "good" or "bad". `/sensei-review` shows numbers and asks one reflective question. Interpretation is the user's.

### Level 2 — Self-report (deferred)

Post-session 1-5 capability rating ("Did you understand the problem better?") and weekly check-in ("Can you solve last week's problem without AI now?").

**Status:** deferred to Phase 2. Adds UX surface that Phase 1 MVP can't afford to debug.

**Workaround for Phase 1:** users can add their own notes inline in `.claude/sensei/usage.jsonl` with type `note`. `/sensei-review` will surface them.

### Level 3 — Behavioral transfer test (Phase 2+)

Controlled comparison: two groups of dogfooders, one with Sensei, one with vanilla Claude Code, for 2 weeks. Then both run a no-AI test. Compare.

**Status:** Phase 2+ research. Not part of MVP.

## Event Log Schema

Path: `.claude/sensei/usage.jsonl`

Each line is a complete JSON object. Schema is additive — unknown fields ignored.

```json
{"type":"emergency_invoked","reason":"production bug","ts":"2026-04-17T14:23:09Z","sessionId":"s123"}
{"type":"reveal_invoked","ts":"2026-04-17T14:45:02Z","sessionId":"s123"}
{"type":"struggle_invoked","ts":"2026-04-17T15:10:44Z","sessionId":"s124"}
```

**Required fields:** `type`, `ts`
**Optional fields:** `sessionId`, `reason` (for emergency), `note` (for manual annotations)

## Privacy

- File lives in user project, in `.claude/sensei/`.
- Never transmitted anywhere. No opt-in, no opt-out — Sensei does not have the capability to send telemetry.
- To clear history: delete `.claude/sensei/usage.jsonl`.
- To ignore in source control: add to `.gitignore`:
  ```
  .claude/sensei/
  .claude/session-state/
  ```

## Validation Thresholds (Phase 1 → Phase 2)

Proceed to Phase 2 beta launch when, across 5+ dogfood users over 2 weeks:
- Emergency rate < 20% of sessions
- At least 3 of 5 users report qualitative capability gain
- All 5 users complete the 2-week beta (retention signal)

See `../plans/260417-1541-sensei-kit-design/phase-07-dogfood-beta.md` for the full validation plan.
