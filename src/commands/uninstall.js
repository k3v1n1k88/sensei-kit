// sensei uninstall — manifest-driven removal. Preserves user-authored files.

import fs from 'node:fs';
import path from 'node:path';
import { readManifest, manifestPath, safeAbsolutePath } from '../lib/manifest.js';
import { choose, closePrompt } from '../lib/prompt.js';

export default async function uninstall(args = []) {
  const force = args.includes('--force');
  const cwd = process.cwd();
  const targetRoot = path.join(cwd, '.claude');
  const manifest = readManifest(targetRoot);

  if (!manifest) {
    process.stdout.write('Nothing to uninstall — no manifest found at .claude/.sensei-manifest.json.\n');
    return 0;
  }

  if (!force) {
    process.stdout.write(`This will remove ${manifest.files.length} files installed by Sensei v${manifest.version}.\n`);
    process.stdout.write('User-authored files NOT in the manifest will be preserved.\n');
    const choice = await choose(
      'Continue?',
      [
        { key: 'y', label: 'yes' },
        { key: 'n', label: 'no' },
      ],
      'n',
    );
    closePrompt();
    if (choice !== 'y') {
      process.stdout.write('Aborted.\n');
      return 0;
    }
  }

  let removed = 0;
  const parentDirs = new Set();

  for (const entry of manifest.files) {
    const abs = safeAbsolutePath(targetRoot, entry.path);
    if (!abs) {
      process.stderr.write(`  ✗ refusing out-of-tree path: ${entry.path}\n`);
      continue;
    }
    try {
      if (fs.existsSync(abs)) {
        fs.unlinkSync(abs);
        removed += 1;
        // Walk ancestor chain up to targetRoot so every empty dir gets a chance to be removed.
        let dir = path.dirname(abs);
        while (dir !== targetRoot) {
          const rel = path.relative(targetRoot, dir);
          if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) break;
          parentDirs.add(dir);
          dir = path.dirname(dir);
        }
      }
    } catch (err) {
      process.stderr.write(`  ✗ could not remove ${entry.path}: ${err.message}\n`);
    }
  }

  // Deepest-first so inner dirs empty before outer.
  const sorted = [...parentDirs].sort((a, b) => b.length - a.length);
  for (const dir of sorted) {
    try {
      if (fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
    } catch {
      // Non-fatal.
    }
  }

  try {
    fs.unlinkSync(manifestPath(targetRoot));
  } catch {
    // Non-fatal.
  }

  process.stdout.write(`\n✓ Sensei uninstalled — ${removed} files removed. User additions preserved.\n`);
  return 0;
}
