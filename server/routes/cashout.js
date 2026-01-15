// server/routes/cashout.js
// Example Express route implementing KYC gating and using the geoblock middleware.
// Adapt the auth and DB calls to your stack.

const express = require('express');
const router = express.Router();
const { requireAuth, getUserById, createWithdrawalRequest } = require('../auth'); // placeholders

router.post('/', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const user = await getUserById(userId);

  // KYC gating: require verified status before allowing cashout
  if (!user.kyc || user.kyc.status !== 'verified') {
    return res.status(403).json({ error: 'KYC verification required before requesting a cashout.' });
  }

  // Validate amount and balance (pseudo-code)
  const { amount } = req.body;
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  // TODO: check ledger balance for user, create pending withdrawal entry
  try {
    // createWithdrawalRequest should create a ledger entry and return request id
    const request = await createWithdrawalRequest(userId, amount);
    return res.status(200).json({ status: 'pending', requestId: request.id });
  } catch (err) {
    console.error('cashout error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
