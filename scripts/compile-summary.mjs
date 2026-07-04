// Prints a clean, screenshot-friendly summary of the Compact compile output.
// Run automatically by `npm run compile` after `compact compile`.
import { readFileSync } from 'node:fs';

const info = JSON.parse(
  readFileSync(new URL('../managed/umbra/compiler/contract-info.json', import.meta.url)),
);

const line = '─'.repeat(64);
console.log(line);
console.log('  Umbra · Waxing Crescent — Compact compile summary');
console.log(line);
console.log(
  `  compiler ${info['compiler-version']}   ·   language ${info['language-version']}   ·   runtime ${info['runtime-version']}`,
);
console.log('');
console.log(`  ZK circuits (${info.circuits.length}) — each gets a prover + verifier key:`);
for (const c of info.circuits) {
  const args = c.arguments
    .map((a) => `${a.name}: ${a.type.tsType ?? a.type['type-name']}`)
    .join(', ');
  console.log(`    • ${c.name}(${args})   proof=${c.proof}`);
}
console.log('');
console.log(`  Private witnesses (${info.witnesses.length}) — never leave the prover, never on-chain:`);
for (const w of info.witnesses) {
  const rt = w['result type'] ?? w['result-type'];
  console.log(`    • ${w.name}() → Bytes<${rt.length}>`);
}
console.log('');
console.log('  Generated → managed/umbra/{ contract/  keys/  zkir/ }');
console.log(line);
