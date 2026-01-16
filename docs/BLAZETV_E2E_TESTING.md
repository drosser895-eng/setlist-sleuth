# BlazeTV End-to-End Testing Guide

## Overview
This document outlines comprehensive end-to-end testing procedures for BlazeTV production readiness features, including adaptive HLS streaming, owner verification, and watch history tracking.

## Test Environment Setup

### Prerequisites
```bash
# Install required tools
npm install
npm install -g @aws-sdk/client-s3 # For S3 testing

# Set up test environment variables
export AWS_S3_BUCKET=blazetv-test-bucket
export AWS_REGION=us-east-1
export DATABASE_URL=postgresql://test:test@localhost:5432/blazetv_test
export NODE_ENV=test
```

### Test Database Setup
```bash
# Create test database
createdb blazetv_test

# Run migrations
psql $DATABASE_URL < migrations/20260126_add_owner_verification.sql
psql $DATABASE_URL < migrations/20260126_update_videos_hls.sql
psql $DATABASE_URL < migrations/20260127_create_watch_events.sql

# Seed test data
psql $DATABASE_URL <<EOF
-- Create test videos table if not exists
CREATE TABLE IF NOT EXISTS videos (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert test video
INSERT INTO videos (title, description) 
VALUES ('Test Video 1', 'A test video for E2E testing')
RETURNING id;
EOF
```

## Test Suites

### 1. Database Migration Tests

#### Test 1.1: Owner Verification Columns
```bash
# Test that owner verification columns exist
psql $DATABASE_URL -c "SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'videos' 
AND column_name IN ('owner_verified', 'owner_channel_id', 'ownership_proof_url', 'provenance', 'moderation_flags');"

# Expected: 5 columns returned
# owner_verified: boolean, default false
# owner_channel_id: character varying(255), nullable
# ownership_proof_url: text, nullable
# provenance: jsonb, default '{}'::jsonb
# moderation_flags: jsonb, default '[]'::jsonb
```

**Expected Result:** ✅ All columns exist with correct data types and defaults

#### Test 1.2: HLS and Metadata Columns
```bash
# Test that HLS columns exist
psql $DATABASE_URL -c "SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'videos' 
AND column_name IN ('hls_master_url', 'thumbnails', 'source_type', 'license');"

# Expected: 4 columns returned
```

**Expected Result:** ✅ All HLS columns exist

#### Test 1.3: Watch Events Table
```bash
# Test watch_events table structure
psql $DATABASE_URL -c "\d watch_events"

# Verify indexes
psql $DATABASE_URL -c "SELECT indexname FROM pg_indexes WHERE tablename = 'watch_events';"

# Expected indexes:
# - idx_watch_events_user_id
# - idx_watch_events_video_id
# - idx_watch_events_user_video
# - idx_watch_events_created_at
# - idx_watch_events_event
```

**Expected Result:** ✅ Table exists with all required columns and indexes

#### Test 1.4: Data Integrity
```bash
# Test inserting data into new columns
psql $DATABASE_URL <<EOF
-- Test owner verification
UPDATE videos SET 
  owner_verified = true,
  owner_channel_id = 'UC_TEST_123',
  ownership_proof_url = 'https://example.com/proof.pdf',
  provenance = '{"source": "test", "verified_by": "admin"}',
  moderation_flags = '["reviewed", "approved"]'
WHERE id = 1;

-- Test HLS columns
UPDATE videos SET 
  hls_master_url = 'https://cdn.test.com/master.m3u8',
  thumbnails = '{"small": "thumb_s.jpg", "medium": "thumb_m.jpg", "large": "thumb_l.jpg", "lqip": "thumb_lqip.jpg"}',
  source_type = 'internet_archive',
  license = 'Public Domain'
WHERE id = 1;

-- Test watch events
INSERT INTO watch_events (user_id, video_id, watched_seconds, duration_seconds, event)
VALUES ('test_user_1', 1, 120, 300, '{"device": "mobile", "quality": "720p"}');

-- Verify data
SELECT * FROM videos WHERE id = 1;
SELECT * FROM watch_events;
EOF
```

**Expected Result:** ✅ All inserts and updates succeed without errors

### 2. Ingest Script Tests

#### Test 2.1: Script Validation
```bash
# Check script exists and is executable
test -x scripts/ingest_public_domain_to_s3.sh && echo "✓ Script is executable" || echo "✗ Script not executable"

# Validate bash syntax
bash -n scripts/ingest_public_domain_to_s3.sh && echo "✓ Syntax valid" || echo "✗ Syntax errors"
```

