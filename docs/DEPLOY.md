# Deploying Umbra to Midnight testnet

This walks through getting a **verifiable contract address** on Midnight's public testnet (what the
academy calls "Preprod") and putting the frontend online.

## 1. Prerequisites

- **Node 22** — `nvm use` (reads [`.nvmrc`](../.nvmrc)).
- **Docker** — runs the zero-knowledge proof server.
- **Lace** browser extension with Midnight support, switched to the **testnet**.
- **tDUST** in your Lace wallet — request it from the Midnight testnet faucet
  (see the [Midnight docs](https://docs.midnight.network/)). Deploying and calling circuits costs a
  small tDUST fee, so the wallet needs a balance.

## 2. Start the proof server

Lace does not yet generate proofs in-wallet, so the DApp uses a local proof server. In its own
terminal:

```bash
npm run proof-server     # midnightntwrk/proof-server on http://localhost:6300
```

Leave it running for the whole session. In Lace's settings, make sure the prover URI points at
`http://localhost:6300` (the app also falls back to that automatically).

## 3. Compile the contract (already committed)

```bash
npm run compile          # compact compile contract/umbra.compact managed/umbra
```

You'll see the two ZK circuits (`post`, `takeDown`), each with a prover + verifier key. The output
under `managed/umbra/` is committed, so this step is only needed if you change the contract.

## 4. Run the app and deploy a board

```bash
npm install
npm run dev              # http://localhost:5173
```

In the browser:

1. **Connect Lace** — approve the connection in the extension.
2. **Deploy a new board** — this builds a deploy transaction, proves the constructor (via the proof
   server), and Lace balances + submits it. Approve the fee in Lace.
3. When it lands, the **contract address** appears under the board and in the activity log. **This is
   your verifiable, on-chain address.** Copy it.

## 5. Record the address

- Paste the address into the **Submission links** table in [`README.md`](../README.md).
- Add it to `.env` as `VITE_UMBRA_CONTRACT_ADDRESS=…` so the app pre-fills the "Join" field and
  visitors land on your board.

Anyone can now **Join** that address (even with a different wallet) and read the same public board —
that's the on-chain verification.

## 6. Put the frontend online

```bash
npm i -g vercel
vercel                  # Vite · build: npm run build · output dir: dist
```

Paste the resulting URL into the README. Note: the hosted page can connect Lace and read chain state
anywhere, but **proving still needs a reachable proof server** — keep `npm run proof-server` running
while you demo, or configure a hosted prover in Lace.

## 7. Demo video checklist

Capture a short clip showing:

1. **Connect** Lace (and, to show disconnect, click **Disconnect** once).
2. **Deploy** a board (or join an existing one) — show the address.
3. **Post** a notice — point out the `poster` is a hash, not your key.
4. **Take it down** — the zero-knowledge authorship proof succeeds for you; show it *fails* with a
   different secret ("New identity") to make the privacy claim observable.

## Troubleshooting

- **"No Midnight wallet found"** — install/enable Lace (Midnight build) and reload. The app looks for
  `window.midnight` instances implementing DApp Connector API v4.
- **Proof takes a while / times out** — the first proof compiles keys and can take 30–90s; make sure
  the proof server container is running and reachable at the URI Lace advertises.
- **Deploy fails with a balance error** — top up tDUST from the faucet.
- **State doesn't refresh** — the app polls every ~9s and after each action; use **Refresh** to force a read.
