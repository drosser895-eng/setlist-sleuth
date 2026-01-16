/**
 * server/routes/blazetv.js
 * Feed endpoints for BlazeTV.
 */
const express = require('express');
const router = express.Router();

// Mock database query
// const db = require('../db');

router.get('/feed', async (req, res) => {
  try {
    // const videos = await db.query('SELECT * FROM videos ORDER BY created_at DESC LIMIT 20');
    // res.json(videos.rows);
    res.json([]); // Empty for now until DB is populated
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;