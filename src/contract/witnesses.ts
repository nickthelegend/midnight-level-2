import { type WitnessContext } from '@midnight-ntwrk/compact-runtime';
import { type Ledger } from '../../managed/umbra/contract/index.js';

/**
 * Umbra's PRIVATE state. This lives only in the browser (persisted to IndexedDB
 * via the level-private-state-provider). It is fed into the ZK prover to satisfy
 * the `localSecretKey` witness, but it never appears in a transaction, in the
 * public ledger, or in the proof output.
 */
export type UmbraPrivateState = {
  readonly secretKey: Uint8Array;
};

export const createUmbraPrivateState = (secretKey: Uint8Array): UmbraPrivateState => ({
  secretKey,
});

/**
 * The witness implementations the contract declares. The Compact contract only
 * declares `witness localSecretKey(): Bytes<32>;` — here we say where that
 * secret actually comes from (the local private state).
 */
export const witnesses = {
  localSecretKey: (
    context: WitnessContext<Ledger, UmbraPrivateState>,
  ): [UmbraPrivateState, Uint8Array] => [context.privateState, context.privateState.secretKey],
};
