# Universal Smart Contract Auditing Tool

The project is an AI-assisted, multi-language smart contract auditing platform that automatically analyzes blockchain smart contracts and identifies security vulnerabilities, coding errors, logic flaws, and potential attack vectors.

## Project Vision
Our vision is to provide a robust, blockchain-agnostic security platform where developers can proactively audit their smart contracts across diverse ecosystems like EVM (Solidity/Vyper), Solana (Rust), Aptos/Sui (Move), and Starknet (Cairo). 
**Midnight's privacy model is core to this vision**: By leveraging Zero-Knowledge proofs, the platform allows auditors and developers to log that a contract was audited on-chain (and its general safety score) without revealing the specific, unpatched vulnerabilities to the public. This completely eliminates the risk of zero-day exploits while still providing cryptographic proof of the audit's integrity and findings.

## Smart Contract Deployment
- **Network:** Preview
- **Deployed contract ID:** `d088a2fdff8a35c4ca84486ef61b527516b81a98b5ee5af799eb499af44eda78`

## Key Features
- **Multi-Language Support**: Upload contracts in Solidity, Rust, Move, or Cairo.
- **ZK-Powered Privacy**: Vulnerability details are processed entirely as private witnesses (proved without revealing your input).
- **Selective Disclosure**: Allows auditors to disclose specific vulnerabilities on-chain *after* a patch is confirmed, using Midnight's `disclose()` function.
- **On-Chain Audit Records**: Transparently records the fact that a contract hash has been audited, alongside its severity rating, so users can verify a project's safety before interacting.

## Future Scope
- Expand support for additional languages like Hyperledger Fabric Chaincode (Go, Java, JS) and CosmWasm.
- Integrate on-chain AI or oracle-based automated analysis directly into the Midnight contract via a trusted verifier.
- Support token-gated access for premium audit reports.
- Path to Mainnet deployment with robust auditor staking mechanisms.

## Tech Stack
- **Smart Contracts:** Compact (Midnight Network)
- **Frontend:** React, Vite, Vanilla CSS, TypeScript
- **Wallet Integration:** Midnight DApp Connector API
- **Testing:** Vitest

## Local Development (setup, run, test — step by step commands)

### Prerequisites
- Node.js & npm
- Docker Desktop (running)
- Midnight Lace Wallet (connected to Preview network)

### 1. Installation
```bash
npm install
cd frontend && npm install
```

### 2. Testing the Smart Contract
Ensure your contract logic and privacy requirements are sound:
```bash
npm run test
```

### 3. Start Local Environment (if deploying to devnet)
```bash
npm run proof-server:start
```

### 4. Deploying
To deploy to the Midnight Preview Network (requires funding):
```bash
npm run deploy -- --network preview
```
After deployment, update `VITE_CONTRACT_ADDRESS` in `frontend/.env` with your contract ID.

### 5. Start the Frontend
```bash
npm run frontend:dev
```
Open `http://localhost:5173` to connect your Midnight wallet and interact with the application.
