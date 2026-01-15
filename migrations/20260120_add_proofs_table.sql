-- migrations/20260120_add_proofs_table.sql
-- Adds proofs table to store finalized Merkle proof bundles and anchor transaction metadata.

CREATE TABLE IF NOT EXISTS proofs (
    id SERIAL PRIMARY KEY,
    match_id VARCHAR(255) NOT NULL,
    merkle_root VARCHAR(66) NOT NULL,
    proof_bundle JSONB NOT NULL,
    anchor_tx VARCHAR(66),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_proofs_match_id ON proofs(match_id);
CREATE INDEX IF NOT EXISTS idx_proofs_merkle_root ON proofs(merkle_root);
