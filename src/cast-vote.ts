import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolveNetwork, getOrCreateWallet } from './network.js';
import { createWallet, persistWalletState } from './wallet.js';
import treeData from '../frontend/src/tree.json' assert { type: 'json' };
import { WebSocket } from 'ws';
import * as Rx from 'rxjs';
import { onchainRuntime } from '@midnight-ntwrk/midnight-js-protocol';
const StateValue = onchainRuntime.StateValue;
import type { PrivateStateProvider } from '@midnight-ntwrk/midnight-js-types';

class DummyPrivateStateProvider implements PrivateStateProvider<any> {
  async get(id: string) {
    return StateValue.newNull();
  }
  async set(id: string, state: any, version?: any) {
    return StateValue.newNull();
  }
  async clear(id: string) {}
  async setContractAddress(id: string, address: string) {}
  async getSigningKey(id: string) { return undefined; }
  async setSigningKey(id: string, key: Uint8Array) {}
}

globalThis.WebSocket = WebSocket as any;

async function main() {
  const network = 'preview';
  const { config: networkConfig } = resolveNetwork(network as any);
  const WALLET = getOrCreateWallet(network as any);
  let walletCtx = await createWallet({ network, networkConfig, seed: WALLET.seed });
  await walletCtx.wallet.waitForSyncedState();
  await persistWalletState(network, walletCtx);

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const zkConfigPath = path.resolve(__dirname, '..', 'contracts', 'managed', 'PrivateVoting');
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
    privateStateProvider: new DummyPrivateStateProvider(),
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

  const stateJson = JSON.parse(fs.readFileSync('.midnight-state.json', 'utf-8'));
  const address = stateJson.deployments.preview.address;
  console.log('Contract address:', address);

  let state = await providers.publicDataProvider.queryContractState(address);
  let ledger = PrivateVoting.ledger(state!.data);
  console.log('Initial tally yes:', Number(ledger.tally_yes));
  console.log('Initial tally no:', Number(ledger.tally_no));

  console.log('Connecting to deployed contract...');
  const deployed = await findDeployedContract(providers as any, {
    contractAddress: address,
    compiledContract: compiledContract as any,
    privateStateId: 'test-private-state-6',
    initialPrivateState: StateValue.newNull() as any,
  });

  console.log('Voting...');
  try {
    const tx = await deployed.callTx.cast_vote(true);
    console.log('Vote tx hash:', tx.txHash);
  } catch (e) {
    console.error('Vote failed!', e);
  }

  state = await providers.publicDataProvider.queryContractState(address);
  ledger = PrivateVoting.ledger(state!.data);
  console.log('Final tally yes:', Number(ledger.tally_yes));
  console.log('Final tally no:', Number(ledger.tally_no));

  await walletCtx.wallet.stop();
}

main().catch(console.error);
