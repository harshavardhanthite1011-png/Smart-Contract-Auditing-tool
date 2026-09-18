import { onchainRuntime, compactRuntime } from '@midnight-ntwrk/midnight-js-protocol';
try {
  const sv1 = compactRuntime.StateValue.newNull();
  const bytes = sv1.encode();
  const sv2 = onchainRuntime.StateValue.decode(bytes);
  console.log("Decoded successfully!");
  const cs = new onchainRuntime.ChargedState(sv2);
  console.log("ChargedState constructed successfully!");
} catch (e) {
  console.log("Failed:", e);
}
