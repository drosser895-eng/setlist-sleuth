-- migrations/20260126_add_owner_verification.sql
-- Adds owner verification and content moderation columns to videos table
-- Required for BlazeTV production readiness

-- Add owner verification columns
ALTER TABLE videos ADD COLUMN IF NOT EXISTS owner_verified BOOLEAN DEFAULT false;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS owner_channel_id VARCHAR(255);
ALTER TABLE videos ADD COLUMN IF NOT EXISTS ownership_proof_url TEXT;

-- Add provenance tracking (stores metadata about content origin, upload chain, etc.)
ALTER TABLE videos ADD COLUMN IF NOT EXISTS provenance JSONB DEFAULT '{}'::jsonb;

-- Add moderation flags (stores array of moderation issues/flags)
ALTER TABLE videos ADD COLUMN IF NOT EXISTS moderation_flags JSONB DEFAULT '[]'::jsonb;

-- Create index for quick lookup of verified content
CREATE INDEX IF NOT EXISTS idx_videos_owner_verified ON videos(owner_verified);

-- Create index for filtering by moderation status
CREATE INDEX IF NOT EXISTS idx_videos_moderation_flags ON videos USING GIN(moderation_flags);

-- Example usage:
-- UPDATE videos SET owner_verified = true, owner_channel_id = 'UC123456', ownership_proof_url = 'https://example.com/proof.pdf' WHERE id = 1;
-- UPDATE videos SET provenance = '{"uploader":"user123","source":"youtube","verified_at":"2026-01-26T10:00:00Z"}' WHERE id = 1;
-- UPDATE videos SET moderation_flags = '["reviewed","safe_content"]' WHERE id = 1;
