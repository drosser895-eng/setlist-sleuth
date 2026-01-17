#!/bin/bash
set -euo pipefail

# scripts/ingest_adaptive_hls.sh
# Usage: ./scripts/ingest_adaptive_hls.sh <VIDEO_ID> "Title" "Channel"

VIDEO_ID="${1:-}"
TITLE="${2:-Untitled}"
CHANNEL="${3:-Unknown}"

if [ -z "$VIDEO_ID" ]; then 
  echo "Usage: $0 <ID> \"Title\" \"Channel\""
  exit 1 
fi

echo ">>> Ingesting $VIDEO_ID: $TITLE..."

# 1. Simulate HLS generation
mkdir -p "transcoded/$VIDEO_ID"
touch "transcoded/$VIDEO_ID/master.m3u8"

# 2. Update DB (Mock)
if [ -n "${DATABASE_URL:-}" ]; then
  psql "$DATABASE_URL" -c "INSERT INTO videos (external_id, title, channel_name, hls_url) VALUES ('$VIDEO_ID', '$TITLE', '$CHANNEL', 'https://cdn.example.com/$VIDEO_ID/master.m3u8') ON CONFLICT (external_id) DO UPDATE SET title = EXCLUDED.title;"
fi

echo "✅ Ingested $VIDEO_ID"
