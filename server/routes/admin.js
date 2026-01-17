const express = require('express');
const router = express.Router();
// const pool = require('../db/pool');

/**
 * POST /api/admin/videos/:id/verify-owner
 * Manually verify a video's owner.
 */
router.post('/videos/:id/verify-owner', async (req, res) => {
    const { id } = req.params;
    const { owner_channel_id, proof_url } = req.body;

    try {
        /*
        await pool.query(
          'UPDATE videos SET owner_verified = true, owner_channel_id = $1, ownership_proof_url = $2, moderation_flags = "[]"::jsonb WHERE id = $3',
          [owner_channel_id, proof_url, id]
        );
        */
        res.json({ success: true, message: `Video ${id} verified for channel ${owner_channel_id}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to verify owner' });
    }
});

/**
 * POST /api/admin/videos/:id/flag
 */
router.post('/videos/:id/flag', async (req, res) => {
    const { id } = req.params;
    const { flag } = req.body;
    // Logic to add flag to moderation_flags JSONB
    res.json({ success: true, flagged: flag });
});

module.exports = router;
