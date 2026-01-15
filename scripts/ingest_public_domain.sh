#!/usr/bin/env bash
# scripts/ingest_public_domain.sh
# Ingest a public domain video from Internet Archive into public_content/.
# Requirements: curl, jq, ffmpeg
# Usage:
#   ./scripts/ingest_public_domain.sh <internet-archive-identifier> "Friendly Title" "Creator Name" YEAR
# Example:
#   ./scripts/ingest_public_domain.sh "prelinger/clip-1234" "Vintage Music Clip" "Prelinger Archives" 1950

set -euo pipefail

if [ "$#" -lt 4 ]; then
  echo "Usage: $0 <ia_id> \"Title\" \"Creator\" YEAR"
  exit 1
fi

IA_ID="$1"
TITLE="$2"
CREATOR="$3"
YEAR="$4"

OUT_DIR="public_content"
mkdir -p "$OUT_DIR"

echo "Fetching metadata for ${IA_ID}..."
META_JSON=$(curl -s "https://archive.org/metadata/${IA_ID}")
if [ -z "$META_JSON" ]; then
  echo "ERROR: no metadata for ${IA_ID}"
  exit 1
fi

# Choose a file (prefer mp4/webm/ogg)
FILE_NAME=$(echo "$META_JSON" | jq -r '.files[] | select(.name | test("\\.(mp4|webm|ogg)$"; "i")) | .name' | head -n1)
if [ -z "$FILE_NAME" ]; then
  echo "No direct video file found for ${IA_ID} (list files for manual selection)"
  echo "$META_JSON" | jq -r '.files[] | .name'
  exit 1
fi

DOWNLOAD_URL="https://archive.org/download/${IA_ID}/${FILE_NAME}"
TMP_FILE="${OUT_DIR}/${IA_ID}--${FILE_NAME}"
FINAL_FILE="${OUT_DIR}/${IA_ID}.mp4"

echo "Downloading ${DOWNLOAD_URL}..."
curl -L -o "$TMP_FILE" "$DOWNLOAD_URL"

echo "Transcoding to ${FINAL_FILE}..."
ffmpeg -y -i "$TMP_FILE" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k "$FINAL_FILE"

METADATA_FILE="${OUT_DIR}/${IA_ID}.json"
cat > "$METADATA_FILE" <<EOF
{
  "id": "${IA_ID}",
  "title": "$(printf '%s' "$TITLE" | sed 's/"/\\"/g')",
  "creator": "$(printf '%s' "$CREATOR" | sed 's/"/\\"/g')",
  "year": "${YEAR}",
  "source": "Internet Archive",
  "file": "$(basename "$FINAL_FILE")",
  "public_domain": true,
  "imported_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

echo "Imported ${FINAL_FILE} and metadata ${METADATA_FILE}"
echo "Add entries to your content/playlist.json or CMS to make available on Blaze TV."
