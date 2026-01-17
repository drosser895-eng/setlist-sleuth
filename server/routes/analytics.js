const express = require('express');
const router = express.Router();
// const pool = require('../db/pool');

/**
 * POST /api/analytics/watch-event
 * Record a watch event (play, progress, complete).
 */
router.post('/watch-event', async (req, res) => {
    const { video_id, user_id, watched_seconds, duration_seconds, event_type, metadata } = req.body;

    try {
        /*
        await pool.query(
          'INSERT INTO watch_events (video_id, user_id, watched_seconds, duration_seconds, event_type, metadata) VALUES ($1, $2, $3, $4, $5, $6)',
          [video_id, user_id, watched_seconds, duration_seconds, event_type, metadata]
        );
        */
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to record event' });
    }
});

module.exports = router;
