import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { connect as laceConnect, listWallets, type Connection } from '../lib/midnight/lace';
import { buildUmbraProviders } from '../lib/midnight/providers';
import { UmbraClient } from '../lib/midnight/umbra';
import { clock, fromHex, randomSecret, toHex } from '../lib/format';
import type { BoardView, Busy, ConnectionPhase, LogEntry, LogKind, WalletInfo } from '../lib/midnight/types';

/** Network to hint to the wallet. Midnight's public testnet is what the academy
 *  calls "Preprod". Override with VITE_UMBRA_NETWORK if needed. */
const NETWORK_HINT = import.meta.env.VITE_UMBRA_NETWORK ?? 'testnet';
const SECRET_KEY_STORAGE = 'umbra.secretKey';
const PREFILL_ADDRESS = import.meta.env.VITE_UMBRA_CONTRACT_ADDRESS ?? '';

export interface UmbraApi {
  readonly phase: ConnectionPhase;
  readonly wallets: WalletInfo[];
  readonly walletName: string | null;
  readonly address: string | null;
  readonly networkId: string;
  readonly configuredProver: string | null;
  readonly walletError: string | null;

  readonly contractAddress: string | null;
  readonly board: BoardView | null;
  /** The caller's private secret key, hex. Shown for transparency; NEVER sent. */
  readonly secretHex: string;
  readonly busy: Busy;
  readonly log: readonly LogEntry[];

  readonly joinInput: string;
  setJoinInput(v: string): void;
  readonly postInput: string;
  setPostInput(v: string): void;

  connect(): Promise<void>;
  disconnect(): void;
  deployBoard(): Promise<void>;
  joinBoard(): Promise<void>;
  post(): Promise<void>;
  takeDown(): Promise<void>;
  refresh(): Promise<void>;
  regenerateSecret(): void;
}

const Ctx = createContext<UmbraApi | null>(null);

export function useUmbra(): UmbraApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useUmbra must be used inside <UmbraProvider>');
  return ctx;
}

function loadSecret(): Uint8Array {
  try {
    const saved = localStorage.getItem(SECRET_KEY_STORAGE);
    if (saved && saved.length === 64) return fromHex(saved);
  } catch {
    /* ignore storage errors */
  }
  const fresh = randomSecret();
  try {
    localStorage.setItem(SECRET_KEY_STORAGE, toHex(fresh));
  } catch {
    /* ignore */
  }
  return fresh;
}

