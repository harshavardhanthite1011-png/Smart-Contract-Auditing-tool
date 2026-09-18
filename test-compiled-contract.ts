import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

async function main() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const zkConfigPath = path.resolve(__dirname, 'contracts', 'managed', 'PrivateVoting');
  const contractPath = path.join(zkConfigPath, 'contract', 'index.js');
  let PrivateVoting = await import(pathToFileURL(contractPath).href);

  console.log("prototype keys:", Object.getOwnPropertyNames(PrivateVoting.Contract.prototype));
}
main();
