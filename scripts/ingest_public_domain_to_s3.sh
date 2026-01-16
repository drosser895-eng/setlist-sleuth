#!/usr/bin/env bash
# scripts/ingest_public_domain_to_s3.sh
# Ingest a public domain video from Internet Archive, transcode to adaptive HLS,
# generate thumbnails, and upload to S3.
# Requirements: curl, jq, ffmpeg, aws-cli
# Usage:
#   ./scripts/ingest_public_domain_to_s3.sh <internet-archive-identifier> "Friendly Title" "Creator Name" YEAR
# Example:
#   ./scripts/ingest_public_domain_to_s3.sh "prelinger/clip-1234" "Vintage Music Clip" "Prelinger Archives" 1950

set -euo pipefail

if [ "$#" -lt 4 ]; then
  echo "Usage: $0 <ia_id> \"Title\" \"Creator\" YEAR"
  exit 1
fi

IA_ID="$1"
TITLE="$2"
CREATOR="$3"
YEAR="$4"

# Check for required environment variables
if [ -z "${AWS_S3_BUCKET:-}" ]; then
  echo "ERROR: AWS_S3_BUCKET environment variable is not set"
  exit 1
fi

# Set base URL for video access (defaults to S3, but can be overridden for CloudFront/CDN)
BASE_URL="${VIDEO_BASE_URL:-https://s3.amazonaws.com/${AWS_S3_BUCKET}}"

# Create temporary working directory
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

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
TMP_FILE="${TMP_DIR}/source.mp4"

echo "Downloading ${DOWNLOAD_URL}..."
curl -L -o "$TMP_FILE" "$DOWNLOAD_URL"

# Create HLS output directory
HLS_DIR="${TMP_DIR}/hls"
mkdir -p "$HLS_DIR"

# Video ID for S3 paths
VIDEO_ID=$(echo "${IA_ID}" | sed 's/[^a-zA-Z0-9_-]/_/g')
S3_BASE_PATH="videos/${VIDEO_ID}"

echo "Transcoding to adaptive HLS (720p/480p/360p)..."

# Generate HLS with multiple bitrates
# 720p @ 2.8Mbps, 480p @ 1.4Mbps, 360p @ 800Kbps
ffmpeg -y -i "$TMP_FILE" \
  -filter_complex \
  "[0:v]split=3[v1][v2][v3]; \
   [v1]scale=w=1280:h=720:force_original_aspect_ratio=decrease[v1out]; \
   [v2]scale=w=854:h=480:force_original_aspect_ratio=decrease[v2out]; \
   [v3]scale=w=640:h=360:force_original_aspect_ratio=decrease[v3out]" \
  -map "[v1out]" -c:v:0 libx264 -b:v:0 2800k -maxrate:v:0 2996k -bufsize:v:0 4200k -preset fast -g 48 -sc_threshold 0 \
  -map "[v2out]" -c:v:1 libx264 -b:v:1 1400k -maxrate:v:1 1498k -bufsize:v:1 2100k -preset fast -g 48 -sc_threshold 0 \
  -map "[v3out]" -c:v:2 libx264 -b:v:2 800k -maxrate:v:2 856k -bufsize:v:2 1200k -preset fast -g 48 -sc_threshold 0 \
  -map a:0 -c:a:0 aac -b:a:0 128k -ac 2 \
  -map a:0 -c:a:1 aac -b:a:1 96k -ac 2 \
  -map a:0 -c:a:2 aac -b:a:2 64k -ac 2 \
  -var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2" \
  -master_pl_name master.m3u8 \
  -f hls -hls_time 6 -hls_list_size 0 \
  -hls_segment_filename "${HLS_DIR}/v%v/seg%03d.ts" \
  "${HLS_DIR}/v%v/playlist.m3u8"

if [ $? -ne 0 ]; then
  echo "ERROR: HLS transcoding failed"
  exit 1
fi

echo "Generating thumbnails..."
THUMBS_DIR="${TMP_DIR}/thumbs"
mkdir -p "$THUMBS_DIR"

# Extract a frame at 5 seconds for thumbnail generation
ffmpeg -y -i "$TMP_FILE" -ss 00:00:05 -vframes 1 -q:v 2 "${THUMBS_DIR}/frame.jpg"

# Generate different sizes
# Small: 160x90
ffmpeg -y -i "${THUMBS_DIR}/frame.jpg" -vf scale=160:90 "${THUMBS_DIR}/thumb_small.jpg"

