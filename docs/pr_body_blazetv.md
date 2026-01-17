### Summary
This PR delivers the full revenue-first launch infrastructure for Blaze Mix Master.

### 📦 Key Features
- **Artist Payment Links**: `PaymentLinks.jsx` enables artists to receive tips directly via PayPal, Ko-fi, etc.
- **BlazeTV Discovery**: Adaptive HLS streaming and discovery feed.
- **Safety**: `RealMoneyBanner` for testnet-only awareness in staging.
- **Admin**: Programmatic owner verification for YouTube content.

### ✅ Reviewer Checklist
- [ ] Confirmed migrations apply cleanly.
- [ ] No secrets present in diff.
- [ ] HLS playback verified without overlays.
- [ ] /cashout gating logic confirmed.
