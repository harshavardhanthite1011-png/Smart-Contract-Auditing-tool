import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { resolveNetwork, getOrCreateWallet, getDeployment } from './src/network.js';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { createWallet } from './src/wallet.js';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const zkConfigPath = path.resolve(__dirname, 'contracts', 'managed', 'PrivateVoting');
const contractPath = path.join(zkConfigPath, 'contract', 'index.js');
const PrivateVoting = await import(pathToFileURL(contractPath).href);

const compiledContract = CompiledContract.make('PrivateVoting', PrivateVoting.Contract).pipe(
  CompiledContract.withWitnesses({
    secret_passcode: () => Buffer.alloc(32),
    merkle_path: () => [Buffer.alloc(32), Buffer.alloc(32)],
    path_indices: () => [false, false]
  }),
  CompiledContract.withCompiledFileAssets(zkConfigPath),
);

const { network, config: networkConfig } = resolveNetwork();
const walletCtx = await createWallet({ network, networkConfig, seed: getOrCreateWallet(network).seed });
await walletCtx.wallet.waitForSyncedState();

const providers = {
  privateStateProvider: levelPrivateStateProvider({
    privateStateStoreName: 'query-state-3',
    accountId: walletCtx.unshieldedKeystore.getBech32Address().toString(),
    privateStoragePasswordProvider: () => 'Local-Devnet-Development-Placeholder-1',
  }),
  publicDataProvider: indexerPublicDataProvider(networkConfig.indexer, networkConfig.indexerWS),
  zkConfigProvider: new NodeZkConfigProvider(zkConfigPath),
  proofProvider: httpClientProofProvider(networkConfig.proofServer, new NodeZkConfigProvider(zkConfigPath)),
  walletProvider: {
    getCoinPublicKey: () => walletCtx.shieldedSecretKeys.coinPublicKey,
    getEncryptionPublicKey: () => walletCtx.shieldedSecretKeys.encryptionPublicKey,
    balanceTx: () => { throw new Error(); },
    submitTx: () => { throw new Error(); },
  } as any,
} as any;

providers.midnightProvider = providers.walletProvider;

const deployment = getDeployment(network);
if (deployment) {
  const contract = await findDeployedContract(providers, {
    contractAddress: deployment.address,
    compiledContract: compiledContract as any,
    privateStateId: 'query-state-id-3',
    initialPrivateState: {},
  });
  
  console.log('typeof contract.callTx.cast_vote:', typeof contract.callTx.cast_vote);
  console.log('Contract keys:', Object.keys(contract));
  console.log('Contract callTx keys:', Object.keys(contract.callTx));
}
await walletCtx.wallet.stop();
