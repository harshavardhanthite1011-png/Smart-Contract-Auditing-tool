import { useState, useEffect } from 'react';

interface MidnightState {
  api: any;
  walletName: string | null;
  network: string | null;
  address: string | null;
  error: string | null;
  isConnecting: boolean;
}

export function useMidnight() {
  const [state, setState] = useState<MidnightState>({
    api: null,
    walletName: null,
    network: null,
    address: null,
    error: null,
    isConnecting: false
  });

  const targetNetwork = import.meta.env.VITE_NETWORK || 'preview';

  useEffect(() => {
    // Check if wallet is injected
    if (typeof window === 'undefined') return;
    
    const checkWallet = () => {
      const providers = (window as any).midnight;
      if (!providers || Object.keys(providers).length === 0) {
        setState(s => ({ ...s, error: 'No Midnight wallet detected. Please install a compatible wallet.' }));
      }
    };
    
    // Slight delay to allow wallet extensions to inject
    const timer = setTimeout(checkWallet, 1000);
    return () => clearTimeout(timer);
  }, []);

  const connect = async (walletId?: string) => {
    try {
      setState(s => ({ ...s, isConnecting: true, error: null }));
      const providers = (window as any).midnight;
      
      if (!providers) {
        throw new Error('Midnight provider not found');
      }

      // Use specified wallet or the first available one
      const targetId = walletId || Object.keys(providers)[0];
      if (!targetId) {
        throw new Error('No wallet extensions found');
      }

      const wallet = providers[targetId];
      if (!wallet) {
        throw new Error(`Wallet ${targetId} not found`);
      }

      // Call the connect method on the InitialAPI object injected by the wallet
      const api = await wallet.connect(targetNetwork);

      // The new API doesn't expose a simple "state()" property, but we can get addresses
      const addressObj = await api.getUnshieldedAddress();
      const addressStr = addressObj.unshieldedAddress;
      
      setState({
        api,
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
