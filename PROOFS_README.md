# Cryptographic Proofs — Generation & Verification

This folder contains the tools to generate and verify proofs for the Blaze Mix Master platform.

## Tools

### 1. `generate_proofs.js`
Used by administrators or CI to generate a Merkle proof for a specific score.
```bash
node scripts/generate_proofs.js ./scores/anchor_mapping.json USER_SCORE_ID
```

### 2. `verify_score_client.js`
A standalone, zero-dependency script for users to verify their performance independently.
```bash
node scripts/verify_score_client.js <merkle_root> <score_id>
```

## How it Works
1. Scores are hashed and added to a Merkle Tree.
2. The Merkle Root is anchored on-chain.
3. Users receive a "verified receipt" with their score ID.
4. The client script proves that the Score ID is a member of the anchored Merkle Root.
