import { resolveNetwork, getOrCreateWallet } from './src/network.js';
import { createWallet } from './src/wallet.js';

async function main() {
  const { network, config } = resolveNetwork();
  const w = getOrCreateWallet('preview');
  const walletCtx = await createWallet({ network: 'preview', networkConfig: config, seed: w.seed });
  console.log("ADDRESS:", walletCtx.unshieldedKeystore.getBech32Address().toString());
  process.exit(0);
}
main().catch(console.error);
