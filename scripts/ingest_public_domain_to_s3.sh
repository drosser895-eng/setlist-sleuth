#!/usr/bin/env bash
# scripts/ingest_public_domain_to_s3.sh
# Ingest a public domain video from Internet Archive, transcode to adaptive HLS, and upload to S3.
# Requirements: curl, jq, ffmpeg (with HLS support), aws-cli, bc
# Usage:
#   ./scripts/ingest_public_domain_to_s3.sh <internet-archive-identifier> "Friendly Title" "Creator Name" YEAR
# Example:
#   ./scripts/ingest_public_domain_to_s3.sh "prelinger/clip-1234" "Vintage Music Clip" "Prelinger Archives" 1950
#
# Environment variables required:
#   AWS_S3_BUCKET - S3 bucket name for video storage
#   AWS_REGION - AWS region (default: us-east-1)

set -euo pipefail

# Check required commands
for cmd in curl jq ffmpeg aws bc; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "ERROR: Required command '$cmd' is not installed"
    exit 1
  fi
done

if [ "$#" -lt 4 ]; then
  echo "Usage: $0 <ia_id> \"Title\" \"Creator\" YEAR"
  echo "Required environment variables: AWS_S3_BUCKET"
  exit 1
fi

IA_ID="$1"
TITLE="$2"
CREATOR="$3"
YEAR="$4"

# Check required environment variables
if [ -z "${AWS_S3_BUCKET:-}" ]; then
  echo "ERROR: AWS_S3_BUCKET environment variable is required"
  exit 1
fi

AWS_REGION="${AWS_REGION:-us-east-1}"

# Create temporary working directory
WORK_DIR=$(mktemp -d)
trap 'rm -rf "${WORK_DIR:-}"' EXIT

echo "Working directory: $WORK_DIR"

# Sanitize IA_ID for use in filenames and S3 paths
VIDEO_ID=$(echo "$IA_ID" | tr '/' '_' | tr -cd '[:alnum:]_-')
S3_BASE_PATH="videos/${VIDEO_ID}"

echo "=== Fetching metadata for ${IA_ID}..."
META_JSON=$(curl -s "https://archive.org/metadata/${IA_ID}")
if [ -z "$META_JSON" ]; then
  echo "ERROR: no metadata for ${IA_ID}"
  exit 1
fi

# Choose a video file (prefer mp4/webm/ogg)
FILE_NAME=$(echo "$META_JSON" | jq -r '.files[] | select(.name | test("\\.(mp4|webm|ogg)$"; "i")) | .name' | head -n1)
if [ -z "$FILE_NAME" ]; then
  echo "No direct video file found for ${IA_ID}"
  echo "Available files:"
  echo "$META_JSON" | jq -r '.files[] | .name'
  exit 1
fi

DOWNLOAD_URL="https://archive.org/download/${IA_ID}/${FILE_NAME}"
INPUT_FILE="${WORK_DIR}/input.mp4"

echo "=== Downloading ${DOWNLOAD_URL}..."
curl -L -o "$INPUT_FILE" "$DOWNLOAD_URL"

echo "=== Transcoding to adaptive HLS (720p/480p/360p)..."

# Create HLS output directory
HLS_DIR="${WORK_DIR}/hls"
mkdir -p "$HLS_DIR"

# Transcode to multiple bitrates and create HLS segments
# 720p @ 2800kbps, 480p @ 1400kbps, 360p @ 800kbps
ffmpeg -y -i "$INPUT_FILE" \
  -filter_complex \
  "[0:v]split=3[v1][v2][v3]; \
   [v1]scale=w=1280:h=720[v1out]; \
   [v2]scale=w=854:h=480[v2out]; \
   [v3]scale=w=640:h=360[v3out]" \
  -map "[v1out]" -c:v:0 libx264 -b:v:0 2800k -maxrate:v:0 2996k -bufsize:v:0 4200k -preset fast -g 48 -sc_threshold 0 \
  -map "[v2out]" -c:v:1 libx264 -b:v:1 1400k -maxrate:v:1 1498k -bufsize:v:1 2100k -preset fast -g 48 -sc_threshold 0 \
  -map "[v3out]" -c:v:2 libx264 -b:v:2 800k -maxrate:v:2 856k -bufsize:v:2 1200k -preset fast -g 48 -sc_threshold 0 \
  -map a:0 -c:a:0 aac -b:a:0 128k -ac 2 \
  -map a:0 -c:a:1 aac -b:a:1 128k -ac 2 \
  -map a:0 -c:a:2 aac -b:a:2 96k -ac 2 \
  -var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2" \
  -master_pl_name master.m3u8 \
  -f hls \
  -hls_time 6 \
  -hls_list_size 0 \
  -hls_segment_filename "${HLS_DIR}/stream_%v/segment_%03d.ts" \
  "${HLS_DIR}/stream_%v/playlist.m3u8"

