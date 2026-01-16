# BlazeTV Production Deployment Runbook

## Overview
This runbook provides step-by-step instructions for deploying BlazeTV production readiness enhancements, including adaptive HLS streaming, owner verification, and watch history tracking.

## Prerequisites

### Infrastructure Requirements
- PostgreSQL database (version 12+)
- AWS S3 bucket for video storage
- AWS CLI configured with appropriate credentials
- FFmpeg installed with HLS support (version 4.3+)
- Node.js environment (version 18+)

### Environment Variables
```bash
AWS_S3_BUCKET=your-blazetv-bucket
AWS_REGION=us-east-1
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

## Deployment Steps

### Phase 1: Database Migrations

**Step 1: Backup Database**
```bash
# Create a backup before running migrations
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

**Step 2: Run Migrations in Order**
```bash
# Run migrations in chronological order
psql $DATABASE_URL < migrations/20260126_add_owner_verification.sql
psql $DATABASE_URL < migrations/20260126_update_videos_hls.sql
psql $DATABASE_URL < migrations/20260127_create_watch_events.sql
```

**Step 3: Verify Migrations**
```bash
# Verify tables and columns exist
psql $DATABASE_URL -c "\d videos"
psql $DATABASE_URL -c "\d watch_events"

# Expected output should include new columns:
# - owner_verified, owner_channel_id, ownership_proof_url, provenance, moderation_flags
# - hls_master_url, thumbnails, source_type, license
```

### Phase 2: S3 Bucket Configuration

**Step 1: Create S3 Bucket (if not exists)**
```bash
aws s3 mb s3://$AWS_S3_BUCKET --region $AWS_REGION
```

**Step 2: Configure CORS for Streaming**
```bash
cat > cors.json <<EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

aws s3api put-bucket-cors --bucket $AWS_S3_BUCKET --cors-configuration file://cors.json
```

**Step 3: Configure Bucket Policy for Public Read**
```bash
cat > bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$AWS_S3_BUCKET/videos/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy --bucket $AWS_S3_BUCKET --policy file://bucket-policy.json
```

### Phase 3: Content Ingestion

**Step 1: Test Ingest Script**
```bash
# Test with a sample public domain video
export AWS_S3_BUCKET=your-bucket-name
export AWS_REGION=us-east-1

./scripts/ingest_public_domain_to_s3.sh \
  "prelinger/AirportSe1946" \
  "Airport Security (1946)" \
  "Prelinger Archives" \
  1946
```

**Step 2: Verify HLS Output**
```bash
# List uploaded files
aws s3 ls s3://$AWS_S3_BUCKET/videos/prelinger_AirportSe1946/ --recursive

# Expected structure:
# hls/master.m3u8
# hls/stream_0/playlist.m3u8
# hls/stream_0/segment_*.ts
# hls/stream_1/playlist.m3u8
# hls/stream_1/segment_*.ts
# hls/stream_2/playlist.m3u8
# hls/stream_2/segment_*.ts
# thumbnails/thumb_small.jpg
# thumbnails/thumb_medium.jpg
# thumbnails/thumb_large.jpg
# thumbnails/thumb_lqip.jpg
# metadata.json
```

**Step 3: Test HLS Playback**
```bash
# Get master playlist URL
MASTER_URL="https://$AWS_S3_BUCKET.s3.$AWS_REGION.amazonaws.com/videos/prelinger_AirportSe1946/hls/master.m3u8"

# Test with ffprobe
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$MASTER_URL"

# Or test in browser with a simple HTML5 video player
```

### Phase 4: Application Deployment

**Step 1: Build Application**
```bash
npm install
npm run build
```

**Step 2: Run Tests**
```bash
npm test -- --watchAll=false
```

**Step 3: Deploy to Production**
```bash
# Deploy static assets
npm run deploy

# Or deploy to your hosting platform
# (Netlify, Vercel, AWS S3+CloudFront, etc.)
```

### Phase 5: Verification

**Step 1: Database Health Check**
```bash
# Verify indexes are created
psql $DATABASE_URL -c "\di" | grep -E "idx_videos|idx_watch_events"

# Check table row counts
psql $DATABASE_URL -c "SELECT 'videos' as table, COUNT(*) FROM videos UNION ALL SELECT 'watch_events', COUNT(*) FROM watch_events;"
```

