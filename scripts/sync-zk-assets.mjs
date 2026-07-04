// Copies the compiled ZK assets (prover/verifier keys + zkir) from the committed
// `managed/umbra/` directory into `public/` so the browser can fetch them at
// runtime via FetchZkConfigProvider.
//
// Runs automatically before `dev` and `build` (see the predev/prebuild hooks).
// The keys are large binaries generated from the contract, so `public/keys` and
// `public/zkir` are gitignored — `managed/` is the source of truth.
import { cp, mkdir, rm, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('..', import.meta.url);
const pairs = [
  ['managed/umbra/keys', 'public/keys'],
  ['managed/umbra/zkir', 'public/zkir'],
];

async function exists(url) {
  try {
    await access(url);
    return true;
  } catch {
    return false;
  }
}

for (const [from, to] of pairs) {
  const src = new URL(from, root);
  const dst = new URL(to, root);
  if (!(await exists(src))) {
    console.error(
      `\n  ✗ ${from} is missing. Compile the contract first:  npm run compile\n`,
    );
    process.exit(1);
  }
  await rm(dst, { recursive: true, force: true });
  await mkdir(dst, { recursive: true });
  await cp(src, dst, { recursive: true });
  console.log(`  ✓ synced ${from} → ${to}`);
}

console.log(`  ZK assets ready under ${fileURLToPath(new URL('public', root))}`);
