import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  secret_passcode(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  merkle_path(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array[]];
  path_indices(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, boolean[]];
}

export type ImpureCircuits<PS> = {
  cast_vote(context: __compactRuntime.CircuitContext<PS>, choice_0: boolean): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  cast_vote(context: __compactRuntime.CircuitContext<PS>, choice_0: boolean): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  cast_vote(context: __compactRuntime.CircuitContext<PS>, choice_0: boolean): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly merkle_root: Uint8Array;
  nullifiers: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<[Uint8Array, boolean]>
  };
  readonly tally_yes: bigint;
  readonly tally_no: bigint;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               root_0: Uint8Array): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