# Medium: 320x180
ffmpeg -y -i "${THUMBS_DIR}/frame.jpg" -vf scale=320:180 "${THUMBS_DIR}/thumb_medium.jpg"

# Large: 640x360
ffmpeg -y -i "${THUMBS_DIR}/frame.jpg" -vf scale=640:360 "${THUMBS_DIR}/thumb_large.jpg"

# LQIP (Low Quality Image Placeholder): 64x36 with blur
ffmpeg -y -i "${THUMBS_DIR}/frame.jpg" -vf "scale=64:36,boxblur=5:1" "${THUMBS_DIR}/thumb_lqip.jpg"

echo "Uploading to S3..."

# Upload HLS segments and playlists with correct content types
for variant_dir in "${HLS_DIR}"/v*; do
  if [ -d "$variant_dir" ]; then
    variant_name=$(basename "$variant_dir")
    # Upload .ts segments with video/mp2t content-type
    aws s3 cp "$variant_dir" "s3://${AWS_S3_BUCKET}/${S3_BASE_PATH}/${variant_name}/" --recursive \
      --exclude "*" --include "*.ts" \
      --content-type "video/mp2t"
    # Upload .m3u8 playlists with HLS content-type
    aws s3 cp "$variant_dir" "s3://${AWS_S3_BUCKET}/${S3_BASE_PATH}/${variant_name}/" --recursive \
      --exclude "*" --include "*.m3u8" \
      --content-type "application/vnd.apple.mpegurl"
  fi
done

# Upload master playlist
aws s3 cp "${HLS_DIR}/master.m3u8" "s3://${AWS_S3_BUCKET}/${S3_BASE_PATH}/master.m3u8" \
  --content-type "application/vnd.apple.mpegurl"

# Upload thumbnails
aws s3 cp "${THUMBS_DIR}/thumb_small.jpg" "s3://${AWS_S3_BUCKET}/${S3_BASE_PATH}/thumb_small.jpg" --content-type "image/jpeg"
aws s3 cp "${THUMBS_DIR}/thumb_medium.jpg" "s3://${AWS_S3_BUCKET}/${S3_BASE_PATH}/thumb_medium.jpg" --content-type "image/jpeg"
aws s3 cp "${THUMBS_DIR}/thumb_large.jpg" "s3://${AWS_S3_BUCKET}/${S3_BASE_PATH}/thumb_large.jpg" --content-type "image/jpeg"
aws s3 cp "${THUMBS_DIR}/thumb_lqip.jpg" "s3://${AWS_S3_BUCKET}/${S3_BASE_PATH}/thumb_lqip.jpg" --content-type "image/jpeg"

# Generate metadata file
METADATA_FILE="${TMP_DIR}/metadata.json"
cat > "$METADATA_FILE" <<EOF
{
  "id": "${IA_ID}",
  "video_id": "${VIDEO_ID}",
  "title": "$(printf '%s' "$TITLE" | sed 's/"/\\"/g')",
  "creator": "$(printf '%s' "$CREATOR" | sed 's/"/\\"/g')",
  "year": "${YEAR}",
  "source": "Internet Archive",
  "source_type": "public_domain",
  "license": "Public Domain",
  "public_domain": true,
  "hls_master_url": "${BASE_URL}/${S3_BASE_PATH}/master.m3u8",
  "thumbnails": {
    "small": "${BASE_URL}/${S3_BASE_PATH}/thumb_small.jpg",
    "medium": "${BASE_URL}/${S3_BASE_PATH}/thumb_medium.jpg",
    "large": "${BASE_URL}/${S3_BASE_PATH}/thumb_large.jpg",
    "lqip": "${BASE_URL}/${S3_BASE_PATH}/thumb_lqip.jpg"
  },
  "imported_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

# Upload metadata
aws s3 cp "$METADATA_FILE" "s3://${AWS_S3_BUCKET}/${S3_BASE_PATH}/metadata.json" --content-type "application/json"

echo ""
echo "✓ Successfully ingested ${VIDEO_ID} to S3"
echo "  HLS Master Playlist: ${BASE_URL}/${S3_BASE_PATH}/master.m3u8"
echo "  Metadata: ${BASE_URL}/${S3_BASE_PATH}/metadata.json"
echo ""
echo "Add this video to your CMS/database to make it available on BlazeTV."
