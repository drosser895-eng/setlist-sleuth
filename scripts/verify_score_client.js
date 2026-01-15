#!/usr/bin/env node
/**
 * verify_score_client.js
 * Usage: node verify_score_client.js <score.json> <proofs.json>
 *
 * Verifies that a score belongs to the Merkle root in proofs.json.
 */

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest();
}

function verifyProof(leaf, proof, root) {
  let hash = Buffer.from(leaf.replace(/^0x/, ''), 'hex');
  for (const p of proof) {
    let pair = Buffer.from(p.replace(/^0x/, ''), 'hex');
    let combined = Buffer.concat([hash, pair].sort(Buffer.compare));
    hash = sha256(combined);
  }
  return "0x" + hash.toString('hex') === root;
}

const scorePath = process.argv[2];
const proofsPath = process.argv[3];

if (!scorePath || !proofsPath) {
  console.log("Usage: node verify_score_client.js <canonical_score.json> <proofs.json>");
  process.exit(1);
}

if (!fs.existsSync(scorePath) || !fs.existsSync(proofsPath)) {
  console.error("Error: File(s) missing.");
  process.exit(1);
}

const scoreContent = fs.readFileSync(scorePath);
const scoreHash = "0x" + sha256(scoreContent).toString('hex');

const proofsData = JSON.parse(fs.readFileSync(proofsPath, 'utf8'));
const fileName = path.basename(scorePath);
const proofEntry = proofsData.proofs[fileName];

if (!proofEntry) {
  console.error(`FAILURE: No proof found for ${fileName} in ${proofsPath}`);
  process.exit(1);
}

if (proofEntry.hash !== scoreHash) {
  console.error("FAILURE: Hash mismatch!");
  console.error(`Local file hash: ${scoreHash}`);
  console.error(`Expected hash:   ${proofEntry.hash}`);
  process.exit(1);
}

const isValid = verifyProof(scoreHash, proofEntry.proof, proofsData.merkleRoot);

if (isValid) {
  console.log("SUCCESS: Merkle proof verified!");
  console.log(`Root: ${proofsData.merkleRoot}`);
} else {
  console.error("FAILURE: Merkle proof verification failed.");
  process.exit(1);
}