import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

async function main() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const zkConfigPath = path.resolve(__dirname, 'contracts', 'managed', 'PrivateVoting');
  const contractPath = path.join(zkConfigPath, 'contract', 'index.js');
  let PrivateVoting = await import(pathToFileURL(contractPath).href);

  const witnesses = {
    secret_passcode: () => [undefined, new Uint8Array(0)],
    merkle_path: () => [undefined, []],
    path_indices: () => [undefined, []],
  };

  const instance = new PrivateVoting.Contract(witnesses);
  try {
    const s = instance.initialState({
      initialPrivateState: { dummy: false },
      initialZswapLocalState: { coinPublicKey: new Uint8Array(32) }
    }, new Uint8Array(32));
    console.log("State type:", typeof s);
    console.log("State:", s);
    console.log("Private State type:", s.currentPrivateState.constructor.name);
  } catch (e) {
    console.error("Error calling initialState:", e);
  }
}
main();
