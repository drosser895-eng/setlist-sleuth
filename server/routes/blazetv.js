const express = require('express');
const router = express.Router();
// const pool = require('../db/pool');

/**
 * GET /api/blazetv/feed
 * Paginated discovery feed with search.
 */
router.get('/feed', async (req, res) => {
  const { channelId, search, offset = 0, limit = 12 } = req.query;

  try {
    /*
    let query = 'SELECT * FROM videos WHERE 1=1';
    let params = [limit, offset];
    if (channelId) {
      query += ' AND channel_id = $3';
      params.push(channelId);
    }
    if (search) {
      query += ' AND (title ILIKE $4 OR description ILIKE $4)';
      params.push(`%${search}%`);
    }
    query += ' ORDER BY created_at DESC LIMIT $1 OFFSET $2';
    const result = await pool.query(query, params);
    res.json(result.rows);
    */

    // Mock data
    res.json([
      {
        id: 1,
        external_id: 'sample-1',
        title: 'Premium Discovery Clip',
        thumbnail_url: 'https://via.placeholder.com/320x180',
        channel_name: 'Blaze Official',
        hls_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
      }
    ]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

/**
 * GET /api/blazetv/video/:id
 */
router.get('/video/:id', async (req, res) => {
  const { id } = req.params;
  try {
    /*
    const result = await pool.query('SELECT * FROM videos WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Video not found' });
    res.json(result.rows[0]);
    */

    res.json({
      id,
      title: 'Premium Discovery Clip',
      description: 'Explore the best of public domain content in high quality adaptive resolution.',
      channel_name: 'Blaze Official',
      hls_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      owner_verified: true
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch video' });
  }
});

module.exports = router;