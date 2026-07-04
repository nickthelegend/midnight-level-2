import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// Midnight's runtime (compact-runtime, ledger, zkir) is WASM-backed and expects a
// handful of Node globals (Buffer/process). These plugins make that work in the
// browser. `target: esnext` is required for top-level await + BigInt literals.
export default defineConfig({
  plugins: [
    react(),
    wasm(),
    topLevelAwait(),
    nodePolyfills({
      globals: { Buffer: true, global: true, process: true },
      protocolImports: true,
    }),
  ],
  build: {
    target: 'esnext',
  },
  optimizeDeps: {
    // The onchain-runtime WASM must not be esbuild pre-bundled (it breaks
    // top-level-await); compact-runtime is safe to pre-bundle. Mirrors the
    // official example-bboard vite config.
    include: ['@midnight-ntwrk/compact-runtime'],
    exclude: [
      '@midnight-ntwrk/onchain-runtime-v3',
      '@midnight-ntwrk/onchain-runtime-v3/midnight_onchain_runtime_wasm_bg.wasm',
      '@midnight-ntwrk/onchain-runtime-v3/midnight_onchain_runtime_wasm.js',
    ],
    esbuildOptions: {
      target: 'esnext',
    },
  },
  worker: {
    format: 'es',
  },
});
