import type {
  Contract as GeneratedContract,
  Ledger,
  Witnesses,
} from '../../../managed/umbra/contract/index.js';
import type { UmbraPrivateState } from '../../contract/witnesses';

/** The compiled Umbra contract, specialised to our private-state type. */
export type UmbraContract = GeneratedContract<UmbraPrivateState, Witnesses<UmbraPrivateState>>;

/** The two circuits the frontend can call. */
export type UmbraCircuitId = 'post' | 'takeDown';

export type { Ledger as UmbraLedger };
export { BoardState } from '../../../managed/umbra/contract/index.js';

// ── UI-facing domain types ──────────────────────────────────────────────────

export type WalletInfo = {
  /** The key under `window.midnight` this wallet is injected at. */
  readonly key: string;
  readonly name: string;
  readonly icon: string;
  readonly apiVersion: string;
};

export type ConnectionPhase = 'disconnected' | 'connecting' | 'connected';

/** A read of the public, on-chain board state. */
export type BoardView = {
  readonly occupied: boolean;
  readonly message: string | null;
  /** Pseudonymous commitment of the author — a one-way hash, the only identity the chain sees. */
  readonly posterHex: string;
  readonly noticeCount: number;
};

export type LogKind = 'info' | 'ok' | 'warn' | 'err' | 'proof';
export type LogEntry = { readonly id: number; readonly t: string; readonly kind: LogKind; readonly message: string };

/** Which long-running action, if any, is in flight. */
export type Busy =
  | null
  | 'connecting'
  | 'deploying'
  | 'joining'
  | 'posting'
  | 'takingDown'
  | 'refreshing';
