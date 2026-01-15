# feat: add artist payment links, public content ingest, and crowdfunding materials

## Summary
This PR introduces features and operational materials to enable a revenue-first pilot for Blaze TV (Setlist Sleuth):

- `components/PaymentLinks.jsx` — UI to render artist tip/payment links (PayPal, Ko‑fi, Patreon, CashApp, Venmo).
- `components/RealMoneyBanner.jsx` — shows that real-money features are disabled (REACT_APP_REAL_MONEY_ENABLED=false).
- `server/routes/profilePayments.js` — endpoints to set and get artist payment links.
- `server/middleware/geoblock.js` — safety middleware that blocks cashouts when REAL_MONEY_ENABLED=false and blocks specific countries (Indonesia) from cashouts.
- `server/routes/cashout.js` — example cashout route with KYC gating placeholder.
- `migrations/20260115_add_payment_links.sql` — DB migration to add payment_links jsonb column.
- `scripts/ingest_public_domain.sh` — helper to import public domain videos from Internet Archive.
- `content/playlist.example.json` — example playlist entries to seed Blaze TV content.
- `ARTIST_OUTREACH.md`, `CROWDFUND_CAMPAIGN.md`, `INVESTOR_ONE_PAGER.md` — operational materials.
- `.vscode/tasks.json` — helpful dev tasks.

## Safety Notes
- No secrets or API keys included.
- Deploy to staging with `REAL_MONEY_ENABLED=false` and run smoke tests before enabling anything related to payouts.
- Geoblock middleware prevents cashouts globally and specifically from Indonesia until legal clearance.
- KYC gating placeholder included for future compliance implementation.

## Testing
Run smoke tests locally (see PR comments for detailed steps):
```bash
npm ci && npm run dev
curl -X POST http://localhost:3000/cashout ... # should return 403 (disabled)
curl -X POST http://localhost:3000/me/payment-links ... # should save links
```

## Deployment
1. Merge to main
2. Deploy to staging with `REAL_MONEY_ENABLED=false`
3. Run smoke tests
4. Proceed with confidence that cashout routes are gated
