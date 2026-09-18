import { resolveNetwork, getDeployment } from './src/network.js';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const zkConfigPath = path.resolve(__dirname, 'contracts', 'managed', 'PrivateVoting');
const contractPath = path.join(zkConfigPath, 'contract', 'index.js');
const PrivateVoting = await import(pathToFileURL(contractPath).href);

const { config } = resolveNetwork();
const pdp = indexerPublicDataProvider(config.indexer, config.indexerWS);
const dep = getDeployment('preview');
if (dep) {
  const state = await pdp.queryContractState(dep.address);
  if (state) {
    const l = PrivateVoting.ledger(state.data);
    console.log('tally_yes:', l.tally_yes);
    console.log('tally_no:', l.tally_no);
  }
}
process.exit(0);
