import {
  Transaction,
  type Binding,
  type FinalizedTransaction,
  type Proof,
  type SignatureEnabled,
  type TransactionId,
} from '@midnight-ntwrk/ledger-v8';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import {
  createProofProvider,
  type MidnightProvider,
  type MidnightProviders,
  type ProofProvider,
  type UnboundTransaction,
  type WalletProvider,
} from '@midnight-ntwrk/midnight-js-types';
import { fromHex, toHex } from '@midnight-ntwrk/midnight-js-utils';
import type { Connection } from './lace';
import { inMemoryPrivateStateProvider } from './in-memory-private-state';
import type { LogKind, UmbraCircuitId } from './types';
import type { UmbraPrivateState } from '../../contract/witnesses';

/** Key under which Umbra's private state (the secret key) is stored. */
export const PRIVATE_STATE_ID = 'umbraPrivateState';

/** Fallback prover if the wallet advertises none (Lace users run one locally). */
const DEFAULT_PROVER_URI = 'http://localhost:6300';

export type UmbraProviders = MidnightProviders<UmbraCircuitId, typeof PRIVATE_STATE_ID, UmbraPrivateState>;

type Say = (kind: LogKind, message: string) => void;

/**
 * Assemble the six midnight-js providers from a connected wallet.
 *
 * The interesting part is the two adapters that bridge midnight-js (which works
 * with ledger transaction *objects*) to the DApp Connector API (which works
 * with hex *strings*): `balanceTx` and `submitTx`. This mirrors the official
 * example-bboard `BrowserDeployedBoardManager`.
 */
export async function buildUmbraProviders(connection: Connection, say?: Say): Promise<UmbraProviders> {
  const { api, config, coinPublicKey, encryptionPublicKey } = connection;

  // Serialization must use the same network id the wallet is on.
  setNetworkId(config.networkId || 'testnet');

  // ZK artifacts (prover/verifier keys + zkir) are served as static files from
  // this app's own origin — see scripts/sync-zk-assets.mjs.
  const zkConfigProvider = new FetchZkConfigProvider<UmbraCircuitId>(
    window.location.origin,
    fetch.bind(window),
  );

  // Proving: prefer wallet-delegated proving when the wallet supports it
  // (e.g. 1AM). Lace does not yet, so fall back to an HTTP proof server.
  let proofProvider: ProofProvider;
  const delegated = (api as { getProvingProvider?: unknown }).getProvingProvider;
  if (typeof delegated === 'function') {
    try {
      const provingProvider = await api.getProvingProvider(zkConfigProvider.asKeyMaterialProvider());
      proofProvider = createProofProvider(provingProvider);
      say?.('info', 'Proving is delegated to your wallet.');
    } catch {
      proofProvider = httpClientProofProvider(config.proverServerUri ?? DEFAULT_PROVER_URI, zkConfigProvider);
      say?.('info', `Proving via proof server ${config.proverServerUri ?? DEFAULT_PROVER_URI}`);
    }
  } else {
    proofProvider = httpClientProofProvider(config.proverServerUri ?? DEFAULT_PROVER_URI, zkConfigProvider);
    say?.('info', `Proving via proof server ${config.proverServerUri ?? DEFAULT_PROVER_URI}`);
  }

  const walletProvider: WalletProvider = {
    getCoinPublicKey: () => coinPublicKey,
    getEncryptionPublicKey: () => encryptionPublicKey,
    // Send the unbalanced, proven tx to the wallet to pay fees + balance it.
    balanceTx: async (tx: UnboundTransaction): Promise<FinalizedTransaction> => {
      const serialized = toHex(tx.serialize());
      const received = await api.balanceUnsealedTransaction(serialized);
      return Transaction.deserialize<SignatureEnabled, Proof, Binding>(
        'signature',
        'proof',
        'binding',
        fromHex(received.tx),
      );
    },
  };

  const midnightProvider: MidnightProvider = {
    // The wallet relays the balanced+sealed tx; the id comes from the tx itself.
    submitTx: async (tx: FinalizedTransaction): Promise<TransactionId> => {
      await api.submitTransaction(toHex(tx.serialize()));
      return tx.identifiers()[0]!;
    },
  };

  return {
    privateStateProvider: inMemoryPrivateStateProvider<typeof PRIVATE_STATE_ID, UmbraPrivateState>(),
    publicDataProvider: indexerPublicDataProvider(
      config.indexerUri,
      config.indexerWsUri,
      // Use the browser's native WebSocket for indexer subscriptions.
      WebSocket as unknown as Parameters<typeof indexerPublicDataProvider>[2],
    ),
    zkConfigProvider,
    proofProvider,
    walletProvider,
    midnightProvider,
  };
}
