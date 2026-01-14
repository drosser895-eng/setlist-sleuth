#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: node antigravity_adapter.js <anchor_mapping.json> [--dry-run]');
    process.exit(2);
  }
  const mappingPath = args[0];
  const dry = args.includes('--dry-run');

  if (!fs.existsSync(mappingPath)) {
    console.error('File not found:', mappingPath);
    process.exit(2);
  }

  const payload = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
  if (!payload.merkleRoot || !payload.txHash) {
    console.error("anchor_mapping.json missing 'merkleRoot' or 'txHash'");
    process.exit(2);
  }

  console.log('Prepared payload for merkleRoot:', payload.merkleRoot);
  if (dry) { console.log('Dry run - not sending.'); process.exit(0); }

  const url = process.env.ANTIGRAVITY_URL;
  const apiKey = process.env.ANTIGRAVITY_API_KEY;
  if (!url || !apiKey) {
    console.error('Set ANTIGRAVITY_URL and ANTIGRAVITY_API_KEY in env.');
    process.exit(2);
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  console.log('Status:', res.status, text);

  if (res.ok) {
    const outPath = path.join(path.dirname(mappingPath), 'antigravity_attestation.json');
    fs.writeFileSync(outPath, text);
    console.log('Attestation saved to', outPath);
  } else {
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
