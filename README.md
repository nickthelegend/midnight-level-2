# 🌒 Umbra — Midnight Academy, Level 2 (Waxing Crescent)

> **The first thread of light.** Level 1 sealed a privacy contract in shadow — it compiled,
> it was tested, but nothing could see it. Level 2 gives it a **face**: a real frontend, a real
> wallet (**Lace**), and a live deployment on Midnight's public testnet. Most of the work still
> rests in shadow; this is the deliberate edge we reveal.

Umbra is an **anonymous, verifiable notice board**. Anyone holding a secret key can pin a public
notice that everyone can read and trust came from a genuine key-holder — yet the chain never learns
*who*. It only ever sees a one-way **pseudonymous commitment**. Taking a notice down means
**proving, in zero knowledge, that you are its author** — without ever revealing the secret.

<p>
  <img alt="compiler" src="https://img.shields.io/badge/compact-0.30.0-4c1d95">
  <img alt="ledger" src="https://img.shields.io/badge/Midnight_ledger-8-1e293b">
  <img alt="wallet" src="https://img.shields.io/badge/wallet-Lace-6d28d9">
  <img alt="network" src="https://img.shields.io/badge/network-Testnet-8b7bf7">
  <img alt="frontend" src="https://img.shields.io/badge/frontend-Vite_+_React-16a34a">
</p>

---

## 🔗 Submission links

| | |
|---|---|
| **Live demo** | `<paste your Vercel/Netlify URL here>` |
| **Deployed contract address (testnet)** | `<paste after you run "Deploy a new board" — see below>` |
| **Demo video** (wallet connect + a circuit call) | `<paste your video link here>` |
| **Contract source** | [`contract/umbra.compact`](contract/umbra.compact) |

> ℹ️ The three placeholders above are the only things you fill in by hand. The contract address is
> produced the first time you click **Deploy a new board** in the app (it's printed in the activity
> log and shown under the board). Paste it here and into `.env` as `VITE_UMBRA_CONTRACT_ADDRESS`.

---

## 🔐 The privacy claim (what is proven without being shown)

Midnight runs a contract over **two kinds of state at once**, and *you* decide, line by line, what
crosses from private to public. The bridge is **`disclose()`** — any value derived from a `witness`
is "tainted", and the Compact compiler *refuses* to let it reach public ledger state until you wrap
it in `disclose()`. Privacy leaks become compile errors.

| | **Public ledger state** (on-chain, forever) | **Private witness** (this device only) |
|---|---|---|
| In Umbra | `state`, `message`, `poster` (a hash), `noticeCount` | `localSecretKey()` — your raw secret |
| Declared with | `export ledger …` | `witness …` |
| Role in a proof | The result the proof commits to | An input the proof *reasons about* but never reveals |

**Two observable privacy behaviours you can point a camera at:**

1. **Post pseudonymously.** When you `post`, the contract publishes `disclose(pseudonym(sk))` — a
   one-way hash of your secret — as the `poster`. Your secret key is *never* transmitted. On-chain,
   the author is a 32-byte commitment; there is no way back to the key.

   ```compact
   witness localSecretKey(): Bytes<32>;                 // PRIVATE — stays on your machine

   export circuit post(newMessage: Opaque<"string">): [] {
     const sk = localSecretKey();
     poster  = disclose(pseudonym(sk));                 // ⬅ publish ONLY a hash of the secret
     message = disclose(some(newMessage));
     state   = BoardState.occupied;
     noticeCount.increment(1);
   }
   ```

2. **Prove authorship to take down — without revealing it.** `takeDown` asserts the stored
   pseudonym re-derives from *your* secret. There is **no `disclose()`** here: the comparison feeds
   an assertion, so the secret and its pseudonym stay private. The chain learns only **pass or fail**.

   ```compact
   export circuit takeDown(): [] {
     const sk = localSecretKey();
     assert(poster == pseudonym(sk),                    // proven in zero knowledge
            "Umbra: only the original poster may take this notice down");
     state = BoardState.vacant;
     message = none<Opaque<"string">>();
   }
   ```

