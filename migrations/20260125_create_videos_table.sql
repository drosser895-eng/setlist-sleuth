-- migrations/20260125_create_videos_table.sql
CREATE TABLE IF NOT EXISTS videos (
  id SERIAL PRIMARY KEY,
  external_id VARCHAR(255) UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  source_url TEXT,
  thumbnail_url TEXT,
  hls_url TEXT,
  channel_id VARCHAR(255),
  channel_name TEXT,
  public_domain BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);