# 🔥 Blaze Mix Master Money Game

Welcome to the **Blaze Mix Master** repository. This is a high-stakes, 100% skill-based music competition platform powered by AI auditing and cryptographic attestations.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/drosser895-eng/setlist-sleuth)

## ⚓ Antigravity Proof-of-Play
This repository is integrated with the **Antigravity Attestation Engine**. Every high-stakes game result is:
1. **Anchored**: A Merkle Root of the session is anchored to the registry contract.
2. **Attestated**: An external cryptographic proof is generated via the Antigravity API.
3. **Audited**: Verified by "Catbot," our AI security layer.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Firebase CLI
- Environment variables: `ANTIGRAVITY_API_KEY`, `ANTIGRAVITY_URL`

### Installation
```bash
npm install
npm start
```

### CI/CD Workflow
Check out `.github/workflows/score-attestation.yml` to see the automated anchoring pipeline.

### Manual Attestation Usage
```bash
# Dry run (safe)
node antigravity_adapter.js ./scores/anchor_mapping.json --dry-run

# Real run (set env first)
export ANTIGRAVITY_URL="https://api.antigravity.example/v1/attest"
export ANTIGRAVITY_API_KEY="your_key"
node antigravity_adapter.js ./scores/anchor_mapping.json
```

## ⚖️ Legal & Compliance
The platform uses the **Skill Credits** token system to ensure 100% legal, skill-based gaming. See the `/compliance` page inside the app for full disclosures.

---
*Built with passion for music and security.*