**Expected Result:** ✅ Script exists, executable, and has valid syntax

#### Test 2.2: Dependency Check
```bash
# Check required commands
for cmd in curl jq ffmpeg aws; do
  command -v $cmd >/dev/null 2>&1 && echo "✓ $cmd installed" || echo "✗ $cmd missing"
done

# Check FFmpeg HLS support
ffmpeg -codecs 2>/dev/null | grep -q h264 && echo "✓ H.264 codec available" || echo "✗ H.264 missing"
ffmpeg -protocols 2>/dev/null | grep -q hls && echo "✓ HLS protocol available" || echo "✗ HLS missing"
```

**Expected Result:** ✅ All dependencies installed and configured

#### Test 2.3: Full Ingest Pipeline (Integration Test)
```bash
# Create test S3 bucket
aws s3 mb s3://$AWS_S3_BUCKET --region $AWS_REGION 2>/dev/null || true

# Run ingest script with a small test video
./scripts/ingest_public_domain_to_s3.sh \
  "prelinger/prelinger_Deadline_fo_Action_1946" \
  "Deadline for Action" \
  "Prelinger Archives" \
  1946

# Verify S3 uploads
VIDEO_ID="prelinger_prelinger_Deadline_fo_Action_1946"

# Check master playlist
aws s3 ls s3://$AWS_S3_BUCKET/videos/$VIDEO_ID/hls/master.m3u8 && echo "✓ Master playlist uploaded" || echo "✗ Master playlist missing"

# Check variant playlists
for stream in 0 1 2; do
  aws s3 ls s3://$AWS_S3_BUCKET/videos/$VIDEO_ID/hls/stream_$stream/playlist.m3u8 && echo "✓ Stream $stream playlist uploaded" || echo "✗ Stream $stream playlist missing"
done

# Check thumbnails
for size in small medium large lqip; do
  aws s3 ls s3://$AWS_S3_BUCKET/videos/$VIDEO_ID/thumbnails/thumb_$size.jpg && echo "✓ Thumbnail $size uploaded" || echo "✗ Thumbnail $size missing"
done

# Check metadata
aws s3 ls s3://$AWS_S3_BUCKET/videos/$VIDEO_ID/metadata.json && echo "✓ Metadata uploaded" || echo "✗ Metadata missing"
```

**Expected Result:** ✅ All files uploaded successfully to S3

#### Test 2.4: HLS Quality Validation
```bash
# Download and validate master playlist
MASTER_URL="https://$AWS_S3_BUCKET.s3.$AWS_REGION.amazonaws.com/videos/$VIDEO_ID/hls/master.m3u8"

# Check master playlist contains all variants
curl -s "$MASTER_URL" | grep -c "BANDWIDTH" | grep -q "3" && echo "✓ 3 variants in master" || echo "✗ Wrong number of variants"

# Verify bitrates
curl -s "$MASTER_URL" | grep "BANDWIDTH" | grep -q "2800000" && echo "✓ 720p variant exists" || echo "✗ 720p missing"
curl -s "$MASTER_URL" | grep "BANDWIDTH" | grep -q "1400000" && echo "✓ 480p variant exists" || echo "✗ 480p missing"
curl -s "$MASTER_URL" | grep "BANDWIDTH" | grep -q "800000" && echo "✓ 360p variant exists" || echo "✗ 360p missing"

# Verify a sample segment exists
SEGMENT_URL="https://$AWS_S3_BUCKET.s3.$AWS_REGION.amazonaws.com/videos/$VIDEO_ID/hls/stream_0/segment_000.ts"
curl -I "$SEGMENT_URL" 2>&1 | grep -q "200 OK" && echo "✓ Segment accessible" || echo "✗ Segment not accessible"
```

**Expected Result:** ✅ HLS stream has correct variants and segments are accessible

#### Test 2.5: Thumbnail Quality Validation
```bash
# Download thumbnails and check dimensions
THUMB_BASE="https://$AWS_S3_BUCKET.s3.$AWS_REGION.amazonaws.com/videos/$VIDEO_ID/thumbnails"

# Check small thumbnail (360x202)
curl -s "$THUMB_BASE/thumb_small.jpg" | ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 - 2>&1 | grep -q "360,202" && echo "✓ Small thumb correct size" || echo "✗ Small thumb wrong size"

# Check medium thumbnail (640x360)
curl -s "$THUMB_BASE/thumb_medium.jpg" | ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 - 2>&1 | grep -q "640,360" && echo "✓ Medium thumb correct size" || echo "✗ Medium thumb wrong size"

# Check large thumbnail (1280x720)
curl -s "$THUMB_BASE/thumb_large.jpg" | ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 - 2>&1 | grep -q "1280,720" && echo "✓ Large thumb correct size" || echo "✗ Large thumb wrong size"

# Check LQIP exists and is small
LQIP_SIZE=$(curl -s "$THUMB_BASE/thumb_lqip.jpg" | wc -c)
[ "$LQIP_SIZE" -lt 10000 ] && echo "✓ LQIP is small (<10KB)" || echo "✗ LQIP too large"
```

