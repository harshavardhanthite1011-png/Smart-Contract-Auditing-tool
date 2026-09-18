import { expect, test, beforeAll, afterAll } from 'vitest';
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolveNetwork, getOrCreateWallet } from '../src/network';
import { createWallet, persistWalletState } from '../src/wallet';
import treeData from '../frontend/src/tree.json';
import { WebSocket } from 'ws';
import * as Rx from 'rxjs';

globalThis.WebSocket = WebSocket as any;

let walletCtx: any;
let providers: any;
let PrivateVoting: any;
let compiledContract: any;

beforeAll(async () => {
  if (process.env.CI) return;
  const network = 'undeployed';
  const networkConfig = {
    networkId: 'undeployed',
    indexer: 'http://127.0.0.1:8088/api/v4/graphql',
    indexerWS: 'ws://127.0.0.1:8088/api/v4/graphql/ws',
    node: 'ws://127.0.0.1:9944',
    proofServer: 'http://127.0.0.1:6300',
    faucet: null,
    composeServices: ['node', 'indexer', 'proof-server'],
  };
  const WALLET = getOrCreateWallet(network as any);
  walletCtx = await createWallet({ network, networkConfig, seed: WALLET.seed });
  await walletCtx.wallet.waitForSyncedState();
  await persistWalletState(network, walletCtx);

  // DUST Registration
  const dustState = await Rx.firstValueFrom(walletCtx.wallet.state().pipe(Rx.filter((s: any) => s.isSynced)));
  const unregisteredUtxos = dustState.unshielded.availableCoins.filter(
    (c: any) => !c.meta?.registeredForDustGeneration,
  );
  if (unregisteredUtxos.length > 0) {
    const recipe = await walletCtx.wallet.registerNightUtxosForDustGeneration(
      unregisteredUtxos,
      walletCtx.unshieldedKeystore.getPublicKey(),
      (payload: any) => walletCtx.unshieldedKeystore.signData(payload),
    );
    const finalized = await walletCtx.wallet.finalizeRecipe(recipe);
    await walletCtx.wallet.submitTransaction(finalized);
  }
  if (dustState.dust.balance(new Date()) === 0n) {
    await Rx.firstValueFrom(
      walletCtx.wallet.state().pipe(
        Rx.throttleTime(5000),
        Rx.filter((s: any) => s.isSynced),
        Rx.filter((s: any) => s.dust.balance(new Date()) > 0n),
      ),
    );
  }

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const zkConfigPath = path.resolve(__dirname, '..', 'contracts', 'managed', 'PrivateVoting');
  const contractPath = path.join(zkConfigPath, 'contract', 'index.js');
  PrivateVoting = await import(pathToFileURL(contractPath).href);

  compiledContract = CompiledContract.make('PrivateVoting', PrivateVoting.Contract).pipe(
    CompiledContract.withWitnesses({
      secret_passcode: (context) => [context.state, new Uint8Array(Buffer.from(treeData.voters[0].passcode, 'hex'))],
      merkle_path: (context) => [context.state, treeData.voters[0].path.map(p => new Uint8Array(Buffer.from(p, 'hex')))],
      path_indices: (context) => [context.state, treeData.voters[0].indices]
    }),
    CompiledContract.withCompiledFileAssets(zkConfigPath),
  );

  providers = {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'private-voting-integration-test',
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
  providers.midnightProvider = providers.walletProvider;
}, 300000);

afterAll(async () => {
  if (process.env.CI) return;
  if (walletCtx) {
    await walletCtx.wallet.stop();
  }
}, 30000);

const testFn = process.env.CI ? test.skip : test;

testFn('Genuine integration test deploying PrivateVoting and casting vote', async () => {
  const deployed = await deployContract(providers, {
    compiledContract: compiledContract as any,
    args: [new Uint8Array(Buffer.from(treeData.root, 'hex'))],
    privateStateId: 'test-private-state',
    initialPrivateState: undefined as any,
  });

  expect(deployed.deployTxData.public.contractAddress).toBeDefined();
  const address = deployed.deployTxData.public.contractAddress;
  console.log(`REAL DEPLOYMENT ADDRESS: ${address}`);
  console.log(`REAL DEPLOYMENT HASH: ${deployed.deployTxData.public.txHash || (deployed as any).txHash}`);

  let state = await providers.publicDataProvider.queryContractState(address);
  let ledger = PrivateVoting.ledger(state!.data);
  expect(ledger.tally_yes).toBe(0n);
  expect(ledger.tally_no).toBe(0n);

  const tx = await deployed.callTx.cast_vote(true);
  expect(tx.txId || (tx as any).txHash).toBeDefined();
  console.log(`REAL VOTE TX HASH: ${tx.txId || (tx as any).txHash}`);

  state = await providers.publicDataProvider.queryContractState(address);
  ledger = PrivateVoting.ledger(state!.data);
  expect(ledger.tally_yes).toBe(1n);
  expect(ledger.tally_no).toBe(0n);
}, 300000);
