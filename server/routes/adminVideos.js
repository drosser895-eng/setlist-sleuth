/**
 * server/routes/adminVideos.js
 * Admin endpoints for video moderation and ownership verification.
 */
const express = require('express');
const router = express.Router();

// Mock middleware
const requireAuthAdmin = (req, res, next) => next();

router.post('/:id/verify-owner', requireAuthAdmin, async (req, res) => {
  const { owner_channel_id, proof_url } = req.body;
  const id = parseInt(req.params.id, 10);
  
  console.log(`[Admin] Verifying video ${id} for channel ${owner_channel_id}`);
  
  // db.query('UPDATE videos ...')
  
  res.json({ ok: true, verified: true });
});

module.exports = router;
