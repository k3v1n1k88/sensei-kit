// Recursive copy helpers with conflict-diff summary.

import fs from 'node:fs';
import path from 'node:path';

// Walk a directory, yielding relative file paths. Skips .gitkeep placeholders.
export function walkFiles(rootDir) {
  const results = [];
  const stack = [''];
  while (stack.length) {
    const rel = stack.pop();
    const abs = path.join(rootDir, rel);
    const entries = fs.readdirSync(abs, { withFileTypes: true });
    for (const e of entries) {
      const childRel = path.join(rel, e.name);
      if (e.isDirectory()) {
        stack.push(childRel);
      } else if (e.isFile()) {
        if (e.name === '.gitkeep') continue;
        results.push(childRel);
      }
    }
  }
  return results;
}

export function copyFile(src, dst) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
}

// Compact byte-level diff summary for the conflict prompt. Not a full diff —
// just enough signal for user to choose overwrite/skip/abort.
export function diffSummary(srcPath, dstPath) {
  const srcSize = fs.statSync(srcPath).size;
  const dstSize = fs.statSync(dstPath).size;
  return `source: ${srcSize} bytes, existing: ${dstSize} bytes — content differs`;
}

export function filesIdentical(a, b) {
  if (!fs.existsSync(a) || !fs.existsSync(b)) return false;
  const bufA = fs.readFileSync(a);
  const bufB = fs.readFileSync(b);
  return bufA.equals(bufB);
}
