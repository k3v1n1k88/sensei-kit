# Installation

Two equivalent install paths. Both produce the same files and the same state.

## Prerequisites

- [Claude Code](https://docs.claude.com/en/docs/claude-code) installed
- Node.js ≥ 18 (for the npm path; manual path has no runtime dependency)

## Path 1 — npm (recommended)

```
npx @sensei-kit/kit init
```

Run this at the root of the project where you want Tutor Mode active. The command:

1. Reads `kit/.claude/` from the package.
2. Copies each file into `./.claude/`. If a target file already exists, it shows a compact diff summary and prompts you: `overwrite / skip / abort`.
3. Writes `.claude/.sensei-manifest.json` — a record of installed files + sha256 hashes. Drives `sensei doctor` and `sensei uninstall`.
4. Prints next steps.

Use `--force` to overwrite all conflicts without prompting (useful for upgrades).

## Path 2 — manual

```
git clone https://github.com/k3v1n1k88/sensei-kit
cp -r sensei-kit/kit/.claude/* your-project/.claude/
```

This is the same files the CLI copies, minus the manifest. You lose drift detection and clean uninstall. Recommended only if you distrust npm or you're working air-gapped.

## First Claude Code run

When you open the project in Claude Code for the first time after install:

1. Claude Code will prompt you to approve hook registration — this is the `UserPromptSubmit` and `SessionStart` hooks Sensei uses for L2 anti-drift.
2. Approve to enable full anti-drift coverage.
3. If you decline, Sensei still works — CLAUDE.md rules and the `sensei-tutor` output style apply. Only the hook-based reminders are disabled.

Run `sensei doctor` any time to verify install state, check for drift, and confirm hook status.

## What gets installed

```
your-project/.claude/
├── CLAUDE.md                                ← Tutor Mode system prompt + top-5 decision router
├── output-styles/sensei-tutor.md            ← Response shape enforcement
├── hooks/
│   ├── user-prompt-submit.js                ← L2 anti-drift (trigger phrases + turn count + emergency flag)
│   ├── session-start.js                     ← Clears emergency flag on new session
│   └── _lib/trigger-phrases.json            ← Detected phrases
├── skills/socratic-hint/SKILL.md            ← 17-situation decision catalog + 4-tier logic
└── commands/
    ├── struggle.md                          ← /struggle
    ├── reveal.md                            ← /reveal
    ├── emergency-mode.md                    ← /emergency-mode
    └── sensei-review.md                     ← /sensei-review
```

Plus `.sensei-manifest.json` (npm path only).

## Existing `.claude/CLAUDE.md`

Sensei will never silently clobber an existing `CLAUDE.md`. The npm install shows a diff summary and prompts. Recommended merge strategy:

- **If your existing CLAUDE.md is project-specific**: choose **skip** on the prompt, then manually merge Sensei's Tutor Mode persona and red lines into your file.
- **If your existing CLAUDE.md is minimal**: choose **overwrite** and manually re-add your project specifics on top.
- **If you're unsure**: choose **abort**, make a backup, then re-run.

## Uninstall

```
sensei uninstall
```

Removes only files listed in the manifest. Files you authored (anything not installed by Sensei) are preserved.

## Upgrading

Currently: re-run `sensei init --force` with the newer version. This overwrites tracked files with the new content. A proper `sensei update` command with three-way merge is deferred to a future release.

## Uninstall (manual path)

If you installed manually (no manifest), you'll need to delete the files yourself. The list above shows what Sensei installed.

## Troubleshooting

- **`sensei doctor` reports modified files**: either you edited them deliberately (re-run `init --force` to reset) or they drifted for some other reason.
- **`sensei doctor` reports missing files**: run `sensei init --force`.
- **Hooks never fire**: check Claude Code's hook approval status in its settings. Hooks must be approved per project.
- **Emergency flag stuck ON**: run Sensei's `session-start.js` hook manually or delete `.claude/session-state/sensei-emergency.flag`.
