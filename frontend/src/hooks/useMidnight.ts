import { useState, useEffect } from 'react';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';

interface MidnightState {
  api: any;
  providers: any;
  walletName: string | null;
  network: string | null;
  address: string | null;
  error: string | null;
  isConnecting: boolean;
}

// Dummy private state provider since PrivateVoting does not use private state variables.
const dummyPrivateStateProvider = {
  get: async () => null,
  set: async () => {},
  remove: async () => {},
  clear: async () => {},
};

export function useMidnight() {
  const [state, setState] = useState<MidnightState>({
    api: null,
    providers: null,
    walletName: null,
    network: null,
    address: null,
    error: null,
    isConnecting: false
  });

  const targetNetwork = import.meta.env.VITE_NETWORK || 'preview';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkWallet = () => {
      const midnight = (window as any).midnight;
      if (!midnight || Object.keys(midnight).length === 0) {
        setState(s => ({ ...s, error: 'No Midnight wallet detected. Please install a compatible wallet.' }));
      }
    };
    checkWallet();
  }, []);

  const connect = async (walletId?: string) => {
    try {
      setState(s => ({ ...s, isConnecting: true, error: null }));
      const midnight = (window as any).midnight;
      
      if (!midnight) {
        throw new Error('Midnight provider not found');
      }

      const targetId = walletId || Object.keys(midnight)[0];
      if (!targetId) {
        throw new Error('No wallet extensions found');
      }

      const wallet = midnight[targetId];
      if (!wallet) {
        throw new Error(`Wallet ${targetId} not found`);
      }

      const api = await wallet.connect(targetNetwork);
      const addressObj = await api.getUnshieldedAddress();
      const addressStr = addressObj.unshieldedAddress;

      // Set up real providers for dApp connector
      const indexerUrl = targetNetwork === 'preview' 
        ? 'https://indexer.preview.midnight.network/api/v4/graphql' 
        : 'http://127.0.0.1:8088/api/v4/graphql';
        
      const indexerWsUrl = targetNetwork === 'preview'
        ? 'wss://indexer.preview.midnight.network/api/v4/graphql/ws'
        : 'ws://127.0.0.1:8088/api/v4/graphql/ws';
        
      const proofServerUrl = 'http://127.0.0.1:6300';
      
      const zkConfigProvider = new FetchZkConfigProvider(window.location.origin + '/contracts/PrivateVoting', fetch);

      const providers = {
        privateStateProvider: dummyPrivateStateProvider,
        publicDataProvider: indexerPublicDataProvider(indexerUrl, indexerWsUrl),
        zkConfigProvider,
        proofProvider: httpClientProofProvider(proofServerUrl, zkConfigProvider),
        walletProvider: api,
        midnightProvider: api,
      };
      
      setState({
        api,
        providers,
        walletName: wallet.name || targetId,
        network: targetNetwork,
        address: addressStr,
        error: null,
        isConnecting: false
      });
      
    } catch (err: any) {
      setState(s => ({
        ...s,
        error: err.message || 'Failed to connect wallet',
        isConnecting: false
      }));
    }
  };

  const disconnect = () => {
    setState({
      api: null,
      providers: null,
      walletName: null,
      network: null,
      address: null,
      error: null,
      isConnecting: false
    });
  };

  const clearError = () => setState(s => ({ ...s, error: null }));

  return { ...state, connect, disconnect, clearError };
}
