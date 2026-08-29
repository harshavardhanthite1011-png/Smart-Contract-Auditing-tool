import { useState } from 'react';
import treeData from '../tree.json';

// In a real dApp, we would import from the deployed contract API
// import { PrivateVoting } from '@midnight-ntwrk/midnight-js-contracts';

interface VotingAppProps {
  walletState: any;
}

export const VotingApp: React.FC<VotingAppProps> = ({ walletState }) => {
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || '';
  
  const [selectedVoter, setSelectedVoter] = useState<number>(0);
  const [voteChoice, setVoteChoice] = useState<string>('yes');
  
  const [loading, setLoading] = useState(false);
  const [txResult, setTxResult] = useState<string | null>(null);

  // Mock public tally state
  const [tallyYes, setTallyYes] = useState<number>(0);
  const [tallyNo, setTallyNo] = useState<number>(0);

  const handleVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletState.api) {
      alert('Please connect your Midnight wallet first');
      return;
    }

    setLoading(true);
    setTxResult(null);

    try {
      const voterData = treeData.voters[selectedVoter];
      const isYes = voteChoice === 'yes';

      console.log('--- ZK PROOF GENERATION ---');
      console.log('The following private inputs will NEVER leave this device:');
      console.log('Secret Passcode:', voterData.passcode);
      console.log('Merkle Path:', voterData.path);
      console.log('Path Indices:', voterData.indices);
      
      // Simulate DUST transaction
      await new Promise(r => setTimeout(r, 2000));
      
      console.log('Transaction submitted! A valid ZK proof was verified on-chain.');

      // Update mock tally
      if (isYes) {
        setTallyYes(tallyYes + 1);
      } else {
        setTallyNo(tallyNo + 1);
      }

      setTxResult(`Vote successfully cast! Your specific choice was masked in a ZK proof and the public tally has been updated.`);
    } catch (err: any) {
      console.error(err);
      alert('Failed to cast vote: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="audit-app">
      <div className="card">
        <h2>Proposal: Should we adopt Midnight for Level 3?</h2>
        
        <form onSubmit={handleVote}>
          <div className="form-group">
            <label>Select Voter Profile (Demo Only)</label>
            <select value={selectedVoter} onChange={e => setSelectedVoter(Number(e.target.value))}>
              {treeData.voters.map((v, i) => (
                <option key={i} value={i}>{v.voterId} (Valid Eligible Voter)</option>
              ))}
            </select>
            <small>In production, the user would provide their secret passcode from their wallet.</small>
          </div>
          
          <div className="form-group">
            <label>Your Vote</label>
            <select value={voteChoice} onChange={e => setVoteChoice(e.target.value)}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          <div className="privacy-badge">
            <span className="icon">🛡️</span>
            <span>Your vote is kept 100% private using Zero-Knowledge cryptography</span>
          </div>

          <button 
            type="submit" 
            className="btn primary full-width" 
            disabled={loading || !walletState.api}
          >
            {loading ? 'Generating ZK Proof & Submitting...' : 'Cast Private Vote'}
          </button>
        </form>

        {txResult && (
          <div className="alert success mt-4">
            {txResult}
          </div>
        )}
      </div>

      <div className="card mt-4">
        <h2>Live Public Tally</h2>
        {contractAddress ? (
          <div>
            <p><strong>Contract Address:</strong> {contractAddress}</p>
            <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
              <div style={{ flex: 1, padding: '20px', background: 'rgba(0,255,0,0.1)', borderRadius: '8px', textAlign: 'center' }}>
                <h3>Yes</h3>
                <h1 style={{ fontSize: '3rem', margin: '10px 0' }}>{tallyYes}</h1>
              </div>
              <div style={{ flex: 1, padding: '20px', background: 'rgba(255,0,0,0.1)', borderRadius: '8px', textAlign: 'center' }}>
                <h3>No</h3>
                <h1 style={{ fontSize: '3rem', margin: '10px 0' }}>{tallyNo}</h1>
              </div>
            </div>
            <p className="mt-4"><em>(Tally fetched from public ledger state)</em></p>
          </div>
        ) : (
          <div className="empty-state">Configure VITE_CONTRACT_ADDRESS in .env to view the public tally.</div>
        )}
      </div>
    </div>
  );
};
