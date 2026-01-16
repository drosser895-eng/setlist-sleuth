#!/bin/bash
# scripts/verify_youtube_ownership.sh
# Verify YouTube videos are owned by your channel and mark them owner_verified in DB
# This unflag red-flagged uploads immediately (safe if you own the channel)

set -e

echo "════════════════════════════════════════════════════════════════"
echo "     🔐 YouTube Video Ownership Verification Tool"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Check required tools
if ! command -v psql &> /dev/null; then
  echo "❌ psql not found. Install PostgreSQL client."
  exit 1
fi

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not set"
  exit 1
fi

# ============================================================================
# MANUAL MODE: Direct database update (if you own the channel)
# ============================================================================

echo "Mode: Direct Owner Verification (for your own channels)"
echo ""
echo "If you own the YouTube channel that uploaded these videos,"
echo "this is a safe admin operation. You'll run psql to mark videos"
echo "as owner_verified, which removes red flags immediately."
echo ""

read -p "Do you own these YouTube channels? (yes/no): " owns_channels

if [ "$owns_channels" != "yes" ]; then
  echo "❌ Operation cancelled. Only run this if you own the channels."
  exit 0
fi

echo ""
echo "Enter YouTube channel ID (e.g., UCxxxxxxxxxxxxxxxx):"
read -p "Channel ID: " channel_id

if [ -z "$channel_id" ]; then
  echo "❌ Channel ID required"
  exit 1
fi

echo ""
echo "Enter YouTube video IDs to verify (comma-separated, e.g., abc123,def456):"
read -p "Video IDs: " video_ids

if [ -z "$video_ids" ]; then
  echo "❌ Video IDs required"
  exit 1
fi

# ============================================================================
# EXECUTE VERIFICATION
# ============================================================================

echo ""
echo "🔄 Marking videos as owner_verified in database..."

# Convert comma-separated to SQL array
IFS=',' read -ra VIDEO_ARRAY <<< "$video_ids"
VIDEO_LIST=$(printf ",'%s'" "${VIDEO_ARRAY[@]}" | cut -c2-)

psql "$DATABASE_URL" << SQL
UPDATE videos
SET 
  owner_verified = true,
  owner_channel_id = '$channel_id',
  ownership_proof_url = 'https://www.youtube.com/channel/$channel_id',
  moderation_flags = '[]'::jsonb,
  owner_id = '$channel_id'
WHERE external_id IN ($VIDEO_LIST);

SELECT 
  id,
  external_id,
  title,
  owner_verified,
  moderation_flags
FROM videos
WHERE external_id IN ($VIDEO_LIST);
SQL

echo ""
echo "✅ Videos marked as owner_verified"
echo ""
echo "This removes red flags from:"
echo "  ✓ UI components will hide moderation warnings"
echo "  ✓ Verified badge will display"
echo "  ✓ Featured placement available"
echo ""
echo "The changes are immediate (no app restart needed)."
echo ""
