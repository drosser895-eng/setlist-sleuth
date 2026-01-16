# BlazeTV Production Readiness Features

This document describes the BlazeTV production features including adaptive HLS streaming, owner verification, and watch history tracking.

## Features

### 1. Adaptive HLS Streaming

BlazeTV now supports adaptive bitrate streaming using HTTP Live Streaming (HLS) protocol.

**Benefits:**
- Automatic quality adjustment based on bandwidth
- Smooth playback experience across devices
- Reduced buffering and improved user experience

**Supported Resolutions:**
- 720p @ 2800 kbps (high quality)
- 480p @ 1400 kbps (medium quality)
- 360p @ 800 kbps (low quality)

**Browser Compatibility:**
- Safari (native HLS support)
- Chrome, Firefox, Edge (via hls.js)
- Mobile browsers (iOS Safari, Chrome Mobile)

### 2. Owner Verification System

Content creators can verify ownership of their videos to build trust and enable moderation.

**Features:**
- Owner verification status tracking
- Channel ID linking for cross-platform verification
- Proof URL storage for audit trails
- Provenance metadata for content history
- Moderation flags for content safety

**Use Cases:**
- Verify public domain content sources
- Track content upload chain
- Enable creator badges
- Content moderation workflows

### 3. Watch History & Analytics

Track user engagement and viewing patterns for personalization and analytics.

**Features:**
- Watch event recording (start, pause, resume, complete)
- Watch time tracking
- Device and quality metrics
- User watch history
- Video analytics

**Analytics Queries:**
- Most watched videos
- Average watch time per video
- Completion rates
- User engagement metrics
- Device breakdown

## Database Schema

### Videos Table Enhancements

```sql
-- Owner verification columns
owner_verified BOOLEAN DEFAULT false
owner_channel_id VARCHAR(255)
ownership_proof_url TEXT
provenance JSONB DEFAULT '{}'::jsonb
moderation_flags JSONB DEFAULT '[]'::jsonb

-- HLS streaming columns
hls_master_url TEXT
thumbnails JSONB
source_type VARCHAR(32)
license TEXT
```

### Watch Events Table

```sql
CREATE TABLE watch_events (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    video_id INTEGER NOT NULL,
    watched_seconds INTEGER NOT NULL DEFAULT 0,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    event JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Content Ingestion

### Ingest Script Usage

```bash
# Set environment variables
export AWS_S3_BUCKET=your-bucket-name
export AWS_REGION=us-east-1

# Run ingest script
./scripts/ingest_public_domain_to_s3.sh \
  "prelinger/AirportSe1946" \
  "Airport Security (1946)" \
  "Prelinger Archives" \
  1946
```

### Output Structure

```
s3://bucket/videos/{video_id}/
├── hls/
│   ├── master.m3u8              # Master playlist
│   ├── stream_0/                # 720p stream
│   │   ├── playlist.m3u8
│   │   └── segment_*.ts
│   ├── stream_1/                # 480p stream
│   │   ├── playlist.m3u8
│   │   └── segment_*.ts
│   └── stream_2/                # 360p stream
│       ├── playlist.m3u8
│       └── segment_*.ts
├── thumbnails/
│   ├── thumb_small.jpg          # 360x202
│   ├── thumb_medium.jpg         # 640x360
│   ├── thumb_large.jpg          # 1280x720
│   └── thumb_lqip.jpg           # 64x36 blurred
└── metadata.json                # Video metadata
```

## API Integration Examples

### Recording Watch Events

```javascript
// Example using node-postgres (pg)
import { Pool } from 'pg';

const db = new Pool({ connectionString: process.env.DATABASE_URL });

// Record a watch event
const watchEvent = {
  user_id: 'user123',
  video_id: 42,
  watched_seconds: 150,
  duration_seconds: 300,
  event: {
    device: 'mobile',
    quality: '720p',
    completed: false
  }
};

await db.query(
  'INSERT INTO watch_events (user_id, video_id, watched_seconds, duration_seconds, event) VALUES ($1, $2, $3, $4, $5)',
  [watchEvent.user_id, watchEvent.video_id, watchEvent.watched_seconds, watchEvent.duration_seconds, watchEvent.event]
);
```

### Querying Watch History

```javascript
// Get user's watch history
const history = await db.query(
  'SELECT * FROM watch_events WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
  ['user123']
);

