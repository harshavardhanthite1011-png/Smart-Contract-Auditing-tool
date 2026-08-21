
import { useMidnight } from './hooks/useMidnight';
import { WalletConnect } from './components/WalletConnect';
import { AuditApp } from './components/AuditApp';
import './index.css';

function App() {
  const midnight = useMidnight();

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">
          <h1>Universal Smart Contract Auditing Tool</h1>
          <p className="subtitle">Powered by Midnight Network</p>
        </div>
        <WalletConnect 
          walletState={midnight} 
          connect={midnight.connect} 
          disconnect={midnight.disconnect} 
        />
      </header>

      <main className="app-main">
        <div className="hero">
          <h2>Secure, Multi-Language Smart Contract Audits</h2>
          <p>
            Upload your smart contracts to detect vulnerabilities, logic flaws, and attack vectors across Solidity, Rust, Move, and more. 
            <strong> Your code remains completely private on-chain using Zero-Knowledge proofs.</strong>
          </p>
        </div>

        <AuditApp walletState={midnight} />
      </main>

      <footer className="app-footer">
        <p>Built for INTO the Midnight — SPPU Bootcamp</p>
      </footer>
    </div>
  );
}

export default App;