**Step 2: Application Health Check**
```bash
# Check application is accessible
curl -I https://your-blazetv-domain.com

# Verify API endpoints (if applicable)
# curl https://your-blazetv-domain.com/api/videos
# curl https://your-blazetv-domain.com/api/watch-history
```

**Step 3: Streaming Health Check**
```bash
# Test HLS streaming
curl -I "https://$AWS_S3_BUCKET.s3.$AWS_REGION.amazonaws.com/videos/sample-video/hls/master.m3u8"

# Verify CORS headers
curl -H "Origin: https://your-domain.com" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS \
  "https://$AWS_S3_BUCKET.s3.$AWS_REGION.amazonaws.com/videos/sample-video/hls/master.m3u8"
```

## Rollback Procedures

### Database Rollback
```bash
# If migrations need to be rolled back
psql $DATABASE_URL <<EOF
-- Rollback 20260127_create_watch_events.sql
DROP TABLE IF EXISTS watch_events CASCADE;

-- Rollback 20260126_update_videos_hls.sql
ALTER TABLE videos DROP COLUMN IF EXISTS hls_master_url;
ALTER TABLE videos DROP COLUMN IF EXISTS thumbnails;
ALTER TABLE videos DROP COLUMN IF EXISTS source_type;
ALTER TABLE videos DROP COLUMN IF EXISTS license;

-- Rollback 20260126_add_owner_verification.sql
ALTER TABLE videos DROP COLUMN IF EXISTS owner_verified;
ALTER TABLE videos DROP COLUMN IF EXISTS owner_channel_id;
ALTER TABLE videos DROP COLUMN IF EXISTS ownership_proof_url;
ALTER TABLE videos DROP COLUMN IF EXISTS provenance;
ALTER TABLE videos DROP COLUMN IF EXISTS moderation_flags;
EOF
```

### Application Rollback
```bash
# Revert to previous deployment
git revert <commit-hash>
npm run build
npm run deploy
```

## Monitoring

### Key Metrics to Monitor
1. **Database Performance**
   - Query execution times for watch_events table
   - Index usage statistics
   - Table size growth

2. **S3 Storage**
   - Bucket size and object count
   - Bandwidth usage
   - Request metrics

3. **Video Streaming**
   - HLS segment request rates
   - Error rates (404s, 403s)
   - Bandwidth consumption

### Monitoring Queries
```sql
-- Watch events statistics
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as events,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT video_id) as unique_videos
FROM watch_events
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC
LIMIT 30;

-- Top watched videos
SELECT 
  v.id,
  v.title,
  COUNT(we.id) as view_count,
  AVG(we.watched_seconds) as avg_watch_time
FROM videos v
LEFT JOIN watch_events we ON v.id = we.video_id
GROUP BY v.id, v.title
ORDER BY view_count DESC
LIMIT 10;
```

## Troubleshooting

### Issue: FFmpeg HLS transcoding fails
**Solution:**
```bash
# Verify FFmpeg version and codecs
ffmpeg -version
ffmpeg -codecs | grep -E "h264|aac"

# If codecs missing, reinstall FFmpeg with proper support
# Ubuntu/Debian: apt-get install ffmpeg
# macOS: brew install ffmpeg
```

### Issue: S3 upload fails with permissions error
**Solution:**
```bash
# Verify AWS credentials
aws sts get-caller-identity

# Check bucket permissions
aws s3api get-bucket-policy --bucket $AWS_S3_BUCKET

# Verify IAM user/role has PutObject permission
```

### Issue: HLS playback not working in browser
**Solution:**
1. Check CORS configuration on S3 bucket
2. Verify bucket policy allows public read
3. Test with browser developer console for specific errors
4. Ensure Content-Type headers are correct (application/vnd.apple.mpegurl)

## Support Contacts

- **Database Issues**: DBA team
- **AWS/S3 Issues**: Cloud infrastructure team
- **Application Issues**: Development team
- **Emergency Rollback**: On-call engineer

## Post-Deployment Checklist

- [ ] All migrations executed successfully
- [ ] S3 bucket configured with CORS and bucket policy
- [ ] Sample video ingested and HLS streaming verified
- [ ] Application deployed and accessible
- [ ] Database indexes created and performant
- [ ] Monitoring dashboards updated
- [ ] Team notified of deployment
- [ ] Documentation updated
- [ ] Rollback procedures verified
