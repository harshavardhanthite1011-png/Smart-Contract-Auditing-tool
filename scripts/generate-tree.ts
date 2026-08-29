import { pureCircuits } from '../contracts/managed/HashHelper/contract/index.js';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// Generate 4 random 32-byte passcodes for 4 eligible voters
const passcodes = Array.from({ length: 4 }, () => crypto.randomBytes(32));

// In our Compact circuit, the leaf IS the passcode itself (since it's a random 32-byte secret).
// The Merkle tree has depth 2.
// Level 0: Leaves (passcodes)
// Level 1: hash(passcode0, passcode1), hash(passcode2, passcode3)
// Level 2: hash(level1_0, level1_1) -> Root

const leaves = passcodes;

const h01 = pureCircuits.hash_pair(leaves[0], leaves[1]);
const h23 = pureCircuits.hash_pair(leaves[2], leaves[3]);

const root = pureCircuits.hash_pair(h01, h23);

// Generate proofs for each voter
// A proof consists of the sibling at each level and the direction (true if right, false if left)
// Since we wrote the Compact circuit as:
// layer 0 -> 1: indices[0] ? hash(current, path[0]) : hash(path[0], current)
// indices = true means the sibling is on the RIGHT.
// indices = false means the sibling is on the LEFT.

const voters = leaves.map((passcode, i) => {
    let path: Uint8Array[];
    let indices: boolean[];

    if (i === 0) {
        path = [leaves[1], h23];
        indices = [true, true]; // sibling 1 is right, sibling h23 is right
    } else if (i === 1) {
        path = [leaves[0], h23];
        indices = [false, true]; // sibling 0 is left, sibling h23 is right
    } else if (i === 2) {
        path = [leaves[3], h01];
        indices = [true, false]; // sibling 3 is right, sibling h01 is left
    } else {
        path = [leaves[2], h01];
        indices = [false, false]; // sibling 2 is left, sibling h01 is left
    }

    return {
        voterId: `Voter ${i + 1}`,
        passcode: Buffer.from(passcode).toString('hex'),
        path: path.map(p => Buffer.from(p).toString('hex')),
        indices
    };
});

const output = {
    root: Buffer.from(root).toString('hex'),
    voters
};

const outPath = path.resolve(process.cwd(), 'src', 'tree.json');
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log('Successfully generated Merkle Tree!');
console.log(`Root: ${output.root}`);
console.log(`Saved proof data to: ${outPath}`);
