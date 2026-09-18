import { useState, useEffect } from 'react';
import treeData from '../tree.json';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import * as Rx from 'rxjs';

// Dynamic import for the contract
let PrivateVotingModule: any;
let compiledContract: any;

interface VotingAppProps {
  walletState: any;
}

export const VotingApp: React.FC<VotingAppProps> = ({ walletState }) => {
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || '';
  
  const [selectedVoter, setSelectedVoter] = useState<number>(0);
  const [voteChoice, setVoteChoice] = useState<string>('yes');
  
  const [loading, setLoading] = useState(false);
  const [txResult, setTxResult] = useState<string | null>(null);

  // Live public tally state
  const [tallyYes, setTallyYes] = useState<number>(0);
  const [tallyNo, setTallyNo] = useState<number>(0);
  const [contract, setContract] = useState<any>(null);

  useEffect(() => {
    async function initContract() {
      if (!walletState.providers || !contractAddress) return;
      try {
        if (!PrivateVotingModule) {
          PrivateVotingModule = await import('@contract');
          compiledContract = CompiledContract.make('PrivateVoting', PrivateVotingModule.Contract).pipe(
            CompiledContract.withWitnesses({
              secret_passcode: (context) => [context.state, Buffer.alloc(32)], // default dummy witnesses for initial load
              merkle_path: (context) => [context.state, [Buffer.alloc(32), Buffer.alloc(32)]],
              path_indices: (context) => [context.state, [false, false]]
            })
          );
        }

        const deployedContract = await findDeployedContract(walletState.providers, {
          contractAddress,
          compiledContract,
          privateStateId: 'voting-state-id',
          initialPrivateState: undefined as any,
        });
        
        setContract(deployedContract);

        // Fetch initial tally
        const fetchTally = async () => {
          try {
            const state = await walletState.providers.publicDataProvider.queryContractState(contractAddress);
            if (state) {
              const ledgerState = PrivateVotingModule.ledger(state.data);
              setTallyYes(Number(ledgerState.tally_yes));
              setTallyNo(Number(ledgerState.tally_no));
            }
          } catch (e) {
            console.error('Error fetching state:', e);
          }
        };

        await fetchTally();
        // Removed setTimeout / interval polling to rely on real state fetching

      } catch (err) {
        console.error('Failed to initialize contract:', err);
      }
    }
    initContract();
  }, [walletState.providers, contractAddress]);

  const handleVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletState.api || !contract) {
      alert('Please connect your Midnight wallet first and ensure the contract is loaded');
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
      
      // We must inject the specific witnesses for this voter before executing the circuit
      const hexToBytes = (hex: string) => new Uint8Array(Buffer.from(hex, 'hex'));
      const authWitnesses = {
        secret_passcode: (context: any) => [context.state, hexToBytes(voterData.passcode)],
        merkle_path: (context: any) => [context.state, voterData.path.map((p: string) => hexToBytes(p))],
        path_indices: (context: any) => [context.state, voterData.indices]
      };

      // Re-create the compiled contract with the ACTUAL witnesses
      const contractWithWitnesses = CompiledContract.make('PrivateVoting', PrivateVotingModule.Contract).pipe(
        CompiledContract.withWitnesses(authWitnesses)
      );
      
      // Re-bind the contract instance with the new witnesses
      const authenticatedContract = await findDeployedContract(walletState.providers, {
        contractAddress,
        compiledContract: contractWithWitnesses,
        privateStateId: 'voting-state-id',
        initialPrivateState: undefined as any,
      });

      console.log('Executing ZK Circuit cast_vote locally...');
      // Explicit balancing and submission through the wallet API
      const unboundTx = await authenticatedContract.txBuilders.cast_vote(isYes);
      console.log('Balancing transaction...');
      const balancedTx = await walletState.api.balanceTx(unboundTx);
      console.log('Submitting transaction...');
      const tx = await walletState.api.submitTx(balancedTx);
      
      const hash = tx?.txHash || tx?.hash || (typeof tx === 'string' ? tx : 'Check wallet history');
      console.log('Transaction submitted! Hash:', hash);
      setTxResult(`Vote successfully cast! Tx Hash: ${hash}`);

      // Instantly fetch the updated tally
      const state = await walletState.providers.publicDataProvider.queryContractState(contractAddress);
      if (state) {
        const ledgerState = PrivateVotingModule.ledger(state.data);
        setTallyYes(Number(ledgerState.tally_yes));
        setTallyNo(Number(ledgerState.tally_no));
      }

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
          <div className="alert success mt-4" style={{ wordBreak: 'break-all' }}>
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
