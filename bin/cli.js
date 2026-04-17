#!/usr/bin/env node
import init from '../src/commands/init.js';
import doctor from '../src/commands/doctor.js';
import uninstall from '../src/commands/uninstall.js';

const HELP = `sensei — mode system for Claude Code that flips default to mentor.

Usage:
  sensei init [--force]         Install Tutor Mode into ./.claude/
  sensei doctor                 Verify install state + drift detection
  sensei uninstall              Remove Sensei files (preserves user additions)
  sensei --help                 Show this help
  sensei --version              Show version

Docs: https://github.com/sensei-kit/sensei-kit
`;

const [, , cmd, ...rest] = process.argv;

if (!cmd || cmd === '--help' || cmd === '-h') {
  process.stdout.write(HELP);
  process.exit(0);
}

if (cmd === '--version' || cmd === '-v') {
  const { createRequire } = await import('node:module');
  const pkg = createRequire(import.meta.url)('../package.json');
  process.stdout.write(`${pkg.version}\n`);
  process.exit(0);
}

const commands = { init, doctor, uninstall };
const fn = commands[cmd];
if (!fn) {
  process.stderr.write(`sensei: unknown command "${cmd}"\n\n${HELP}`);
  process.exit(1);
}

try {
  const code = await fn(rest);
  process.exit(code ?? 0);
} catch (err) {
  process.stderr.write(`sensei: ${err.message}\n`);
  process.exit(1);
}
