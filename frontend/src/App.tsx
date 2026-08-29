
import { useMidnight } from './hooks/useMidnight';
import { WalletConnect } from './components/WalletConnect';
import { VotingApp } from './components/VotingApp';
import './index.css';

function App() {
  const midnight = useMidnight();

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">
          <h1>Midnight Private Voting</h1>
          <p className="subtitle">Anonymous ballots with verifiable tallies</p>
        </div>
        <WalletConnect 
          walletState={midnight} 
          connect={midnight.connect} 
          disconnect={midnight.disconnect} 
        />
      </header>

      <main className="app-main">
        <div className="hero">
          <h2>Secure, Allowlisted Voting</h2>
          <p>
            Cast your vote without revealing your identity or your choice to the public.
            <strong> The public tally updates in real-time, completely verifiable via Zero-Knowledge proofs.</strong>
          </p>
        </div>

        <VotingApp walletState={midnight} />
      </main>

      <footer className="app-footer">
        <p>Built for Midnight Network — Level 3 Challenge</p>
      </footer>
    </div>
  );
}

export default App;
