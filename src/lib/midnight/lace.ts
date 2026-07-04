import type { ConnectedAPI, InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import type { WalletInfo } from './types';

/**
 * Thin wrapper over the Midnight DApp Connector API (CAIP-372 style). Wallets
 * inject one or more `InitialAPI` instances under `window.midnight`, keyed by a
 * UUID/rdns. We discover them, let the user connect, and read the wallet's own
 * service configuration (indexer / prover / node URIs) so the DApp honours the
 * user's chosen endpoints.
 */

export type Connection = {
  readonly walletKey: string;
  readonly walletName: string;
  readonly api: ConnectedAPI;
  /** Shielded address in Bech32m — what we show and use to scope private state. */
  readonly address: string;
  readonly coinPublicKey: string;
  readonly encryptionPublicKey: string;
  readonly config: Configuration;
};

export type Configuration = {
  indexerUri: string;
  indexerWsUri: string;
  proverServerUri?: string;
  substrateNodeUri: string;
  networkId: string;
};

/** Every Midnight wallet currently injected into the page. */
export function listWallets(): WalletInfo[] {
  const injected = window.midnight ?? {};
  return Object.entries(injected).map(([key, api]) => ({
    key,
    name: api?.name ?? key,
    icon: api?.icon ?? '',
    apiVersion: api?.apiVersion ?? '?',
  }));
}

/** Pick a wallet: prefer Lace, else the first injected instance. */
export function pickWallet(preferredName = 'lace'): { key: string; api: InitialAPI } | null {
  const injected = window.midnight ?? {};
  const entries = Object.entries(injected);
  if (entries.length === 0) return null;
  const laceEntry = entries.find(
    ([key, api]) => new RegExp(preferredName, 'i').test(api?.name ?? '') || /lace/i.test(key),
  );
  const [key, api] = laceEntry ?? entries[0]!;
  return { key, api: api! };
}

/**
 * Connect to a wallet, hinting the desired network. Resolves once the user
 * approves in Lace. Reads the shielded address and the service configuration.
 */
export async function connect(networkId: string, preferredName?: string): Promise<Connection> {
  const picked = pickWallet(preferredName);
  if (!picked) {
    throw new Error(
      'No Midnight wallet found. Install the Lace (Midnight) browser extension, then reload.',
    );
  }
  const api = await picked.api.connect(networkId);
  const [addresses, config] = await Promise.all([api.getShieldedAddresses(), api.getConfiguration()]);
  return {
    walletKey: picked.key,
    walletName: picked.api.name ?? picked.key,
    api,
    address: addresses.shieldedAddress,
    coinPublicKey: addresses.shieldedCoinPublicKey,
    encryptionPublicKey: addresses.shieldedEncryptionPublicKey,
    config: config as Configuration,
  };
}

/** Ask the wallet whether the connection is still live (e.g. after a reload). */
export async function isStillConnected(api: ConnectedAPI): Promise<boolean> {
  try {
    const status = await api.getConnectionStatus();
    return status.status === 'connected';
  } catch {
    return false;
  }
}
