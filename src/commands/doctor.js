// sensei doctor — verify install, detect drift, surface issues.

import fs from 'node:fs';
import path from 'node:path';
import { verifyManifest, detectHookApproval } from '../lib/manifest.js';

const DRIFT_LIST_CAP = 10;

export default async function doctor() {
  const cwd = process.cwd();
  const targetRoot = path.join(cwd, '.claude');
  const result = verifyManifest(targetRoot);

  if (!result.present) {
    process.stdout.write('✗ Sensei not installed in this project.\n');
    process.stdout.write('  Run `sensei init` to install, or check your working directory.\n');
    return 1;
  }

  const emergencyFlag = path.join(targetRoot, 'session-state', 'sensei-emergency.flag');
  const emergencyActive = fs.existsSync(emergencyFlag);
  const hooksApproved = detectHookApproval(targetRoot);

  process.stdout.write(`Sensei Kit v${result.version}\n`);
  process.stdout.write(`Installed:        ${result.installed_at}\n`);
  process.stdout.write(`Files tracked:    ${result.ok.length + result.modified.length + result.missing.length}\n`);
  process.stdout.write(`  ✓ ok:           ${result.ok.length}\n`);

  if (result.modified.length) {
    process.stdout.write(`  ⚠ modified:     ${result.modified.length}\n`);
    printCapped(result.modified);
  }

  if (result.missing.length) {
    process.stdout.write(`  ✗ missing:      ${result.missing.length}\n`);
    printCapped(result.missing);
  }

  process.stdout.write(
    `\nHooks registered: ${hooksApproved ? 'yes' : 'no (L2 anti-drift disabled — check .claude/settings.json)'}\n`,
  );
  process.stdout.write(`Emergency flag:   ${emergencyActive ? 'ACTIVE (Tutor Mode OFF this session)' : 'inactive'}\n`);

  const clean = result.modified.length === 0 && result.missing.length === 0;
  if (!clean) {
    process.stdout.write('\nRun `sensei init --force` to restore modified/missing files.\n');
  }
  return clean ? 0 : 1;
}

function printCapped(list) {
  const shown = list.slice(0, DRIFT_LIST_CAP);
  for (const f of shown) process.stdout.write(`      - ${f}\n`);
  if (list.length > DRIFT_LIST_CAP) {
    process.stdout.write(`      … and ${list.length - DRIFT_LIST_CAP} more\n`);
  }
}