echo "=== Generating thumbnails..."

THUMB_DIR="${WORK_DIR}/thumbnails"
mkdir -p "$THUMB_DIR"

# Extract a frame at 10% of video duration for thumbnails
DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$INPUT_FILE")
THUMB_TIME=$(echo "$DURATION * 0.1" | bc)

# Generate small thumbnail (360x202)
ffmpeg -y -ss "$THUMB_TIME" -i "$INPUT_FILE" -vframes 1 -vf "scale=360:202:force_original_aspect_ratio=decrease,pad=360:202:(ow-iw)/2:(oh-ih)/2" "${THUMB_DIR}/thumb_small.jpg"

# Generate medium thumbnail (640x360)
ffmpeg -y -ss "$THUMB_TIME" -i "$INPUT_FILE" -vframes 1 -vf "scale=640:360:force_original_aspect_ratio=decrease,pad=640:360:(ow-iw)/2:(oh-ih)/2" "${THUMB_DIR}/thumb_medium.jpg"

# Generate large thumbnail (1280x720)
ffmpeg -y -ss "$THUMB_TIME" -i "$INPUT_FILE" -vframes 1 -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" "${THUMB_DIR}/thumb_large.jpg"

# Generate LQIP (Low Quality Image Placeholder) - small blurred version
ffmpeg -y -ss "$THUMB_TIME" -i "$INPUT_FILE" -vframes 1 -vf "scale=64:36,boxblur=5:1" "${THUMB_DIR}/thumb_lqip.jpg"

echo "=== Uploading to S3..."

# Upload HLS segments and playlists
aws s3 sync "${HLS_DIR}/" "s3://${AWS_S3_BUCKET}/${S3_BASE_PATH}/hls/" \
  --region "$AWS_REGION" \
  --content-type application/vnd.apple.mpegurl \
  --exclude "*" \
  --include "*.m3u8"

aws s3 sync "${HLS_DIR}/" "s3://${AWS_S3_BUCKET}/${S3_BASE_PATH}/hls/" \
  --region "$AWS_REGION" \
  --content-type video/mp2t \
  --exclude "*" \
  --include "*.ts"

# Upload thumbnails
aws s3 sync "${THUMB_DIR}/" "s3://${AWS_S3_BUCKET}/${S3_BASE_PATH}/thumbnails/" \
  --region "$AWS_REGION" \
  --content-type image/jpeg

# Create and upload metadata JSON
METADATA_FILE="${WORK_DIR}/metadata.json"
cat > "$METADATA_FILE" <<EOF
{
  "id": "${VIDEO_ID}",
  "original_ia_id": "${IA_ID}",
  "title": $(echo "$TITLE" | jq -R .),
  "creator": $(echo "$CREATOR" | jq -R .),
  "year": "${YEAR}",
  "source": "Internet Archive",
  "source_type": "internet_archive",
  "license": "Public Domain",
  "public_domain": true,
  "hls_master_url": "s3://${AWS_S3_BUCKET}/${S3_BASE_PATH}/hls/master.m3u8",
  "thumbnails": {
    "small": "s3://${AWS_S3_BUCKET}/${S3_BASE_PATH}/thumbnails/thumb_small.jpg",
    "medium": "s3://${AWS_S3_BUCKET}/${S3_BASE_PATH}/thumbnails/thumb_medium.jpg",
    "large": "s3://${AWS_S3_BUCKET}/${S3_BASE_PATH}/thumbnails/thumb_large.jpg",
    "lqip": "s3://${AWS_S3_BUCKET}/${S3_BASE_PATH}/thumbnails/thumb_lqip.jpg"
  },
  "duration_seconds": ${DURATION%.*},
  "imported_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

aws s3 cp "$METADATA_FILE" "s3://${AWS_S3_BUCKET}/${S3_BASE_PATH}/metadata.json" \
  --region "$AWS_REGION" \
  --content-type application/json

echo "=== Upload complete!"
echo "Master playlist: s3://${AWS_S3_BUCKET}/${S3_BASE_PATH}/hls/master.m3u8"
echo "Metadata: s3://${AWS_S3_BUCKET}/${S3_BASE_PATH}/metadata.json"
echo ""
echo "Add this entry to your videos table:"
echo "  hls_master_url: https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${S3_BASE_PATH}/hls/master.m3u8"
echo "  thumbnails: see metadata.json"
echo "  source_type: internet_archive"
echo "  license: Public Domain"
