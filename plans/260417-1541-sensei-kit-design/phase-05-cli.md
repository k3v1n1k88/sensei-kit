---
phase: 05
status: completed
priority: high
effort: 3-5 hours
blockedBy: [phase-01]
blocks: [phase-06]
---

# Phase 05 — CLI (init, doctor, uninstall)

## Context
- Brainstorm §4.2 (install UX), §10.2 (hook UX graceful degrade)
- Thin CLI — ≤300 LOC total across all commands

## Overview
Three commands: `init` (copy kit/.claude → target, manifest-driven), `doctor` (verify state + version + drift), `uninstall` (reverse via manifest). All Node ≥18 stdlib only where possible.

## Key Insights
- Manual copy path must produce identical result → CLI is literally `cp -r kit/.claude/* target/.claude/` + manifest bookkeeping.
- Never silently clobber existing files → diff-first, prompt merge/overwrite/abort.
- Manifest (`target/.claude/.sensei-manifest.json`) records installed files for clean uninstall + drift detection.

## Requirements
- `sensei init` (aliases: `npx @sensei-kit/kit init`):
  - Detect existing `.claude/CLAUDE.md` → diff preview + prompt.
  - Copy `kit/.claude/*` → `target/.claude/*`.
  - Write `.sensei-manifest.json` with {version, files[], installed_at, hooks_approved}.
  - Print hook-approval reminder.
  - Warn on `--force` bypassing diff prompt.
- `sensei doctor`:
  - Read manifest; verify each listed file exists + unmodified (sha256).
  - Report: version, missing files, drifted files, hook registration status.
  - Exit 0 if clean, 1 otherwise.
- `sensei uninstall`:
  - Read manifest → delete listed files.
  - Preserve user-authored additions (anything NOT in manifest).
  - Delete empty parent dirs.
  - Delete manifest last.

## Related Files
### Create
- `bin/cli.js` (entry + arg routing)
- `src/commands/init.js`
- `src/commands/doctor.js`
- `src/commands/uninstall.js`
- `src/lib/manifest.js` (read/write/hash helpers)
- `src/lib/copy.js` (recursive copy with diff detection)
- `src/lib/prompt.js` (minimal readline wrapper)

## Implementation Steps

### 5.1 `bin/cli.js` (entry)
```javascript
#!/usr/bin/env node
import { parseArgs } from 'node:util';
import init from '../src/commands/init.js';
import doctor from '../src/commands/doctor.js';
import uninstall from '../src/commands/uninstall.js';

const [, , cmd, ...rest] = process.argv;
const commands = { init, doctor, uninstall };
const fn = commands[cmd];
if (!fn) {
  console.log(`Usage: sensei <init|doctor|uninstall> [--force]`);
  process.exit(cmd ? 1 : 0);
}
await fn(rest);
```

### 5.2 `src/commands/init.js`
Logic:
1. Resolve `targetDir = process.cwd()/.claude`.
2. Resolve `sourceDir = __dirname/../../kit/.claude`.
3. For each file in sourceDir:
   - If target exists AND content differs: show diff, prompt `[m]erge / [o]verwrite / [s]kip / [a]bort`.
   - If target doesn't exist: copy.
4. Write `.sensei-manifest.json`:
   ```json
   {
     "version": "0.0.1",
     "installed_at": "<iso>",
     "files": [
       { "path": "CLAUDE.md", "sha256": "..." },
       ...
     ],
     "hooks_approved": false
   }
   ```
5. Print: "✓ Sensei installed. Hooks require approval on first Claude Code run. If declined, run `sensei doctor` to check state."

### 5.3 `src/commands/doctor.js`
1. Read `target/.claude/.sensei-manifest.json`. If missing → "Sensei not installed." Exit 1.
2. For each file in manifest: check existence + sha256 match.
3. Report:
   ```
   Sensei Kit v0.0.1
   - Installed: 2026-04-17
   - Files: 12/12 present
   - Drift: 0 modified, 0 missing
   - Hooks: approved (or WARNING: not approved → L2 anti-drift disabled)
   - Emergency flag: inactive
   ```
4. Exit 0 if clean.

### 5.4 `src/commands/uninstall.js`
1. Read manifest. Confirm: "Remove Sensei from this project? [y/N]"
2. Delete each file in manifest.
3. Walk up dirs, delete if empty.
4. Delete manifest last.
5. Print: "✓ Sensei removed. User-authored files preserved."

### 5.5 `src/lib/manifest.js`
- `writeManifest(targetDir, files)` — compute sha256 per file, write JSON.
- `readManifest(targetDir)` — read JSON, return null if missing.
- `verifyManifest(targetDir)` — returns `{present, modified, missing}`.

### 5.6 `src/lib/copy.js`
- `walk(dir)` — yield relative file paths.
- `diff(sourceContent, targetContent)` — simple line-count + unified-diff preview.
- `copyFile(src, dst)` — mkdir -p + writeFile.

## Todo
- [ ] Implement `bin/cli.js` arg routing
- [ ] Implement `init.js` with diff + prompt
- [ ] Implement `doctor.js` with sha256 verification
- [ ] Implement `uninstall.js` with manifest-driven removal
- [ ] Implement `src/lib/manifest.js`
- [ ] Implement `src/lib/copy.js`
- [ ] Implement `src/lib/prompt.js` (readline)
- [ ] Manual test: init into empty dir → manifest written
- [ ] Manual test: init into dir with existing CLAUDE.md → diff prompt
- [ ] Manual test: doctor on clean install → exit 0
- [ ] Manual test: modify CLAUDE.md → doctor reports drift
- [ ] Manual test: uninstall → manifest files removed, user files preserved
- [ ] `npm pack && npm install -g ./sensei-kit-0.0.1.tgz` → global install smoke test

## Success Criteria
- All 3 commands implemented, ≤300 LOC total.
- `init` never silently clobbers.
- `doctor` correctly detects drift via sha256.
- `uninstall` preserves user-authored additions.
- Zero runtime dependencies (Node stdlib only) OR single minimal dep (e.g., minimist).

## Risks
- **Windows path separator bugs** → use `path.posix` for manifest entries, normalize on read.
- **Interrupted `init`** (Ctrl-C mid-copy) → partial state. Mitigation: write manifest LAST; `doctor` reports orphan files.
- **Hook approval detection** → Claude Code doesn't expose API for "approved" state. Set `hooks_approved: false` initially; user updates via `--hooks-approved` flag after approving.

## Security Considerations
- No shell-outs to `cp`/`rm` — stdlib only.
- No network calls in CLI.
- Manifest sha256 prevents silent file substitution.

## Next Steps
- Phase 06 docs reference these commands.
- Phase 07 dogfood validates end-to-end install.
