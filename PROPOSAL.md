# Product Proposal: Private Voting

## Idea Chosen
**Private Voting** (from the approved list) — anonymous ballots with publicly verifiable tallies, built on Midnight Network.

## Scope & Audience
The application targets DAOs, corporate boards, or community governance bodies where maintaining voter anonymity is paramount to prevent coercion, while the final tally must be entirely transparent and mathematically verifiable by the public.

## Technical Scope
- **Who is voting:** A pre-defined allowlist of eligible voters, represented as leaves in a Merkle tree.
- **What is private:** The specific identity of the voter (their secret passcode) and the exact option they selected (since it is masked behind a zero-knowledge nullifier).
- **What is public:** The aggregate tally of "Yes" and "No" votes, the Merkle root of the allowlist, and the list of consumed nullifiers to prevent double-voting.
- **Out of Scope:** Dynamic onboarding of new voters during an active election cycle, and complex voting systems (e.g., quadratic voting) are out of scope for this MVP.
