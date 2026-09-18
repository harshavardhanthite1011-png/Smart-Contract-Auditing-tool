import { compactRuntime } from '@midnight-ntwrk/midnight-js-protocol';
const sv = compactRuntime.StateValue.newNull();
const cs = new compactRuntime.ChargedState(sv);
console.log("cs.encode:", typeof (cs as any).encode);
console.log("cs.state.encode:", typeof cs.state.encode);
