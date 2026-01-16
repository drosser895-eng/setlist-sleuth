-- migrations/20260126_update_videos_hls.sql
-- Adds HLS streaming support and enhanced metadata to videos table.

-- Add HLS and metadata columns
ALTER TABLE videos ADD COLUMN IF NOT EXISTS hls_master_url TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS thumbnails JSONB;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS source_type VARCHAR(32);
ALTER TABLE videos ADD COLUMN IF NOT EXISTS license TEXT;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_videos_source_type ON videos(source_type);
CREATE INDEX IF NOT EXISTS idx_videos_license ON videos(license);

-- Example usage:
-- UPDATE videos SET 
--   hls_master_url = 'https://s3.amazonaws.com/bucket/videos/video123/master.m3u8',
--   thumbnails = '{"small": "thumb_small.jpg", "medium": "thumb_medium.jpg", "large": "thumb_large.jpg", "lqip": "thumb_lqip.jpg"}',
--   source_type = 'public_domain',
--   license = 'CC0 1.0 Universal'
-- WHERE id = '<video-uuid>';
