// server/middleware/geoblock.js
// Middleware to block cashout endpoints when REAL_MONEY_ENABLED=false
// and to block cashouts from configured blocked countries (e.g., Indonesia).

const blockedCountries = new Set(['ID']); // ISO country codes to block until cleared
const cashoutPaths = ['/cashout', '/api/cashout', '/payouts'];

function lookupCountryFromRequest(req) {
  // In production, implement a reliable geo-IP lookup (MaxMind, Cloudflare header).
  // For staging or local testing, allow overriding via X-Country header (not for prod).
  if (req.headers['x-country']) return req.headers['x-country'].toUpperCase();
  return null;
}

module.exports = function geoblock(req, res, next) {
  const REAL_MONEY_ENABLED = (process.env.REAL_MONEY_ENABLED || 'false') === 'true';
  const path = req.path || req.url || '';
  const isCashoutEndpoint = cashoutPaths.some(p => path.startsWith(p));

  if (!REAL_MONEY_ENABLED && isCashoutEndpoint) {
    return res.status(403).json({ error: 'Cashouts are temporarily disabled.' });
  }

  if (isCashoutEndpoint) {
    const country = lookupCountryFromRequest(req);
    if (country && blockedCountries.has(country)) {
      return res.status(403).json({ error: 'Cashouts are not available from your location.' });
    }
  }

  next();
};
