# Sensei Kit

Mode system for Claude Code that flips the default from **code generator** → **mentor**.

Based on RCT evidence (1,222 participants): users who receive direct AI answers lose independent problem-solving capability within 10-15 minutes of interaction. Users who receive hints do not. Sensei protects productive struggle.

## Install

**npm (recommended):**

```
npx @sensei-kit/kit init
```

**Manual:**

```
git clone https://github.com/sensei-kit/sensei-kit
cp -r sensei-kit/kit/.claude/* your-project/.claude/
```

Both paths produce identical state. Hook approval required on first Claude Code run for full anti-drift coverage (graceful degrade if declined).

## Commands (inside Claude Code)

| Command | Purpose |
|---|---|
| `/struggle` | Signal frustration — Sensei pauses and decomposes |
| `/reveal` | Unlock full answer (cognitive-friction prompt first) |
| `/emergency-mode` | Disable Tutor Mode for this session (auto-re-enables) |
| `/sensei-review` | Weekly usage summary (Level 1 metrics, local only) |

## CLI

| Command | Purpose |
|---|---|
| `sensei init` | Install into `./.claude/` with diff-prompt on conflicts |
| `sensei doctor` | Verify state, version, drift (sha256) |
| `sensei uninstall` | Remove Sensei files (preserves user additions) |

## Status

Early alpha. Phase 1 dogfood. No telemetry, no network calls. All data stays local.

## License

Apache 2.0. See [LICENSE](./LICENSE).

## Docs

- [Installation](./docs/installation.md)
- [Decision Tree](./docs/decision-tree.md)
- [Metrics](./docs/metrics.md)
