import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
setNetworkId('preview');

import { resolveNetwork, getOrCreateWallet } from './src/network.js';
import { createWallet, persistWalletState } from './src/wallet.js';
import treeData from './frontend/src/tree.json' assert { type: 'json' };
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { WebSocket } from 'ws';
import * as Rx from 'rxjs';

globalThis.WebSocket = WebSocket as any;

async function main() {
  const { network, config: networkConfig } = resolveNetwork();
  const WALLET = getOrCreateWallet(network as any);
  let walletCtx = await createWallet({ network, networkConfig, seed: WALLET.seed });
  await walletCtx.wallet.waitForSyncedState();

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const zkConfigPath = path.resolve(__dirname, 'contracts', 'managed', 'PrivateVoting');
  const contractPath = path.join(zkConfigPath, 'contract', 'index.js');
  let PrivateVoting = await import(pathToFileURL(contractPath).href);

  let compiledContract = CompiledContract.make('PrivateVoting', PrivateVoting.Contract).pipe(
    CompiledContract.withWitnesses({
      secret_passcode: (context) => [context.state, new Uint8Array(Buffer.from(treeData.voters[0].passcode, 'hex'))],
      merkle_path: (context) => [context.state, treeData.voters[0].path.map((p: string) => new Uint8Array(Buffer.from(p, 'hex')))],
      path_indices: (context) => [context.state, treeData.voters[0].indices]
    }),
    CompiledContract.withCompiledFileAssets(zkConfigPath),
  );

  let providers = {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'private-voting-hash-test',
      accountId: walletCtx.unshieldedKeystore.getBech32Address().toString(),
      privateStoragePasswordProvider: () => 'Local-Devnet-Development-Placeholder-1',
    }),
    publicDataProvider: indexerPublicDataProvider(networkConfig.indexer, networkConfig.indexerWS),
    zkConfigProvider: new NodeZkConfigProvider(zkConfigPath),
    proofProvider: httpClientProofProvider(networkConfig.proofServer, new NodeZkConfigProvider(zkConfigPath)),
    walletProvider: {
      getCoinPublicKey: () => walletCtx.shieldedSecretKeys.coinPublicKey,
      getEncryptionPublicKey: () => walletCtx.shieldedSecretKeys.encryptionPublicKey,
      async balanceTx(tx: any, ttl?: Date) {
        const recipe = await walletCtx.wallet.balanceUnboundTransaction(tx, { shieldedSecretKeys: walletCtx.shieldedSecretKeys, dustSecretKey: walletCtx.dustSecretKey }, { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) });
        return walletCtx.wallet.finalizeRecipe(recipe);
      },
      submitTx: (tx: any) => walletCtx.wallet.submitTransaction(tx) as any,
    },
  };
  (providers as any).midnightProvider = providers.walletProvider;

  const address = "9f51d1be135207f5c9c9cabd1c2e387e3e24fcab9a7a6ad094523e560ae81f87";

  console.log('Finding contract...');
  const deployed = await findDeployedContract(providers as any, {
    contractAddress: address,
    compiledContract: compiledContract as any,
    privateStateId: 'test-private-state-hash',
    initialPrivateState: undefined as any,
  });

  console.log('Voting...');
  const tx = await deployed.callTx.cast_vote(true);
  console.log(`VOTE TX HASH: ${tx.txId || (tx as any).txHash}`);

  await walletCtx.wallet.stop();
}

main().catch(console.error);
