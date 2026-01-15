#!/usr/bin/env node
/**
 * generate_proofs.js
 * Usage: node generate_proofs.js <scores_dir> <out_proofs.json>
 *
 * Reads all *.canonical.json files, computes SHA-256 hashes,
 * builds a Merkle Tree, and saves proofs.json.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest();
}

function buildTree(leaves) {
  let layers = [leaves];
  while (layers[layers.length - 1].length > 1) {
    let currentLayer = layers[layers.length - 1];
    let nextLayer = [];
    for (let i = 0; i < currentLayer.length; i += 2) {
      let left = currentLayer[i];
      let right = currentLayer[i + 1] || left;
      // Sort to ensure deterministic order
      let combined = Buffer.concat([left, right].sort(Buffer.compare));
      nextLayer.push(sha256(combined));
    }
    layers.push(nextLayer);
  }
  return layers;
}

function getProof(layers, index) {
  let proof = [];
  for (let i = 0; i < layers.length - 1; i++) {
    let layer = layers[i];
    let isRight = index % 2;
    let pairIndex = isRight ? index - 1 : index + 1;
    if (pairIndex < layer.length) {
      proof.push("0x" + layer[pairIndex].toString('hex'));
    } else {
      // In case of odd number of nodes, we use the node itself
      proof.push("0x" + layer[index].toString('hex'));
    }
    index = Math.floor(index / 2);
  }
  return proof;
}

const scoresDir = process.argv[2] || "./scores";
const outPath = process.argv[3] || "./scores/proofs.json";

if (!fs.existsSync(scoresDir)) {
  console.error("Error: Scores directory missing:", scoresDir);
  process.exit(1);
}

const files = fs.readdirSync(scoresDir).filter(f => f.endsWith('.canonical.json')).sort();
if (files.length === 0) {
  console.log("No .canonical.json files found. Creating sample...");
  fs.mkdirSync(scoresDir, { recursive: true });
  fs.writeFileSync(path.join(scoresDir, "sample.canonical.json"), JSON.stringify({artist:"Test", score:100}));
  files.push("sample.canonical.json");
}

const fileHashes = files.map(f => {
  const content = fs.readFileSync(path.join(scoresDir, f));
  return sha256(content);
});

const layers = buildTree(fileHashes);
const root = "0x" + layers[layers.length - 1][0].toString('hex');

const proofs = {};
files.forEach((f, i) => {
  proofs[f] = {
    hash: "0x" + fileHashes[i].toString('hex'),
    proof: getProof(layers, i)
  };
});

const result = {
  merkleRoot: root,
  generatedAt: new Date().toISOString(),
  toolVersion: "1.0.0",
  proofs: proofs
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log(`Merkle Tree generated. Root: ${root}`);
console.log(`Proofs saved to ${outPath}`);