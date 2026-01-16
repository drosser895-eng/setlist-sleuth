#!/usr/bin/env bash
# scripts/ingest_public_domain_to_s3.sh
# Usage: ./scripts/ingest_public_domain_to_s3.sh <IA_ID> "Title" "Channel"

set -euo pipefail

IA_ID="${1:-}"
TITLE="${2:-Untitled}"
CHANNEL="${3:-Unknown}"

if [ -z "$IA_ID" ]; then
  echo "Usage: $0 <IA_ID> \"Title\" \"Channel\""
  exit 1
fi

echo ">>> Ingesting $IA_ID ($TITLE)..."
# 1. Download (mock)
# curl -L ...
# 2. Transcode (mock)
# ffmpeg ...
# 3. Upload (mock)
# aws s3 cp ...
# 4. Insert DB (mock)
# psql ...

echo "Ingest complete (simulated)."