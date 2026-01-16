-- migrations/20260126_add_owner_verification.sql
-- Adds owner verification columns to videos table for content moderation and provenance tracking.

-- Add owner verification columns
ALTER TABLE videos ADD COLUMN IF NOT EXISTS owner_verified BOOLEAN DEFAULT false;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS owner_channel_id VARCHAR(255);
ALTER TABLE videos ADD COLUMN IF NOT EXISTS ownership_proof_url TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS provenance JSONB DEFAULT '{}'::jsonb;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS moderation_flags JSONB DEFAULT '[]'::jsonb;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_videos_owner_verified ON videos(owner_verified);
CREATE INDEX IF NOT EXISTS idx_videos_owner_channel_id ON videos(owner_channel_id);

-- Example usage:
-- UPDATE videos SET owner_verified = true, owner_channel_id = 'UC1234567890', ownership_proof_url = 'https://example.com/proof.pdf', provenance = '{"source": "direct_upload", "verified_at": "2026-01-26T00:00:00Z"}' WHERE id = '<video-uuid>';
