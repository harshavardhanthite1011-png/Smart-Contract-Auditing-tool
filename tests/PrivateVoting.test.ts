import { describe, it, expect, beforeEach } from 'vitest';
import { pureCircuits } from '../contracts/managed/HashHelper/contract/index.js';
import * as crypto from 'crypto';

// In-memory ledger mock to test circuit logic
class MockLedger {
  public nullifiers: Set<string> = new Set();
  public tally_yes: number = 0;
  public tally_no: number = 0;
  public merkle_root: string;

  constructor(root: Uint8Array) {
    this.merkle_root = Buffer.from(root).toString('hex');
  }

  // Simulate cast_vote circuit logic locally using pureCircuits
  cast_vote(
    choice: boolean,
    secret_passcode: Uint8Array,
    merkle_path: Uint8Array[],
    path_indices: boolean[]
  ) {
    // 1. Verify Merkle Proof
    let currentHash = secret_passcode;
    
    // Layer 0
    if (path_indices[0]) {
      currentHash = pureCircuits.hash_pair(currentHash, merkle_path[0]);
    } else {
      currentHash = pureCircuits.hash_pair(merkle_path[0], currentHash);
    }

    // Layer 1
    if (path_indices[1]) {
      currentHash = pureCircuits.hash_pair(currentHash, merkle_path[1]);
    } else {
      currentHash = pureCircuits.hash_pair(merkle_path[1], currentHash);
    }

    if (Buffer.from(currentHash).toString('hex') !== this.merkle_root) {
      throw new Error("Invalid Merkle Proof: Voter not in allowlist");
    }

    // 2. Compute nullifier
    const nullifier = pureCircuits.hash_pair(secret_passcode, secret_passcode);
    const nullifierHex = Buffer.from(nullifier).toString('hex');

    // 3. Check for double voting
    if (this.nullifiers.has(nullifierHex)) {
      throw new Error("Voter has already cast a ballot");
    }

    // 4. Update state
    this.nullifiers.add(nullifierHex);
    if (choice) {
      this.tally_yes++;
    } else {
      this.tally_no++;
    }
  }
}

describe('PrivateVoting Contract Logic', () => {
  let ledger: MockLedger;
  let leaves: Uint8Array[];
  let h01: Uint8Array;
  let h23: Uint8Array;
  let root: Uint8Array;

  beforeEach(() => {
    // Setup a 4-voter merkle tree for testing
    leaves = Array.from({ length: 4 }, () => crypto.randomBytes(32));
    h01 = pureCircuits.hash_pair(leaves[0], leaves[1]);
    h23 = pureCircuits.hash_pair(leaves[2], leaves[3]);
    root = pureCircuits.hash_pair(h01, h23);
    
    ledger = new MockLedger(root);
  });

  it('1. A valid eligible voter can cast a ballot successfully', () => {
    // Voter 0 (path: [leaf1, h23], indices: [true, true])
    const passcode = leaves[0];
    const path = [leaves[1], h23];
    const indices = [true, true];

    expect(() => ledger.cast_vote(true, passcode, path, indices)).not.toThrow();
    expect(ledger.tally_yes).toBe(1);
    expect(ledger.tally_no).toBe(0);
  });

  it('2. A voter cannot vote twice (double-vote attempt is rejected)', () => {
    // Voter 0 votes
    const passcode = leaves[0];
    const path = [leaves[1], h23];
    const indices = [true, true];

    ledger.cast_vote(true, passcode, path, indices);

    // Voter 0 tries to vote again
    expect(() => ledger.cast_vote(false, passcode, path, indices)).toThrowError(
      "Voter has already cast a ballot"
    );

    // Tally should remain unchanged from the first vote
    expect(ledger.tally_yes).toBe(1);
    expect(ledger.tally_no).toBe(0);
  });

  it('3. The public tally correctly reflects the sum of valid votes cast', () => {
    // Voter 0 votes YES
    ledger.cast_vote(true, leaves[0], [leaves[1], h23], [true, true]);
    
    // Voter 1 votes NO (path: [leaf0, h23], indices: [false, true])
    ledger.cast_vote(false, leaves[1], [leaves[0], h23], [false, true]);

    // Voter 2 votes YES (path: [leaf3, h01], indices: [true, false])
    ledger.cast_vote(true, leaves[2], [leaves[3], h01], [true, false]);

    // Tally verification
    expect(ledger.tally_yes).toBe(2);
    expect(ledger.tally_no).toBe(1);
    expect(ledger.nullifiers.size).toBe(3);
  });
  
  it('4. An invalid merkle proof is rejected (ineligible voter)', () => {
    const fakePasscode = crypto.randomBytes(32);
    // Even if they provide a valid-looking path structure, the root won't match
    const path = [leaves[1], h23];
    const indices = [true, true];

    expect(() => ledger.cast_vote(true, fakePasscode, path, indices)).toThrowError(
      "Invalid Merkle Proof: Voter not in allowlist"
    );
  });
});
