// Minimal stdin prompt wrapper.
// Single readline interface reused across all prompts — multiple prompts per
// session work correctly under piped stdin (a fresh interface per call would
// drain after the first answer and hang on the next).

import readline from 'node:readline';

let rl = null;

function getInterface() {
  if (!rl) {
    rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  }
  return rl;
}

export function closePrompt() {
  if (rl) {
    rl.close();
    rl = null;
  }
}

export function ask(question) {
  return new Promise((resolve) => {
    getInterface().question(question, (answer) => resolve(answer.trim()));
  });
}

// Choice prompt with single-letter shortcuts.
// choices: [{ key: 'o', label: 'overwrite' }, ...]
// defaultKey: returned on empty input.
export async function choose(question, choices, defaultKey) {
  const keys = choices.map((c) => (c.key === defaultKey ? c.key.toUpperCase() : c.key)).join('/');
  const labels = choices.map((c) => `${c.key}=${c.label}`).join(', ');
  const prompt = `${question} [${keys}] (${labels}): `;
  while (true) {
    const raw = (await ask(prompt)).toLowerCase();
    const key = raw === '' ? defaultKey : raw[0];
    const hit = choices.find((c) => c.key === key);
    if (hit) return hit.key;
    process.stdout.write(`  invalid — expected one of ${choices.map((c) => c.key).join(', ')}\n`);
  }
}

// Non-TTY guard — caller can detect scripting context and require --force.
export function isInteractive() {
  return Boolean(process.stdin.isTTY);
}
