import { onchainRuntime, compactRuntime } from '@midnight-ntwrk/midnight-js-protocol';

const state300 = onchainRuntime.StateValue.newNull();
const callDataState = new onchainRuntime.ChargedState(state300);

const state310 = compactRuntime.StateValue.newNull();
const contractState = new compactRuntime.ContractState(new compactRuntime.ChargedState(state310), BigInt(0));

contractState.data = new (contractState.data.constructor as any)(
  (contractState.data.state.constructor as any).decode(callDataState.state.encode())
);
console.log("Success! contractState.data is", contractState.data.constructor.name);
