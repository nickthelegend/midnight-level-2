import { CompiledContract } from '@midnight-ntwrk/compact-js';
import {
  deployContract,
  findDeployedContract,
  type FoundContract,
} from '@midnight-ntwrk/midnight-js-contracts';
import { Contract, ledger } from '../../../managed/umbra/contract/index.js';
import { createUmbraPrivateState, witnesses, type UmbraPrivateState } from '../../contract/witnesses';
import { toHex } from '../format';
import { PRIVATE_STATE_ID, type UmbraProviders } from './providers';
import { BoardState, type BoardView } from './types';

/**
 * The Umbra compiled contract: the generated contract class, plus our witness
 * implementations, plus a pointer to its compiled assets. Proving keys are
 * fetched at runtime by the providers' zkConfigProvider.
 *
 * `Contract<UmbraPrivateState>` in value position is a TypeScript instantiation
 * expression — the generated contract class specialised to our private state.
 */
export const compiledUmbra = CompiledContract.make<Contract<UmbraPrivateState>>(
  'Umbra',
  Contract<UmbraPrivateState>,
).pipe(
  CompiledContract.withWitnesses(witnesses),
  CompiledContract.withCompiledFileAssets('./managed/umbra'),
);

/**
 * A live handle on one Umbra board: deploy a fresh one or join an existing one,
 * then call its circuits and read its public state.
 */
export class UmbraClient {
  private constructor(
    private readonly providers: UmbraProviders,
    private readonly contract: FoundContract<Contract<UmbraPrivateState>>,
    readonly address: string,
  ) {}

  /** Deploy a brand-new board; the constructor runs and the board starts vacant. */
  static async deploy(providers: UmbraProviders, secret: Uint8Array): Promise<UmbraClient> {
    const deployed = await deployContract(providers, {
      compiledContract: compiledUmbra,
      privateStateId: PRIVATE_STATE_ID,
      initialPrivateState: createUmbraPrivateState(secret),
    });
    return new UmbraClient(providers, deployed, deployed.deployTxData.public.contractAddress);
  }

  /** Join a board someone already deployed, at its on-chain address. */
  static async join(providers: UmbraProviders, address: string, secret: Uint8Array): Promise<UmbraClient> {
    const found = await findDeployedContract(providers, {
      contractAddress: address,
      compiledContract: compiledUmbra,
      privateStateId: PRIVATE_STATE_ID,
      initialPrivateState: createUmbraPrivateState(secret),
    });
    return new UmbraClient(providers, found, address);
  }

  /** Pin a notice. Publishes the message + a pseudonym; never the secret. */
  async post(message: string): Promise<string> {
    const result = await this.contract.callTx.post(message);
    return result.public.txId;
  }

  /** Take the current notice down — proves authorship in zero knowledge. */
  async takeDown(): Promise<string> {
    const result = await this.contract.callTx.takeDown();
    return result.public.txId;
  }

  /** Read the public, on-chain board state via the indexer. */
  async read(): Promise<BoardView> {
    const state = await this.providers.publicDataProvider.queryContractState(this.address);
    if (!state) {
      return { occupied: false, message: null, posterHex: '', noticeCount: 0 };
    }
    const board = ledger(state.data);
    return {
      occupied: board.state === BoardState.occupied,
      message: board.message.is_some ? board.message.value : null,
      posterHex: toHex(board.poster),
      noticeCount: Number(board.noticeCount),
    };
  }
}
