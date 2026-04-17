---
phase: 01
status: completed
priority: high
effort: 2-3 hours
blocks: [phase-02, phase-03, phase-04, phase-05]
---

# Phase 01 — Repo Scaffolding

## Context
- Brainstorm §4.1 — final repo structure
- Design: single-package monolith, `kit/` = source of truth, `.claude/` = dev-only

## Overview
Lay down the skeleton: package.json, .npmignore, LICENSE, empty kit/ tree, CLI stubs, docs skeleton. No logic yet.

## Requirements
- `package.json` configured for npm publish under `@sensei-kit/kit`.
- Binary `sensei` wired to `bin/cli.js`.
- Apache 2.0 LICENSE file.
- `.npmignore` strips dev boilerplate (plans/, .claude/, AGENTS.md, CLAUDE.md, tests/, .opencode/).
- Empty-but-structured `kit/.claude/` ready for Phase 02-04 content.

## Related Files
### Create
- `package.json`
- `.npmignore`
- `LICENSE` (Apache 2.0)
- `bin/cli.js` (stub: prints "not implemented")
- `src/commands/init.js` (stub)
- `src/commands/doctor.js` (stub)
- `src/commands/uninstall.js` (stub)
- `src/lib/manifest.js` (stub)
- `kit/.claude/CLAUDE.md` (placeholder, Phase 02)
- `kit/.claude/output-styles/.gitkeep`
- `kit/.claude/hooks/.gitkeep`
- `kit/.claude/skills/.gitkeep`
- `kit/.claude/commands/.gitkeep`
- `docs/.gitkeep`
- `README.md` (minimal, Phase 06 expands)
- `.gitignore` (node_modules, .claude/session-state — keep existing)

## Implementation Steps
1. `package.json`:
   ```json
   {
     "name": "@sensei-kit/kit",
     "version": "0.0.1",
     "description": "Mode system for Claude Code that flips default from code generator to mentor.",
     "bin": { "sensei": "./bin/cli.js" },
     "main": "src/index.js",
     "type": "module",
     "engines": { "node": ">=18" },
     "license": "Apache-2.0",
     "repository": "github:sensei-kit/sensei-kit",
     "files": ["bin/", "src/", "kit/", "docs/", "README.md", "LICENSE"],
     "keywords": ["claude-code", "tutor", "mentor", "learning", "anti-ai-dependency"]
   }
   ```
2. `.npmignore`:
   ```
   plans/
   .claude/
   .opencode/
   AGENTS.md
   CLAUDE.md
   REQUIREMENT*.md
   release-manifest.json
   tests/
   *.log
   ```
3. Download Apache 2.0 LICENSE text → `LICENSE`.
4. `bin/cli.js` stub with shebang + basic arg parse (commander or minimist — choose minimal dep).
5. `src/commands/*` stubs export a function, print "TODO" message.
6. Empty `.gitkeep` files in `kit/.claude/*` subdirs.
7. Verify `npm pack --dry-run` produces only files listed in `package.json.files`.

## Todo
- [ ] Write `package.json` with bin + files whitelist
- [ ] Write `.npmignore`
- [ ] Add `LICENSE` (Apache 2.0)
- [ ] Create `bin/cli.js` with shebang + arg parsing
- [ ] Create `src/commands/{init,doctor,uninstall}.js` stubs
- [ ] Create `src/lib/manifest.js` stub
- [ ] Create empty `kit/.claude/` subdirs
- [ ] Run `npm pack --dry-run` — verify only shipped files included
- [ ] `node bin/cli.js --help` smoke test

## Success Criteria
- `npm pack --dry-run` shows only: bin/, src/, kit/, docs/, README.md, LICENSE.
- `node bin/cli.js` prints help without error.
- Structure matches brainstorm §4.1.

## Risks
- **Accidentally shipping `.claude/` dev boilerplate** → verify with `npm pack --dry-run`.
- **CLI deps bloat** → use minimal parser (no yargs/commander, prefer minimist or parseArgs stdlib).

## Next Steps
- Unblocks Phase 02-05.
