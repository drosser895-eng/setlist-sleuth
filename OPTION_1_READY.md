# 🚀 OPTION 1: Deploy to Staging — EXECUTION GUIDE

**Status:** ✅ READY — All materials prepared, code committed, scripts tested

**Your Timeline:** 45 minutes (mostly automated)

---

## Quick Start

```bash
# On your staging host:
cd /path/to/app
git pull origin main
chmod +x ./scripts/staging_execute.sh

# Set environment variables (replace with your values):
export DATABASE_URL="postgres://..."
export AWS_S3_BUCKET="..."
# ... (see STAGING_DEPLOYMENT_RUNBOOK.md for full list)

# Run deployment (15-20 minutes):
./scripts/staging_execute.sh

# Download evidence:
scp ubuntu@staging.example.com:/path/to/app/evidence_*.zip ./

# Upload to GitHub Issue #12:
# Web: https://github.com/drosser895-eng/setlist-sleuth/issues/12
# Drag and drop evidence_*.zip

# Report back with Issue link
```

---

## Your Materials (All on Main)

### 📖 Documentation
- `STAGING_QUICK_START.md` — 15-min overview
- `STAGING_DEPLOYMENT_RUNBOOK.md` — Step-by-step guide
- `STAGING_DEPLOYMENT_CHECKLIST.txt` — Use during deployment

### 🔧 Scripts
- `scripts/staging_execute.sh` — Main deployment (fully automated)
- `scripts/validate_staging_attestation.sh` — Evidence validator

### 📦 Output
- `evidence_*.zip` — Generated automatically, upload to Issue #12

---

## What Happens

| Phase | Action | Duration | Your Role |
|-------|--------|----------|-----------|
| **1. Setup** | Clone repo, set env vars | ~10 min | Follow STAGING_DEPLOYMENT_RUNBOOK.md |
| **2. Deploy** | Run staging_execute.sh | ~15-20 min | Watch logs, all automated |
| **3. Verify** | Smoke tests, collect evidence | ~10 min | Run curl commands |
| **4. Upload** | Push evidence_*.zip to Issue #12 | ~5 min | Drag/drop or gh CLI |
| **5. Report** | Post Issue link here | ~2 min | Reply with status |
| **TOTAL** | | **~45 min** | |

Then I validate (1-2 hours) and generate final counsel email.

---

## Commands to Copy/Paste

### Staging Host

```bash
# Step 1: Navigate and update code
cd /opt/blazetv  # or your staging path
git fetch origin && git checkout main && git pull origin main
chmod +x ./scripts/staging_execute.sh

# Step 2: Set environment (replace with actual values - do NOT paste secrets here)
export DATABASE_URL="postgres://user:pass@host:5432/db"
export AWS_S3_BUCKET="your-bucket"
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
export CDN_BASE_URL="https://cdn.staging.example.com/videos"
export SERVER_WEBHOOK_URL="https://staging.example.com/webhooks/antigravity"
export ANTIGRAVITY_WEBHOOK_SECRET="webhook-secret"
export REACT_APP_SHOW_PLACEHOLDER_AD="false"
export REAL_MONEY_ENABLED="false"
export REACT_APP_REAL_MONEY_ENABLED="false"

# Step 3: Verify environment
psql "$DATABASE_URL" -c "SELECT 1;"
aws sts get-caller-identity
aws s3 ls s3://$AWS_S3_BUCKET/

# Step 4: Run deployment
./scripts/staging_execute.sh

# Step 5: Verify results
ls -lh evidence_*.zip
curl -s "https://staging.example.com/api/blazetv/feed" | jq .
```

### Local Machine

```bash
# Download evidence
scp ubuntu@staging.example.com:/opt/blazetv/evidence_*.zip ./

# Verify
ls -lh evidence_*.zip
unzip -t evidence_*.zip
```

---

## Upload to GitHub

1. Go to: https://github.com/drosser895-eng/setlist-sleuth/issues/12
2. Click **"Attach files"**
3. Drag and drop `evidence_*.zip`
4. Wait for upload
5. Copy the Issue URL

Or use GitHub CLI:
```bash
gh issue comment 12 --body "Staging deployment evidence ready" \
  --attachment evidence_*.zip
```

---

## Report Back Format

Reply with:

```
✅ Status: DEPLOYMENT SUCCESSFUL

📦 Evidence Bundle: [paste Issue URL here]

🎯 Smoke Tests:
  ✅ Feed endpoint responding
  ✅ Videos playing
  ✅ Creator badges showing
  ✅ Database seeded with videos

⚠️ Issues: None
```

---

## After You Upload

**Timeline:**
- You upload evidence_*.zip: Now
- I download & validate: ~1 hour
- I generate final counsel email: ~30 min
- You send to counsel: ~2 hours from now
- Counsel reviews: 24-48 hours
- Production deployment: When approved

**Total to live: 48-72 hours**

---

## What I'm Watching For

After you upload to Issue #12, I will:

1. ✅ Download and extract the evidence bundle
2. ✅ Validate harness logs are complete
3. ✅ Verify database→proof mapping
4. ✅ Recompute and validate merkle roots
5. ✅ Check blockchain anchor consistency
6. ✅ Generate Evidence README
7. ✅ Finalize Counsel/PSP email with real proof IDs
8. ✅ Post results in Issue #12

Then you'll have everything needed to send to counsel.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `psql: command not found` | `apt install postgresql-client` |
| DB connection timeout | Check security group, verify port 5432 open |
| `aws: command not found` | `apt install awscli` |
| `ffmpeg: command not found` | `apt install ffmpeg` |
| Script fails during migration | `tail -50 /tmp/blazetv_staging_*.log` |
| Services won't restart | `pm2 logs` or `docker-compose logs -f` |

---

## Ready?

You have everything. Execute on your staging host:

```bash
./scripts/staging_execute.sh
```

Then upload `evidence_*.zip` to Issue #12 and reply with the link.

I'll validate immediately and we'll be on track for production deployment. 🚀

---

**GitHub Repo:** https://github.com/drosser895-eng/setlist-sleuth  
**Main Branch:** 7da925dd0 (latest)  
**Status:** ✅ READY TO EXECUTE
