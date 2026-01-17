-- Add HLS master URL and quality variants JSON
ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS hls_master_url TEXT,
ADD COLUMN IF NOT EXISTS quality_variants JSONB DEFAULT '[]'::jsonb;
