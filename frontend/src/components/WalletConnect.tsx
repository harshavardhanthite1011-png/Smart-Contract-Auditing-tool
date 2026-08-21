import React from 'react';

interface WalletConnectProps {
  walletState: any;
  connect: () => void;
  disconnect: () => void;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({ walletState, connect, disconnect }) => {
  const { api, walletName, network, address, error, isConnecting } = walletState;

  return (
    <div className="wallet-card">
      <div className="wallet-header">
        <h2>Wallet Connection</h2>
        {network === 'preview' && <span className="badge preview">Preview Network</span>}
      </div>

      {error && (
        <div className="alert error">
          <strong>Connection Error:</strong> {error}
        </div>
      )}

      {api ? (
        <div className="wallet-info">
          <p><strong>Connected to:</strong> {walletName}</p>
          <p><strong>Address:</strong> {address?.slice(0, 12)}...{address?.slice(-8)}</p>
          <button className="btn outline" onClick={disconnect}>Disconnect</button>
        </div>
      ) : (
        <button 
          className="btn primary" 
          onClick={() => connect()} 
          disabled={isConnecting}
        >
          {isConnecting ? 'Connecting...' : 'Connect Midnight Wallet'}
        </button>
      )}
    </div>
  );
};
