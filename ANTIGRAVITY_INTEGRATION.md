# Antigravity Integration Guide

Required secrets:
- ANTIGRAVITY_URL
- ANTIGRAVITY_API_KEY

Dry-run:
  node antigravity_adapter.js ./scores/anchor_mapping.json --dry-run

Production:
  export ANTIGRAVITY_URL="https://api.vendor.example/v1/attest"
  export ANTIGRAVITY_API_KEY="sk_xxx"
  node antigravity_adapter.js ./scores/anchor_mapping.json