**How to *see* it in the demo:** connect Lace, deploy a board, and post a notice — the board shows a
`poster` hash, never your key. Open the app in a second browser with a **different** secret ("New
identity"), join the same address, and try **Take it down** → the proof fails
(*"only the original poster…"*). Switch back to the original secret → it succeeds. The right to
remove a notice was proven, the secret never shown.

---

## 🏗️ Architecture

```
Lace (browser wallet)  ──connect(networkId)──▶  DApp Connector API (CAIP-372, v4)
        │                                             │  getConfiguration() → indexer / prover / node URIs
        │                                             │  balanceUnsealedTransaction() / submitTransaction()
        ▼                                             ▼
  your secret key                         ┌─────────────────────────────┐
  (never leaves here)                     │        Midnight.js           │
                                          │  deployContract / callTx     │
   ┌───────── providers (src/lib/midnight/providers.ts) ─────────────┐  │
   │ zkConfigProvider   FetchZkConfigProvider(origin)  ← public/keys  │  │
   │ proofProvider      httpClientProofProvider(proverUri)  ─────────────▶ local proof server :6300
   │ publicDataProvider indexerPublicDataProvider(indexerUri)         │  │
   │ privateStateProvider  in-memory (secret restored from storage)   │  │
   │ walletProvider     balanceTx  → connector (hex serialize)        │  │
   │ midnightProvider   submitTx   → connector                        │  │
   └──────────────────────────────────────────────────────────────────┘  │
                                          └─────────────────────────────┘
```

- **Contract** — [`contract/umbra.compact`](contract/umbra.compact), compiled with `compact` to
  `managed/umbra/` (ZK circuits + prover/verifier keys). The two ZK circuits are `post` and `takeDown`.
- **Frontend** — Vite + React + TypeScript. The `useUmbra` hook ([`src/state/context.tsx`](src/state/context.tsx))
  orchestrates connect → deploy/join → post/takeDown and reads the public board state.
- **Wallet** — the DApp Connector API v4 (`@midnight-ntwrk/dapp-connector-api`). Proving is delegated
  to the wallet when supported, and falls back to a local HTTP proof server for Lace.

---

## 🚀 Run it locally

**Prerequisites**

- **Node 22** (`nvm use` picks it up from [`.nvmrc`](.nvmrc)).
- **Docker** — for the local ZK proof server.
- The **Lace** browser extension with Midnight support, set to the testnet.
- Some **tDUST** on your Lace address from the [Midnight testnet faucet](https://docs.midnight.network/).

```bash
nvm use                       # Node 22
npm install
npm run compile               # compile the Compact contract → managed/umbra/ (already committed)
npm run proof-server          # terminal 1: local ZK proof server on :6300 (needs Docker)
npm run dev                   # terminal 2: the app on http://localhost:5173
```

Then in the browser: **Connect Lace → Deploy a new board → Post a notice**. Watch the activity log.

> `npm run dev` and `npm run build` automatically run `sync-zk`, which copies the prover/verifier
> keys from `managed/umbra/` into `public/` so the browser can fetch them.

---

## 🌐 Deploy the frontend (live demo)

This is a static Vite app — any static host works. With [Vercel](https://vercel.com):

```bash
npm i -g vercel
vercel            # framework: Vite · build: npm run build · output: dist
```

[`vercel.json`](vercel.json) already sets the build command, output directory, and SPA fallback.
After it's live, paste the URL into the **Submission links** table above.

> The deployed demo can connect Lace and read on-chain state anywhere. **Proving still needs a proof
> server** the browser can reach (Lace does not yet prove in-wallet) — run `npm run proof-server`
> locally while you demo, or point Lace at a hosted prover in its settings.

See [`docs/DEPLOY.md`](docs/DEPLOY.md) for the full testnet deploy walk-through and how to capture the
verifiable contract address.

---

## ✅ Requirements → where they're met

| Level 2 requirement | Where |
|---|---|
| Lace connect / disconnect | [`src/lib/midnight/lace.ts`](src/lib/midnight/lace.ts), `TopBar` / `Hero` |
| Circuit called from the frontend | `post` & `takeDown` via [`src/lib/midnight/umbra.ts`](src/lib/midnight/umbra.ts) |
| Observable privacy behaviour (proven, not shown) | pseudonymous `post` + zero-knowledge `takeDown` — see above |
| Contract deployed to testnet with a verifiable address | in-app **Deploy a new board** → address in the table above |
| Local private state | secret key kept on-device; in-memory private-state provider |
| Minimum 8 meaningful commits | see the git history |

---

## 🧱 Tech stack

`@midnight-ntwrk/compact-js` · `midnight-js-contracts` · `midnight-js-types` ·
`dapp-connector-api` · `ledger-v8` · `midnight-js-{indexer-public-data,http-client-proof,fetch-zk-config}-provider`
· React 18 · Vite 5 · TypeScript 5 · compiled with `compact` 0.30.0 (language 0.22).

## 📁 Repository layout

```
contract/umbra.compact         the Compact contract (Level 1's, now with a UI)
managed/umbra/                 compiled circuits + ZK prover/verifier keys (committed)
src/contract/witnesses.ts      where the private witness gets its value
src/lib/midnight/              lace · providers · umbra client · in-memory private state
src/state/context.tsx          the useUmbra hook — all app orchestration
src/components/                crescent · topbar · hero · board · privacy · console · footer
scripts/                       compile summary · sync ZK assets to public/
```

## 📄 License

MIT.
