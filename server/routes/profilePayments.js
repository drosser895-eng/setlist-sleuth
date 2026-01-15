// server/routes/profilePayments.js
// Simple endpoints to update and retrieve payment links for authenticated artists.
// NOTE: adapt to your auth and DB layer.

const express = require('express');
const router = express.Router();
const { requireAuth, getDb } = require('../auth'); // adapt these helpers to your stack

router.get('/:artistId/payment-links', async (req, res) => {
  const artistId = req.params.artistId;
  const db = getDb(req);
  const row = await db.query('SELECT payment_links FROM users WHERE id=$1', [artistId]);
  if (!row.rows.length) return res.status(404).json({ error: 'Artist not found' });
  return res.json(row.rows[0].payment_links || {});
});

router.post('/me/payment-links', requireAuth, async (req, res) => {
  // auth middleware must populate req.user.id
  const userId = req.user.id;
  const { paymentLinks } = req.body;
  // Basic validation: only allow known keys
  const allowedKeys = ['paypal', 'kofi', 'patreon', 'cashapp', 'venmo', 'other'];
  const filtered = {};
  if (paymentLinks && typeof paymentLinks === 'object') {
    Object.keys(paymentLinks).forEach(k => {
      if (allowedKeys.includes(k) && paymentLinks[k]) filtered[k] = paymentLinks[k];
    });
  }
  const db = getDb(req);
  await db.query('UPDATE users SET payment_links = $1 WHERE id = $2', [filtered, userId]);
  res.json({ success: true, paymentLinks: filtered });
});

module.exports = router;
