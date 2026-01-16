-- migrations/20260126_add_owner_verification.sql
ALTER TABLE videos
  ADD COLUMN IF NOT EXISTS owner_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS owner_channel_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS ownership_proof_url TEXT,
  ADD COLUMN IF NOT EXISTS provenance JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS moderation_flags JSONB DEFAULT '[]'::jsonb;
