-- migrations/20260126_update_videos_hls.sql
-- Adds HLS streaming and enhanced metadata columns to videos table
-- Enables adaptive bitrate streaming for BlazeTV

-- Add HLS master playlist URL for adaptive streaming
ALTER TABLE videos ADD COLUMN IF NOT EXISTS hls_master_url TEXT;

-- Add thumbnails in multiple resolutions (stores URLs for small/medium/large/lqip)
ALTER TABLE videos ADD COLUMN IF NOT EXISTS thumbnails JSONB;

-- Add source type to track content origin
ALTER TABLE videos ADD COLUMN IF NOT EXISTS source_type VARCHAR(50);

-- Add license information for legal compliance
ALTER TABLE videos ADD COLUMN IF NOT EXISTS license TEXT;

-- Create index for HLS content lookup
CREATE INDEX IF NOT EXISTS idx_videos_hls_master_url ON videos(hls_master_url) WHERE hls_master_url IS NOT NULL;

-- Create index for source type filtering
CREATE INDEX IF NOT EXISTS idx_videos_source_type ON videos(source_type);

-- Example usage:
-- UPDATE videos SET hls_master_url = 'https://cdn.example.com/videos/123/master.m3u8' WHERE id = 1;
-- UPDATE videos SET thumbnails = '{"small":"thumb_360.jpg","medium":"thumb_720.jpg","large":"thumb_1080.jpg","lqip":"thumb_blur.jpg"}' WHERE id = 1;
-- UPDATE videos SET source_type = 'internet_archive', license = 'Public Domain' WHERE id = 1;