export function UmbraProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<ConnectionPhase>('disconnected');
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [networkId, setNetworkId] = useState<string>(NETWORK_HINT);
  const [configuredProver, setConfiguredProver] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);

  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [board, setBoard] = useState<BoardView | null>(null);
  const [secret, setSecret] = useState<Uint8Array>(() => loadSecret());
  const [busy, setBusy] = useState<Busy>(null);
  const [log, setLog] = useState<LogEntry[]>([]);

  const [joinInput, setJoinInput] = useState<string>(PREFILL_ADDRESS);
  const [postInput, setPostInput] = useState<string>('');

  const connectionRef = useRef<Connection | null>(null);
  const clientRef = useRef<UmbraClient | null>(null);
  const logId = useRef(0);

  const say = useCallback((kind: LogKind, message: string) => {
    setLog((prev) => [...prev.slice(-60), { id: logId.current++, t: clock(new Date()), kind, message }]);
  }, []);

  useEffect(() => {
    setWallets(listWallets());
  }, []);

  const connect = useCallback(async () => {
    setWalletError(null);
    setBusy('connecting');
    setPhase('connecting');
    say('info', `Requesting connection to a Midnight wallet on "${NETWORK_HINT}"…`);
    try {
      const connection = await laceConnect(NETWORK_HINT);
      connectionRef.current = connection;
      setWalletName(connection.walletName);
      setAddress(connection.address);
      setNetworkId(connection.config.networkId || NETWORK_HINT);
      setConfiguredProver(connection.config.proverServerUri ?? null);
      setPhase('connected');
      say('ok', `Connected to ${connection.walletName} · ${connection.address.slice(0, 18)}…`);
      if (!connection.config.proverServerUri) {
        say('warn', 'Wallet did not advertise a prover URI — falling back to http://localhost:6300');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setWalletError(message);
      setPhase('disconnected');
      say('err', message);
    } finally {
      setBusy(null);
    }
  }, [say]);

  const disconnect = useCallback(() => {
    connectionRef.current = null;
    clientRef.current = null;
    setPhase('disconnected');
    setWalletName(null);
    setAddress(null);
    setConfiguredProver(null);
    setContractAddress(null);
    setBoard(null);
    setPostInput('');
    say('info', 'Disconnected. Your secret key stays on this device.');
  }, [say]);

  const refresh = useCallback(async () => {
    const client = clientRef.current;
    if (!client) return;
    setBusy('refreshing');
    try {
      const view = await client.read();
      setBoard(view);
    } catch (err) {
      say('err', `Could not read board state: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(null);
    }
  }, [say]);

  const attach = useCallback(
    async (client: UmbraClient, addr: string) => {
      clientRef.current = client;
      setContractAddress(addr);
      const view = await client.read();
      setBoard(view);
    },
    [],
  );

  const deployBoard = useCallback(async () => {
    const connection = connectionRef.current;
    if (!connection) return;
    setBusy('deploying');
    say('info', 'Building providers and a fresh deploy transaction…');
    try {
      const providers = await buildUmbraProviders(connection, say);
      say('proof', 'Generating the ZK proof for the constructor (this can take a moment)…');
      const client = await UmbraClient.deploy(providers, secret);
      await attach(client, client.address);
      say('ok', `Board deployed. Contract address: ${client.address}`);
      setJoinInput(client.address);
    } catch (err) {
      say('err', `Deploy failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(null);
    }
  }, [attach, say, secret]);

  const joinBoard = useCallback(async () => {
    const connection = connectionRef.current;
    if (!connection) return;
    const addr = joinInput.trim();
    if (!addr) {
      say('warn', 'Enter a deployed contract address to join.');
      return;
    }
    setBusy('joining');
    say('info', `Joining board ${addr.slice(0, 18)}…`);
    try {
      const providers = await buildUmbraProviders(connection, say);
      const client = await UmbraClient.join(providers, addr, secret);
      await attach(client, addr);
      say('ok', 'Joined. Reading the public board state.');
    } catch (err) {
      say('err', `Join failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(null);
    }
  }, [attach, joinInput, say, secret]);

  const post = useCallback(async () => {
    const client = clientRef.current;
    if (!client) return;
    const message = postInput.trim();
    if (!message) {
      say('warn', 'Write a notice first.');
      return;
    }
    setBusy('posting');
    say('proof', 'Proving `post` — publishing only a pseudonymous commitment of your key…');
    try {
      const txId = await client.post(message);
      say('ok', `Notice posted. tx ${txId.slice(0, 18)}…`);
      setPostInput('');
      await refresh();
    } catch (err) {
      say('err', `Post failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(null);
    }
  }, [postInput, refresh, say]);

  const takeDown = useCallback(async () => {
    const client = clientRef.current;
    if (!client) return;
    setBusy('takingDown');
    say('proof', 'Proving `takeDown` — showing in zero knowledge that you are the author…');
    try {
      const txId = await client.takeDown();
      say('ok', `Notice taken down. tx ${txId.slice(0, 18)}…`);
      await refresh();
    } catch (err) {
      say('err', `Take-down failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(null);
    }
  }, [refresh, say]);

  const regenerateSecret = useCallback(() => {
    const fresh = randomSecret();
    try {
      localStorage.setItem(SECRET_KEY_STORAGE, toHex(fresh));
    } catch {
      /* ignore */
    }
    setSecret(fresh);
    say('warn', 'New secret key generated — you now post under a different pseudonym.');
  }, [say]);

  // Gentle polling so the public board stays fresh while a board is open.
  useEffect(() => {
    if (!contractAddress) return;
    const id = setInterval(() => {
      if (!busy) void refresh();
    }, 9000);
    return () => clearInterval(id);
  }, [contractAddress, busy, refresh]);

  const value = useMemo<UmbraApi>(
    () => ({
      phase,
      wallets,
      walletName,
      address,
      networkId,
      configuredProver,
      walletError,
      contractAddress,
      board,
      secretHex: toHex(secret),
      busy,
      log,
      joinInput,
      setJoinInput,
      postInput,
      setPostInput,
      connect,
      disconnect,
      deployBoard,
      joinBoard,
      post,
      takeDown,
      refresh,
      regenerateSecret,
    }),
    [
      phase, wallets, walletName, address, networkId, configuredProver, walletError,
      contractAddress, board, secret, busy, log, joinInput, postInput,
      connect, disconnect, deployBoard, joinBoard, post, takeDown, refresh, regenerateSecret,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
