import type { ContractAddress, SigningKey } from '@midnight-ntwrk/compact-runtime';
import type { PrivateStateId, PrivateStateProvider } from '@midnight-ntwrk/midnight-js-types';

/**
 * A minimal in-memory private-state provider — the same approach the official
 * browser example (example-bboard) uses. Umbra's only private state is the
 * secret key, and that is restored from localStorage on each visit, so there is
 * no need for encrypted, persistent storage in the browser. Private states are
 * keyed by id; signing keys are keyed by contract address.
 */
export function inMemoryPrivateStateProvider<
  PSI extends PrivateStateId = PrivateStateId,
  PS = unknown,
>(): PrivateStateProvider<PSI, PS> {
  const states = new Map<PSI, PS>();
  const signingKeys = new Map<ContractAddress, SigningKey>();

  const unsupported = (): never => {
    throw new Error('export/import is not supported by the in-memory private state provider');
  };

  return {
    setContractAddress() {
      /* single-contract app: no scoping needed */
    },
    async set(privateStateId, state) {
      states.set(privateStateId, state);
    },
    async get(privateStateId) {
      return states.has(privateStateId) ? (states.get(privateStateId) as PS) : null;
    },
    async remove(privateStateId) {
      states.delete(privateStateId);
    },
    async clear() {
      states.clear();
    },
    async setSigningKey(address, signingKey) {
      signingKeys.set(address, signingKey);
    },
    async getSigningKey(address) {
      return signingKeys.get(address) ?? null;
    },
    async removeSigningKey(address) {
      signingKeys.delete(address);
    },
    async clearSigningKeys() {
      signingKeys.clear();
    },
    exportPrivateStates: unsupported,
    importPrivateStates: unsupported,
    exportSigningKeys: unsupported,
    importSigningKeys: unsupported,
  };
}
