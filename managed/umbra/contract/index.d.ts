import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum BoardState { vacant = 0, occupied = 1 }

export type Witnesses<PS> = {
  localSecretKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  post(context: __compactRuntime.CircuitContext<PS>, newMessage_0: string): __compactRuntime.CircuitResults<PS, []>;
  takeDown(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  post(context: __compactRuntime.CircuitContext<PS>, newMessage_0: string): __compactRuntime.CircuitResults<PS, []>;
  takeDown(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  post(context: __compactRuntime.CircuitContext<PS>, newMessage_0: string): __compactRuntime.CircuitResults<PS, []>;
  takeDown(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly state: BoardState;
  readonly message: { is_some: boolean, value: string };
  readonly poster: Uint8Array;
  readonly noticeCount: bigint;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
