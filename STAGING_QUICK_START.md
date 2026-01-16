# BlazeTV Staging Deployment Quick-Start

**Goal:** Deploy to staging, validate the platform works end-to-end, generate evidence proofs, and prepare for production.

**Time:** ~15-20 minutes (mostly automated)

**Status:** Ready to execute ✅

---

## Prerequisites

### 1. Access Requirements
- SSH access to staging host
- GitHub repo cloned: `https://github.com/drosser895-eng/setlist-sleuth.git`
- Main branch deployed

### 2. Environment Variables (Set on Staging Host)
```bash
# Required - set before running staging_execute.sh
export DATABASE_URL="postgres://user:pass@staging-db:5432/blazetv"
export AWS_S3_BUCKET="blazetv-staging-videos"
export AWS_ACCESS_KEY_ID="your-staging-key"
export AWS_SECRET_ACCESS_KEY="your-staging-secret"
export CDN_BASE_URL="https://cdn.staging.example.com/videos"
export SERVER_WEBHOOK_URL="https://staging.example.com/webhooks/antigravity"
export ANTIGRAVITY_WEBHOOK_SECRET="staging_webhook_secret"
export REACT_APP_SHOW_PLACEHOLDER_AD="false"
export REAL_MONEY_ENABLED="false"
export REACT_APP_REAL_MONEY_ENABLED="false"
```

### 3. Tools Required
- `bash`, `psql` (PostgreSQL client)
- `aws` (AWS CLI)
- `ffmpeg` (for video processing)
- `zip` (for evidence bundling)
- `npm` (for frontend build)

---

## Deployment Steps

### Step 1: Prepare Staging Host

```bash
# SSH into staging host
ssh ubuntu@staging.example.com

# Navigate to repo
cd /opt/blazetv
git fetch origin && git checkout main && git pull origin main

# Verify scripts exist
ls -la scripts/staging_execute.sh scripts/validate_staging_attestation.sh
```

### Step 2: Set Environment Variables

```bash
# Option A: Via shell session
export DATABASE_URL="postgres://..."
export AWS_S3_BUCKET="..."
export AWS_ACCESS_KEY_ID="..."
export AWS_SECRET_ACCESS_KEY="..."
export CDN_BASE_URL="..."
export SERVER_WEBHOOK_URL="..."
export ANTIGRAVITY_WEBHOOK_SECRET="..."
export REACT_APP_SHOW_PLACEHOLDER_AD="false"
export REAL_MONEY_ENABLED="false"
export REACT_APP_REAL_MONEY_ENABLED="false"

# Option B: Via .env file (create in repo root)
cat > .env.staging << 'EOF'
DATABASE_URL=postgres://...
AWS_S3_BUCKET=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
CDN_BASE_URL=...
SERVER_WEBHOOK_URL=...
ANTIGRAVITY_WEBHOOK_SECRET=...
REACT_APP_SHOW_PLACEHOLDER_AD=false
REAL_MONEY_ENABLED=false
REACT_APP_REAL_MONEY_ENABLED=false
EOF

# Then source before running
source .env.staging
```

### Step 3: Run Staging Deployment

```bash
# Make scripts executable
chmod +x scripts/staging_execute.sh scripts/validate_staging_attestation.sh

# Run deployment (this does everything automatically)
./scripts/staging_execute.sh
```

**What the script does:**
1. ✅ Validates all environment variables are set
2. ✅ Backs up current database
3. ✅ Applies all pending migrations
4. ✅ Rebuilds frontend (npm run build)
5. ✅ Restarts services (pm2/docker/systemd)
6. ✅ Seeds 3 sample public-domain videos
7. ✅ Runs evidence validator
8. ✅ Generates `evidence_*.zip` with full proofs

**Expected output:**
```
╔════════════════════════════════════════════════════════════════════════════╗
║                   BLAZETV STAGING DEPLOYMENT                              ║
║                         2026-01-16 15:30:00                               ║
╚════════════════════════════════════════════════════════════════════════════╝

[15:30:00] ▶ STEP 1: Verifying environment variables...
✅ Environment verified
   Database: postgres://...
   S3 Bucket: blazetv-staging-videos
   Webhook URL: https://staging.example.com/webhooks/antigravity

[15:30:05] ▶ STEP 2: Backing up database...
✅ Database backup created
   File: /tmp/blazetv_backup_20260116_153005.dump
   Size: 125MB

[15:30:30] ▶ STEP 3: Applying migrations...
✅ Migrations applied successfully
   Applied: 20260125_create_videos_table.sql
   Applied: 20260126_add_owner_verification.sql
   Applied: 20260127_create_watch_events.sql

[15:31:00] ▶ STEP 4: Building frontend...
✅ Frontend build successful
   Size: 4.2MB (gzipped)

[15:31:15] ▶ STEP 5: Restarting services...
✅ Services restarted
   App running on port 3001

[15:31:45] ▶ STEP 6: Seeding sample videos...
✅ Videos seeded (3 samples)

[15:32:00] ▶ STEP 7: Running evidence validator...
✅ Evidence validation complete
   Merkle proofs: Valid
   Webhook HMACs: Valid
   Blockchain anchor: Valid (txid: 0xabc123...)

[15:32:15] ▶ STEP 8: Creating evidence bundle...
✅ Evidence bundle created
   Archive: evidence_20260116_153215.zip
   Size: 42KB

╔════════════════════════════════════════════════════════════════════════════╗
║                     STAGING DEPLOYMENT COMPLETE ✅                        ║
╚════════════════════════════════════════════════════════════════════════════╝

📦 Evidence available: evidence_20260116_153215.zip
📋 Log file: /tmp/blazetv_staging_20260116_153215.log
🎉 Ready for validation and legal review!
```

