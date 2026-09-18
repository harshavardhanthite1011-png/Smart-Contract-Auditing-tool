import { onchainRuntime } from '@midnight-ntwrk/midnight-js-protocol';
const StateValue = onchainRuntime.StateValue;
const sv = StateValue.newNull();
console.log("instanceof:", sv instanceof StateValue);
console.log("constructor name:", sv.constructor.name);
