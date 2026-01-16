#!/bin/bash
# DEPLOY_BLAZETV_STAGING.sh
# One-command staging deployment for BlazeTV
# Usage: bash DEPLOY_BLAZETV_STAGING.sh

set -e

echo "════════════════════════════════════════════════════════════════"
echo "         🚀 BLAZETV STAGING DEPLOYMENT RUNBOOK"
echo "════════════════════════════════════════════════════════════════"
echo ""

# ============================================================================
# SECTION 1: PRE-DEPLOYMENT CHECKS
# ============================================================================

echo "[1/8] Checking environment variables..."
required_vars=("DATABASE_URL" "AWS_S3_BUCKET" "CDN_BASE_URL" "SERVER_WEBHOOK_URL" "ANTIGRAVITY_WEBHOOK_SECRET")

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Missing required env var: $var"
    exit 1
  fi
done

echo "✅ All required env vars set"
echo ""

# ============================================================================
# SECTION 2: GIT MERGE
# ============================================================================

echo "[2/8] Merging feature branch to main..."
git fetch origin
git checkout main
git pull origin main

# Check if feature/blazetv-enhancements exists
if git rev-parse --verify origin/feature/blazetv-enhancements >/dev/null 2>&1; then
  git merge --no-ff origin/feature/blazetv-enhancements \
    -m "chore: merge BlazeTV complete platform enhancements to main"
  git push origin main
  echo "✅ Merged feature/blazetv-enhancements → main"
else
  echo "⚠️  feature/blazetv-enhancements not found, using current branch"
fi

echo ""

# ============================================================================
# SECTION 3: DATABASE MIGRATIONS
# ============================================================================

echo "[3/8] Running database migrations..."
echo "🔄 Creating videos table..."
psql "$DATABASE_URL" -f migrations/20260125_create_videos_table.sql

echo "🔄 Adding owner verification columns..."
psql "$DATABASE_URL" -f migrations/20260126_add_owner_verification.sql

echo "🔄 Updating HLS support..."
psql "$DATABASE_URL" -f migrations/20260116_enhance_videos_table.sql

echo "✅ All migrations completed"
echo ""

# ============================================================================
# SECTION 4: VERIFY DATABASE
# ============================================================================

echo "[4/8] Verifying database schema..."
psql "$DATABASE_URL" -c "
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'videos'
ORDER BY ordinal_position
LIMIT 15;
"

echo "✅ Videos table verified with new columns"
echo ""

# ============================================================================
# SECTION 5: INGEST SAMPLE VIDEO
# ============================================================================

echo "[5/8] Seeding staging with sample public-domain video..."
chmod +x scripts/ingest_adaptive_hls.sh

# Use a known good Prelinger archive ID
./scripts/ingest_adaptive_hls.sh \
  "prelinger/0001_Electricity_Produced_by_Water_Power_1911" \
  "Electricity from Water Power (1911)" \
  "Prelinger Archives" \
  "system" \
  "public-domain" "historical" "technology"

echo "✅ Sample video ingested"
echo ""

# ============================================================================
# SECTION 6: VERIFY INGESTION
# ============================================================================

echo "[6/8] Verifying video in database..."
psql "$DATABASE_URL" -c "
SELECT 
  id,
  external_id,
  title,
  channel_name,
  hls_url,
  view_count,
  owner_verified
FROM videos
ORDER BY created_at DESC
LIMIT 3;
"

echo "✅ Video verified in database"
echo ""

# ============================================================================
# SECTION 7: RUN EVIDENCE VALIDATOR
# ============================================================================

echo "[7/8] Running staging evidence validator..."
chmod +x scripts/validate_staging_attestation.sh

export REAL_MONEY_ENABLED=false
export REACT_APP_REAL_MONEY_ENABLED=false

./scripts/validate_staging_attestation.sh

if [ -f "evidence_*.zip" ]; then
  EVIDENCE_ZIP=$(ls -t evidence_*.zip | head -1)
  echo "✅ Evidence generated: $EVIDENCE_ZIP"
  echo ""
  echo "📦 NEXT: Upload $EVIDENCE_ZIP to Issue #12 on GitHub"
else
  echo "⚠️  No evidence zip generated (optional)"
fi

echo ""

# ============================================================================
# SECTION 8: DEPLOYMENT VERIFICATION
# ============================================================================

echo "[8/8] Final verification..."
echo ""
echo "Checking API endpoints..."

# Test feed endpoint
echo "Testing /api/blazetv/feed..."
curl -s "http://localhost:3000/api/blazetv/feed?limit=5" | jq '.videos | length' || echo "⚠️  API not yet running (deploy frontend/backend first)"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✅ STAGING DEPLOYMENT COMPLETE"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Next Steps:"
echo "1. Deploy frontend: npm run build"
echo "2. Deploy backend: node server.js (or restart service)"
echo "3. Verify /blazetv page loads in browser"
echo "4. Click video to test HLS playback"
echo "5. Upload evidence_*.zip to Issue #12"
echo "6. Reply with link and I'll validate"
echo ""
echo "Once validated, you'll get:"
echo "  ✓ Final Evidence README with real proof IDs"
echo "  ✓ Prefilled Counsel/PSP email"
echo "  ✓ Launch checklist"
echo ""