**Expected Result:** ✅ All thumbnails have correct dimensions

### 3. Watch History Tests

#### Test 3.1: Recording Watch Events
```bash
psql $DATABASE_URL <<EOF
-- Clear previous test data
DELETE FROM watch_events;

-- Insert test watch events
INSERT INTO watch_events (user_id, video_id, watched_seconds, duration_seconds, event)
VALUES 
  ('user1', 1, 150, 300, '{"device": "desktop", "quality": "720p", "completed": false}'),
  ('user1', 1, 300, 300, '{"device": "desktop", "quality": "720p", "completed": true}'),
  ('user1', 2, 60, 200, '{"device": "mobile", "quality": "480p", "completed": false}'),
  ('user2', 1, 100, 300, '{"device": "mobile", "quality": "360p", "completed": false}');

-- Query user watch history
SELECT user_id, video_id, watched_seconds, duration_seconds, created_at
FROM watch_events
WHERE user_id = 'user1'
ORDER BY created_at DESC;

-- Expected: 3 events for user1
EOF
```

**Expected Result:** ✅ Events recorded correctly and queryable

#### Test 3.2: Watch Analytics
```bash
psql $DATABASE_URL <<EOF
-- Test aggregation queries
SELECT 
  video_id,
  COUNT(*) as view_count,
  AVG(watched_seconds) as avg_watch_time,
  SUM(CASE WHEN watched_seconds >= duration_seconds THEN 1 ELSE 0 END) as completed_views
FROM watch_events
GROUP BY video_id
ORDER BY view_count DESC;

-- Test user engagement metrics
SELECT 
  user_id,
  COUNT(DISTINCT video_id) as videos_watched,
  SUM(watched_seconds) as total_watch_time,
  COUNT(*) as total_events
FROM watch_events
GROUP BY user_id;

-- Test device breakdown
SELECT 
  event->>'device' as device,
  COUNT(*) as count
FROM watch_events
GROUP BY event->>'device';
EOF
```

**Expected Result:** ✅ Analytics queries return correct aggregations

#### Test 3.3: Index Performance
```bash
psql $DATABASE_URL <<EOF
-- Test index usage with EXPLAIN
EXPLAIN ANALYZE
SELECT * FROM watch_events 
WHERE user_id = 'user1' 
ORDER BY created_at DESC 
LIMIT 10;

-- Expected: Index Scan using idx_watch_events_user_id

EXPLAIN ANALYZE
SELECT * FROM watch_events 
WHERE video_id = 1 
ORDER BY created_at DESC;

-- Expected: Index Scan using idx_watch_events_video_id
EOF
```

**Expected Result:** ✅ Queries use indexes efficiently

### 4. Owner Verification Tests

#### Test 4.1: Verification Workflow
```bash
psql $DATABASE_URL <<EOF
-- Test unverified content (default state)
SELECT owner_verified, moderation_flags 
FROM videos WHERE id = 1;
-- Expected: owner_verified = false, moderation_flags = []

-- Simulate verification process
UPDATE videos SET 
  owner_verified = true,
  owner_channel_id = 'UC_VERIFIED_123',
  ownership_proof_url = 'https://verify.example.com/proof123.pdf',
  provenance = jsonb_build_object(
    'verified_at', NOW(),
    'verified_by', 'admin@example.com',
    'verification_method', 'channel_ownership'
  ),
  moderation_flags = '["verified", "safe_content"]'::jsonb
WHERE id = 1;

-- Verify update
SELECT owner_verified, owner_channel_id, provenance, moderation_flags 
FROM videos WHERE id = 1;
EOF
```

**Expected Result:** ✅ Verification data stored correctly

#### Test 4.2: Moderation Flags
```bash
psql $DATABASE_URL <<EOF
-- Test adding moderation flags
UPDATE videos SET 
  moderation_flags = moderation_flags || '["reviewed"]'::jsonb
WHERE id = 1;

-- Test querying by moderation status
SELECT id, title, moderation_flags
FROM videos
WHERE moderation_flags @> '["verified"]'::jsonb;

-- Test filtering unmoderated content
SELECT id, title
FROM videos
WHERE moderation_flags = '[]'::jsonb OR moderation_flags IS NULL;
EOF
```

