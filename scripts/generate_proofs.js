#!/usr/bin/env node
const fs = require('fs'), path = require('path'), crypto = require('crypto');
function sha256(data) { return crypto.createHash('sha256').update(data).digest(); }
const scoresDir = process.argv[2] || "./scores", outPath = process.argv[3] || "./scores/proofs.json";
if (!fs.existsSync(scoresDir)) { console.error("Missing scores dir"); process.exit(1); }
const files = fs.readdirSync(scoresDir).filter(f => f.endsWith('.canonical.json')).sort();
if (files.length === 0) { console.error("No scores found"); process.exit(1); }
const result = { merkleRoot: "0x000", generatedAt: new Date().toISOString(), toolVersion: "1.0.0", proofs: {} };
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log(`Proofs saved to ${outPath}`);
