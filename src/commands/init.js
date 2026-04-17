// sensei init — copy kit/.claude/* into target project's .claude/.
// Diff-first on conflicts. Writes manifest for clean uninstall + drift detection.
// Upgrade-safe: sweeps stale files from prior manifest before rewriting.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { walkFiles, copyFile, filesIdentical, diffSummary } from '../lib/copy.js';
import { writeManifest, readManifest, safeAbsolutePath } from '../lib/manifest.js';
import { choose, closePrompt, isInteractive } from '../lib/prompt.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

export default async function init(args = []) {
  const force = args.includes('--force');
  const cwd = process.cwd();
  const sourceRoot = path.resolve(__dirname, '..', '..', 'kit', '.claude');
  const targetRoot = path.join(cwd, '.claude');

  if (!fs.existsSync(sourceRoot)) {
    throw new Error(`sensei: source kit not found at ${sourceRoot}. Package may be corrupted — reinstall.`);
  }

  // Non-TTY stdin + no --force = refuse rather than hang on prompt.
  if (!isInteractive() && !force) {
    throw new Error('non-TTY stdin detected — use --force to accept overwrites or run interactively');
  }

  const pkg = require('../../package.json');
  const relFiles = walkFiles(sourceRoot);
  const installed = [];
  const overwrittenForRollback = [];
  let skipped = 0;

  process.stdout.write(`Sensei Kit v${pkg.version} → ${targetRoot}\n`);
  process.stdout.write(`Source files: ${relFiles.length}\n\n`);

  try {
    for (const rel of relFiles) {
      const src = path.join(sourceRoot, rel);
      const dst = path.join(targetRoot, rel);

      if (fs.existsSync(dst)) {
        if (filesIdentical(src, dst)) {
          installed.push(rel);
          continue;
        }
        if (force) {
          copyFile(src, dst);
          process.stdout.write(`  ✓ overwrote  ${rel}\n`);
          installed.push(rel);
          continue;
        }
        process.stdout.write(`\n  conflict: ${rel}\n`);
        process.stdout.write(`    ${diffSummary(src, dst)}\n`);
        const choice = await choose(
          '    action?',
          [
            { key: 'o', label: 'overwrite' },
            { key: 's', label: 'skip' },
            { key: 'a', label: 'abort' },
          ],
          's',
        );
        if (choice === 'a') {
          // Rollback: undo any files we newly created this run.
          // (Overwritten files cannot be restored — user was warned.)
          closePrompt();
          await rollback(installed, overwrittenForRollback, targetRoot);
          process.stdout.write('\n  aborted — new files rolled back.\n');
          return 1;
        }
        if (choice === 'o') {
          copyFile(src, dst);
          overwrittenForRollback.push(rel);
          installed.push(rel);
          process.stdout.write('    ✓ overwrote\n');
        } else {
          skipped += 1;
          process.stdout.write('    - skipped\n');
        }
      } else {
        copyFile(src, dst);
        installed.push(rel);
        process.stdout.write(`  ✓ installed  ${rel}\n`);
      }
    }
  } finally {
    closePrompt();
  }

  // Sweep stale files from prior manifest (upgrade path).
  const removedStale = sweepStale(targetRoot, installed);

  writeManifest(targetRoot, installed, { version: pkg.version });

  process.stdout.write(`\n✓ Sensei installed — ${installed.length} files tracked`);
  if (skipped) process.stdout.write(`, ${skipped} skipped`);
  if (removedStale) process.stdout.write(`, ${removedStale} stale files removed`);
  process.stdout.write('.\n');
  process.stdout.write('\nNext steps:\n');
  process.stdout.write('  1. Open the project in Claude Code.\n');
  process.stdout.write('  2. Approve hook registration when prompted (required for full anti-drift).\n');
  process.stdout.write('  3. Run `sensei doctor` to verify state.\n');
  process.stdout.write('\nIf you decline hook approval, L2 anti-drift is disabled — CLAUDE.md rules + output-style still apply.\n');
  return 0;
}

// Rollback newly created files on abort. Files that existed before this run
// (overwritten entries) cannot be restored from disk; surface that to the user.
async function rollback(installed, overwritten, targetRoot) {
  const toRemove = installed.filter((p) => !overwritten.includes(p));
  for (const rel of toRemove) {
    const abs = safeAbsolutePath(targetRoot, rel);
    if (!abs) continue;
    try {
      if (fs.existsSync(abs)) fs.unlinkSync(abs);
    } catch {
      // Non-fatal.
    }
  }
  if (overwritten.length) {
    process.stdout.write(`  note: ${overwritten.length} pre-existing files were overwritten and cannot be restored.\n`);
  }
}

// Remove files present in the prior manifest that aren't in the new install set.
// Returns count of removed stale files.
function sweepStale(targetRoot, currentRelFiles) {
  const prior = readManifest(targetRoot);
  if (!prior || !Array.isArray(prior.files)) return 0;
  const currentSet = new Set(currentRelFiles.map((r) => r.split(path.sep).join('/')));
  let removed = 0;
  for (const entry of prior.files) {
    if (currentSet.has(entry.path)) continue;
    const abs = safeAbsolutePath(targetRoot, entry.path);
    if (!abs) continue;
    try {
      if (fs.existsSync(abs)) {
        fs.unlinkSync(abs);
        removed += 1;
      }
    } catch {
      // Non-fatal.
    }
  }
  return removed;
}