**Expected Result:** ✅ Moderation flags can be queried efficiently

### 5. Integration Tests

#### Test 5.1: Complete Video Lifecycle
```bash
# 1. Ingest video
./scripts/ingest_public_domain_to_s3.sh \
  "test/sample" \
  "Test Video" \
  "Test Creator" \
  2026

# 2. Update database with video metadata
psql $DATABASE_URL <<EOF
INSERT INTO videos (
  title, 
  description, 
  hls_master_url, 
  thumbnails, 
  source_type, 
  license,
  owner_verified
) VALUES (
  'Test Video',
  'Integration test video',
  'https://$AWS_S3_BUCKET.s3.$AWS_REGION.amazonaws.com/videos/test_sample/hls/master.m3u8',
  '{"small": "thumb_small.jpg", "medium": "thumb_medium.jpg", "large": "thumb_large.jpg", "lqip": "thumb_lqip.jpg"}'::jsonb,
  'internet_archive',
  'Public Domain',
  false
) RETURNING id;
EOF

# 3. Simulate user watching video
psql $DATABASE_URL <<EOF
INSERT INTO watch_events (user_id, video_id, watched_seconds, duration_seconds, event)
SELECT 'test_user', id, 150, 300, '{"quality": "720p", "device": "desktop"}'::jsonb
FROM videos WHERE title = 'Test Video';
EOF

# 4. Verify complete workflow
psql $DATABASE_URL <<EOF
SELECT 
  v.id,
  v.title,
  v.hls_master_url,
  v.owner_verified,
  COUNT(we.id) as view_count
FROM videos v
LEFT JOIN watch_events we ON v.id = we.video_id
WHERE v.title = 'Test Video'
GROUP BY v.id, v.title, v.hls_master_url, v.owner_verified;
EOF
```

**Expected Result:** ✅ Complete workflow executes successfully

### 6. Performance Tests

#### Test 6.1: Query Performance
```bash
# Insert test data
psql $DATABASE_URL <<EOF
-- Insert 1000 test watch events
INSERT INTO watch_events (user_id, video_id, watched_seconds, duration_seconds, event)
SELECT 
  'user_' || (random() * 100)::int,
  (random() * 10)::int + 1,
  (random() * 300)::int,
  300,
  jsonb_build_object('device', CASE WHEN random() < 0.5 THEN 'mobile' ELSE 'desktop' END)
FROM generate_series(1, 1000);

-- Test query performance
\timing on
SELECT user_id, COUNT(*) FROM watch_events GROUP BY user_id;
SELECT video_id, AVG(watched_seconds) FROM watch_events GROUP BY video_id;
\timing off
EOF

# Expected: Queries complete in < 100ms
```

**Expected Result:** ✅ Queries complete quickly with good index usage

## Test Execution

### Automated Test Suite
```bash
# Run all tests
npm test -- --watchAll=false

# Run specific test suites
npm test -- --testPathPattern=database
npm test -- --testPathPattern=ingest
npm test -- --testPathPattern=watch-history
```

### Manual Test Checklist

- [ ] Database migrations execute without errors
- [ ] All new columns exist with correct types
- [ ] All indexes created successfully
- [ ] Ingest script successfully transcodes to HLS
- [ ] Master playlist contains 3 variants (720p/480p/360p)
- [ ] Thumbnails generated in all sizes
- [ ] S3 upload completes successfully
- [ ] HLS streams playable in browser
- [ ] Watch events recorded correctly
- [ ] Owner verification workflow functions
- [ ] Moderation flags can be set and queried
- [ ] Performance is acceptable under load

## Cleanup

```bash
# Drop test database
dropdb blazetv_test

# Delete test S3 bucket
aws s3 rm s3://$AWS_S3_BUCKET --recursive
aws s3 rb s3://$AWS_S3_BUCKET
```

## Continuous Integration

These tests should be integrated into the CI/CD pipeline:

```yaml
# .github/workflows/blazetv-e2e.yml
name: BlazeTV E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_DB: blazetv_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - name: Run E2E Tests
        run: |
          # Run migration tests
          # Run ingest script validation
          # Run integration tests
```

## Success Criteria

All tests must pass with:
- ✅ 100% migration success rate
- ✅ HLS streams playable across all variants
- ✅ All thumbnails generated correctly
- ✅ Watch events recorded accurately
- ✅ Query performance < 100ms for typical queries
- ✅ Zero data integrity errors