// Get video analytics
const analytics = await db.query(
  `SELECT 
    video_id,
    COUNT(*) as view_count,
    AVG(watched_seconds) as avg_watch_time,
    SUM(CASE WHEN watched_seconds >= duration_seconds THEN 1 ELSE 0 END) as completions
  FROM watch_events
  GROUP BY video_id
  ORDER BY view_count DESC`
);
```

### Owner Verification

```javascript
// Verify content owner
await db.query(
  `UPDATE videos SET 
    owner_verified = true,
    owner_channel_id = $1,
    ownership_proof_url = $2,
    provenance = $3,
    moderation_flags = $4
  WHERE id = $5`,
  [
    'UC_CHANNEL_123',
    'https://verify.example.com/proof.pdf',
    JSON.stringify({ verified_at: new Date(), verified_by: 'admin@example.com' }),
    JSON.stringify(['verified', 'safe_content']),
    videoId
  ]
);
```

## HLS Player Integration

### Using hls.js (for non-Safari browsers)

```html
<video id="video" controls></video>

<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
<script>
  const video = document.getElementById('video');
  const videoSrc = 'https://bucket.s3.region.amazonaws.com/videos/{id}/hls/master.m3u8';

  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(videoSrc);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, function() {
      video.play();
    });
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    // Native HLS support (Safari)
    video.src = videoSrc;
    video.addEventListener('loadedmetadata', function() {
      video.play();
    });
  }
</script>
```

### React Component Example

```jsx
import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

function VideoPlayer({ videoUrl, onWatchEvent }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(videoUrl);
      hls.attachMedia(video);
      hlsRef.current = hls;

      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoUrl;
    }
  }, [videoUrl]);

  const handleTimeUpdate = (e) => {
    const currentTime = Math.floor(e.target.currentTime);
    const duration = Math.floor(e.target.duration);
    
    // Record watch event every 10 seconds
    if (currentTime % 10 === 0) {
      onWatchEvent({
        watched_seconds: currentTime,
        duration_seconds: duration,
        quality: hlsRef.current?.currentLevel || 'auto'
      });
    }
  };

  return (
    <video
      ref={videoRef}
      controls
      onTimeUpdate={handleTimeUpdate}
      style={{ width: '100%', maxWidth: '1280px' }}
    />
  );
}
```

## Performance Optimization

### CDN Integration

For optimal performance, use CloudFront or another CDN:

```bash
# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name $AWS_S3_BUCKET.s3.$AWS_REGION.amazonaws.com \
  --default-cache-behavior "ViewerProtocolPolicy=redirect-to-https,AllowedMethods=GET,HEAD,Compress=true"
```

### Database Indexing

The migrations create the following indexes for optimal query performance:

```sql
-- Videos table indexes
idx_videos_owner_verified
idx_videos_moderation_flags (GIN)
idx_videos_hls_master_url
idx_videos_source_type

-- Watch events indexes
idx_watch_events_user_id
idx_watch_events_video_id
idx_watch_events_user_video
idx_watch_events_created_at
idx_watch_events_event (GIN)
```

## Monitoring

### Key Metrics

1. **Streaming Performance**
   - Segment request latency
   - Error rates (404, 403)
   - Bandwidth consumption
   - Concurrent viewers

2. **Watch Events**
   - Events per second
   - Table size growth
   - Query performance
   - Top videos by views

3. **Content Verification**
   - Verification rate
   - Moderation queue size
   - Flagged content count

### CloudWatch Metrics

```bash
# Monitor S3 bucket metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/S3 \
  --metric-name NumberOfObjects \
  --dimensions Name=BucketName,Value=$AWS_S3_BUCKET \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

## Security

### S3 Bucket Security

```bash
# Enable bucket encryption
aws s3api put-bucket-encryption \
  --bucket $AWS_S3_BUCKET \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Enable versioning for data protection
aws s3api put-bucket-versioning \
  --bucket $AWS_S3_BUCKET \
  --versioning-configuration Status=Enabled
```

### Access Control

- HLS segments and playlists: Public read
- Thumbnails: Public read
- Metadata: Public read
- Upload permissions: Restricted to authorized users/services

## Troubleshooting

### Common Issues

**Issue: HLS not playing in browser**
- Check CORS configuration on S3
- Verify Content-Type headers (application/vnd.apple.mpegurl)
- Ensure bucket policy allows public read

**Issue: Poor video quality**
- Check bitrate ladder configuration
- Verify FFmpeg encoding settings
- Monitor bandwidth availability

**Issue: Slow watch events queries**
- Check index usage with EXPLAIN ANALYZE
- Consider partitioning watch_events table by date
- Archive old events to separate table

## Documentation

- [Deployment Runbook](./BLAZETV_DEPLOYMENT_RUNBOOK.md)
- [E2E Testing Guide](./BLAZETV_E2E_TESTING.md)
- [Pull Request Template](../PULL_REQUEST_TEMPLATE.md)

## Support

For issues or questions:
- Database: DBA team
- AWS/S3: Cloud infrastructure team
- Streaming: Video engineering team
- General: #blazetv-dev channel