---

## Step 4: Verify Deployment

```bash
# Test core endpoints
curl -s http://localhost:3001/api/feed | jq . | head -20
curl -s http://localhost:3001/api/search?q=test | jq .
curl -s http://localhost:3001/api/admin/creators | jq .

# Check database
psql "$DATABASE_URL" -c "SELECT count(*) FROM videos;"
psql "$DATABASE_URL" -c "SELECT count(*) FROM watch_events;"

# Verify videos in S3
aws s3 ls "s3://blazetv-staging-videos/videos/" --recursive | head -10
```

---

## Step 5: Upload Evidence to Issue #12

```bash
# Find the evidence zip
ls -lh evidence_*.zip

# Copy to your local machine for upload
scp ubuntu@staging.example.com:/opt/blazetv/evidence_*.zip ./

# Then upload to GitHub Issue #12
# Web UI: https://github.com/drosser895-eng/setlist-sleuth/issues/12
# Drag and drop the evidence_*.zip file into the issue
```

---

## Step 6: Notify for Legal Review

Once evidence is uploaded to Issue #12:

1. **Post in Issue:** "Evidence from staging deployment attached. Ready for validation and legal review."
2. **Send Counsel Email:** Use template from `COUNSEL_EMAIL_TEMPLATE.md`
3. **Reference:** Point to the evidence zip in Issue #12

---

## Troubleshooting

### Issue: psql command not found
```bash
# Install PostgreSQL client
brew install postgresql@16  # macOS
sudo apt install postgresql-client  # Ubuntu
```

### Issue: AWS credentials not valid
```bash
# Verify AWS config
aws sts get-caller-identity

# If needed, set credentials
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
export AWS_DEFAULT_REGION="us-east-1"
```

### Issue: Database connection timeout
```bash
# Test database connectivity
psql -h staging-db -U user -d blazetv -c "SELECT 1;"

# If timeout, verify security groups/firewall
# - staging-db port 5432 must be open to staging host
# - Check VPC security groups
```

### Issue: Services won't restart
```bash
# Check service status
pm2 status  # if using PM2
docker-compose ps  # if using Docker
systemctl status blazetv  # if using systemd

# Check logs
pm2 logs blazetv
docker-compose logs -f app
journalctl -u blazetv -f

# Restart manually if needed
pm2 restart all
docker-compose restart
systemctl restart blazetv
```

### Issue: Frontend build fails
```bash
# Clear cache and rebuild
rm -rf build/
npm ci  # clean install
npm run build

# Check for missing dependencies
npm list

# Check Node version
node --version  # should be v18+
```

---

## Expected Outcomes

After successful staging deployment:

✅ **Database:** All migrations applied, 3+ sample videos seeded  
✅ **Frontend:** Built and deployed, all routes responding  
✅ **APIs:** 23 endpoints validated and working  
✅ **Evidence:** Full proof bundle generated (`evidence_*.zip`)  
✅ **Logs:** Deployment and validation logs available  
✅ **Ready:** Platform validated, legal review can proceed  

---

## Timeline to Production

1. **Staging Deployment:** 15-20 min (NOW)
2. **Evidence Upload:** 5 min
3. **Validation:** 1-2 hours (automated)
4. **Legal Review:** 24-48 hours (counsel)
5. **Production Deployment:** 30 min (when approved)
6. **Go-Live:** Day 1-2

**Total: 48-72 hours to production** ✨

---

## Next Steps After Deployment

1. ✅ Run `./scripts/staging_execute.sh`
2. ✅ Verify endpoints respond
3. ✅ Copy `evidence_*.zip` to local machine
4. ✅ Upload to GitHub Issue #12
5. ✅ Post Issue URL here for validation
6. ⏳ Wait for legal approval
7. ⏳ Run production deployment

---

**Questions?** See `PRODUCTION_DEPLOYMENT_RUNBOOK.md` for detailed production steps or `LAUNCH_CHECKLIST.md` for Day-1 operations.
