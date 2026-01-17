-- migrations/20260126_add_owner_verification_columns.sql
ALTER TABLE videos
  ADD COLUMN owner_verified BOOLEAN DEFAULT false,
  ADD COLUMN owner_channel_id VARCHAR(255),
  ADD COLUMN ownership_proof_url TEXT,
  ADD COLUMN provenance JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN moderation_flags JSONB DEFAULT '[]'::jsonb;
