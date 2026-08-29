import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum Severity { Safe = 0, Low = 1, Medium = 2, High = 3, Critical = 4 }

export type AuditRecord = { contract_hash: Uint8Array;
                            severity: Severity;
                            vulnerability_commitment: Uint8Array
                          };

export type VulnerabilityDetails = { language: Uint8Array;
                                     finding_type: Uint8Array;
                                     description: Uint8Array
                                   };

export type Witnesses<PS> = {
  vulnerability_witness(context: __compactRuntime.WitnessContext<Ledger, PS>,
                        audit_id_0: Uint8Array): [PS, VulnerabilityDetails];
}

export type ImpureCircuits<PS> = {
  submit_audit(context: __compactRuntime.CircuitContext<PS>,
               audit_id_0: Uint8Array,
               contract_hash_0: Uint8Array,
               severity_0: Severity,
               vulnerability_commitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  disclose_vulnerability(context: __compactRuntime.CircuitContext<PS>,
                         audit_id_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  submit_audit(context: __compactRuntime.CircuitContext<PS>,
               audit_id_0: Uint8Array,
               contract_hash_0: Uint8Array,
               severity_0: Severity,
               vulnerability_commitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  disclose_vulnerability(context: __compactRuntime.CircuitContext<PS>,
                         audit_id_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  submit_audit(context: __compactRuntime.CircuitContext<PS>,
               audit_id_0: Uint8Array,
               contract_hash_0: Uint8Array,
               severity_0: Severity,
               vulnerability_commitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  disclose_vulnerability(context: __compactRuntime.CircuitContext<PS>,
                         audit_id_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  audit_records: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): AuditRecord;
    [Symbol.iterator](): Iterator<[Uint8Array, AuditRecord]>
  };
  disclosed_vulnerabilities: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): VulnerabilityDetails;
    [Symbol.iterator](): Iterator<[Uint8Array, VulnerabilityDetails]>
  };
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
