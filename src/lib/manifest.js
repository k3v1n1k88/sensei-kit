// Manifest = record of files Sensei installed into the target project.
// Drives clean uninstall + drift detection via sha256.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const MANIFEST_NAME = '.sensei-manifest.json';
export const MANIFEST_SCHEMA_VERSION = 1;

export function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

// Normalize path separators for cross-platform manifest entries.
export function normalize(rel) {
  return rel.split(path.sep).join('/');
}

export function manifestPath(targetClaudeDir) {
  return path.join(targetClaudeDir, MANIFEST_NAME);
}

// Validate a manifest-supplied relative path stays inside targetRoot.
// Returns the absolute path if safe, null otherwise.
// Uses path.relative for tree-bounds check — startsWith is vulnerable to
// sibling-prefix confusion (e.g., /tmp/foo vs /tmp/foobar).
export function safeAbsolutePath(targetRoot, entryPath) {
  const abs = path.resolve(targetRoot, entryPath);
  const rel = path.relative(targetRoot, abs);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return abs;
}

export function writeManifest(targetClaudeDir, relFiles, meta = {}) {
  if (!meta.version) throw new Error('manifest: version is required');
  const files = relFiles.map((rel) => {
    const abs = path.join(targetClaudeDir, rel);
    return { path: normalize(rel), sha256: sha256File(abs) };
  });
  const manifest = {
    manifest_version: MANIFEST_SCHEMA_VERSION,
    version: meta.version,
    installed_at: new Date().toISOString(),
    ...meta,
    files,
  };
  fs.writeFileSync(manifestPath(targetClaudeDir), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

export function readManifest(targetClaudeDir) {
  const p = manifestPath(targetClaudeDir);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

export function verifyManifest(targetClaudeDir) {
  const manifest = readManifest(targetClaudeDir);
  if (!manifest) return { present: false };
  const result = {
    present: true,
    version: manifest.version,
    installed_at: manifest.installed_at,
    missing: [],
    modified: [],
    ok: [],
  };
  for (const entry of manifest.files) {
    const abs = safeAbsolutePath(targetClaudeDir, entry.path);
    if (!abs) {
      // Out-of-tree entry — treat as missing, flag loud to surface tamper.
      result.missing.push(`${entry.path} (out-of-tree — manifest may be tampered)`);
      continue;
    }
    if (!fs.existsSync(abs)) {
      result.missing.push(entry.path);
      continue;
    }
    const actual = sha256File(abs);
    if (actual !== entry.sha256) result.modified.push(entry.path);
    else result.ok.push(entry.path);
  }
  return result;
}

// Detect hook approval by reading .claude/settings.json for hook registration.
// Claude Code stores hook paths under `hooks.user-prompt-submit` and `hooks.session-start`.
// Returns true if BOTH Sensei hook paths are present.
export function detectHookApproval(targetClaudeDir) {
  const settingsPath = path.join(targetClaudeDir, 'settings.json');
  if (!fs.existsSync(settingsPath)) return false;
  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    const hooks = settings.hooks || {};
    const serialized = JSON.stringify(hooks);
    return (
      serialized.includes('user-prompt-submit.js') &&
      serialized.includes('session-start.js')
    );
  } catch {
    return false;
  }
}
