#!/bin/bash
# ════════════════════════════════════════════════════════════════════════════════
# BLAZETV STAGING DEPLOYMENT — STEP-BY-STEP EXECUTION GUIDE
# ════════════════════════════════════════════════════════════════════════════════
#
# This script walks through the exact commands to run on your staging host.
# Copy and paste each section in order.
#
# Prerequisites:
#   • Staging host with network access to DB and S3
#   • PostgreSQL client (psql)
#   • AWS CLI configured
#   • ffmpeg installed
#   • npm/Node.js
#
# ════════════════════════════════════════════════════════════════════════════════

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║         BLAZETV STAGING DEPLOYMENT — STEP-BY-STEP GUIDE                   ║"
echo "║                                                                            ║"
echo "║  This script provides exact commands to run on your staging host.         ║"
echo "║  Copy each section and paste into your staging terminal.                 ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""

cat << 'EOF'

════════════════════════════════════════════════════════════════════════════════
STEP 1: Prepare Staging Host
════════════════════════════════════════════════════════════════════════════════

SSH into your staging host and run:

  ssh ubuntu@staging.example.com
  
Then ensure you have the required tools:

  which psql aws ffmpeg npm git

If any are missing, install them:

  # Ubuntu/Debian
  sudo apt update
  sudo apt install -y postgresql-client awscli ffmpeg npm

════════════════════════════════════════════════════════════════════════════════
STEP 2: Clone/Update Repository
════════════════════════════════════════════════════════════════════════════════

Navigate to your app directory and pull the latest code:

  cd /opt/blazetv   # or wherever your staging checkout is
  
  git fetch origin
  git checkout main
  git pull origin main

Verify the deployment scripts exist:

  ls -la scripts/staging_execute.sh
  ls -la scripts/validate_staging_attestation.sh

Make them executable:

  chmod +x ./scripts/staging_execute.sh
  chmod +x ./scripts/validate_staging_attestation.sh

════════════════════════════════════════════════════════════════════════════════
STEP 3: Set Environment Variables
════════════════════════════════════════════════════════════════════════════════

Set these in your shell session or CI/CD job (DO NOT paste secrets here):

  export DATABASE_URL="postgres://user:pass@host:5432/dbname"
  export AWS_S3_BUCKET="your-staging-bucket"
  export AWS_ACCESS_KEY_ID="your-key-id"
  export AWS_SECRET_ACCESS_KEY="your-secret-key"
  export CDN_BASE_URL="https://cdn.staging.example.com/videos"
  export SERVER_WEBHOOK_URL="https://staging.example.com/webhooks/antigravity"
  export ANTIGRAVITY_WEBHOOK_SECRET="your-webhook-secret"
  export REACT_APP_SHOW_PLACEHOLDER_AD="false"
  export REAL_MONEY_ENABLED="false"
  export REACT_APP_REAL_MONEY_ENABLED="false"

Verify they're set:

  echo "DATABASE_URL: ${DATABASE_URL:0:20}..."
  echo "AWS_S3_BUCKET: $AWS_S3_BUCKET"
  echo "SERVER_WEBHOOK_URL: $SERVER_WEBHOOK_URL"

════════════════════════════════════════════════════════════════════════════════
STEP 4: Run Staging Deployment (20 minutes)
════════════════════════════════════════════════════════════════════════════════

Execute the automated deployment script:

  ./scripts/staging_execute.sh

This will:
  ✅ Verify all environment variables
  ✅ Backup your database
  ✅ Apply all migrations
  ✅ Build the frontend
  ✅ Restart services
  ✅ Seed 3 sample public-domain videos
  ✅ Run evidence validator
  ✅ Create evidence_*.zip

Expected runtime: 15-20 minutes

You'll see output like:

  ╔════════════════════════════════════════════════════════════════════════════╗
  ║                   BLAZETV STAGING DEPLOYMENT                              ║
  ║                         2026-01-16 15:30:00                               ║
  ╚════════════════════════════════════════════════════════════════════════════╝

  [15:30:00] ▶ STEP 1: Verifying environment variables...
  ✅ Environment verified

  [15:30:05] ▶ STEP 2: Backing up database...
  ✅ Database backup created

  ... (more steps) ...

  [15:32:15] ▶ STEP 8: Creating evidence bundle...
  ✅ Evidence bundle created
     Archive: evidence_20260116_153215.zip
     Size: 42KB

  ╔════════════════════════════════════════════════════════════════════════════╗
  ║                     STAGING DEPLOYMENT COMPLETE ✅                        ║
  ╚════════════════════════════════════════════════════════════════════════════╝

════════════════════════════════════════════════════════════════════════════════
STEP 5: Verify Deployment (Smoke Tests)
════════════════════════════════════════════════════════════════════════════════

Test the API endpoints:

  # Test feed endpoint
  curl -s "https://staging.example.com/api/blazetv/feed?limit=6" | jq .

  # Test video endpoint
  curl -s "https://staging.example.com/api/blazetv/video/1" | jq .

  # Test search
  curl -s "https://staging.example.com/api/blazetv/search?q=test" | jq .

  # Test admin endpoints (if auth configured)
  curl -s "https://staging.example.com/api/admin/creators" | jq .

Check database:

  psql "$DATABASE_URL" -c "SELECT COUNT(*) as video_count FROM videos;"
  psql "$DATABASE_URL" -c "SELECT COUNT(*) as watch_events FROM watch_events;"

Web UI verification (manual):

  Open: https://staging.example.com/blazetv
  - Verify videos load
  - Click a video thumbnail
  - Verify video plays
  - Check Creator Verification badge appears

════════════════════════════════════════════════════════════════════════════════
STEP 6: Locate Evidence Bundle
════════════════════════════════════════════════════════════════════════════════

The deployment script creates an evidence_*.zip file:

  ls -lh evidence_*.zip

Expected location: In the app root directory

Size: ~40-50KB

Find the exact path:

  find . -name "evidence_*.zip" -type f

════════════════════════════════════════════════════════════════════════════════
STEP 7: Download Evidence Bundle Locally
════════════════════════════════════════════════════════════════════════════════

From your local machine, copy the evidence bundle:

  scp ubuntu@staging.example.com:/opt/blazetv/evidence_*.zip ./

Or if using CI/CD, download the artifact from your CI system.

Verify locally:

  ls -lh evidence_*.zip
  unzip -t evidence_*.zip

════════════════════════════════════════════════════════════════════════════════
STEP 8: Upload to GitHub Issue #12
════════════════════════════════════════════════════════════════════════════════

Go to: https://github.com/drosser895-eng/setlist-sleuth/issues/12

Click "Attach files" and drag/drop the evidence_*.zip

Or use GitHub CLI:

  gh issue comment 12 --body "Staging evidence bundle attached" \
    --attachment evidence_*.zip

Wait for upload to complete. Then copy the Issue URL.

════════════════════════════════════════════════════════════════════════════════
STEP 9: Report Back
════════════════════════════════════════════════════════════════════════════════

Reply with:

  1. Status: ✅ Deployment completed successfully (or ❌ with error details)
  2. Evidence bundle: Link to Issue #12 or direct URL to uploaded ZIP
  3. Any issues encountered: (leave blank if none)
  4. Smoke test results: Feed working? Videos playing? etc.

Example reply:

  ✅ Deployment completed successfully
  Evidence: https://github.com/drosser895-eng/setlist-sleuth/issues/12#...
  Issues: None
  Smoke tests: ✅ All endpoints responding, ✅ Videos playing, ✅ Creator badges showing

════════════════════════════════════════════════════════════════════════════════
WHAT HAPPENS NEXT (After You Upload Evidence)
════════════════════════════════════════════════════════════════════════════════

I will:

  1. Download the evidence_*.zip from Issue #12 (1 minute)
  2. Validate the harness logs and proofs (15-30 minutes)
  3. Verify DB→proof mapping and blockchain anchor (10 minutes)
  4. Generate final Evidence README (10 minutes)
  5. Finalize Counsel/PSP email with real merkle roots (10 minutes)
  6. Post results in Issue #12 (2 minutes)

Total: 1-2 hours

Then you'll have:

  ✅ Validated evidence bundle
  ✅ Final Evidence README
  ✅ Ready-to-send Counsel email
  ✅ Clearance to proceed to production

════════════════════════════════════════════════════════════════════════════════
TROUBLESHOOTING
════════════════════════════════════════════════════════════════════════════════

If staging_execute.sh fails:

  • Check logs: tail -100 /tmp/blazetv_staging_*.log
  • Verify env vars: echo $DATABASE_URL | head -c 50
  • Test DB connectivity: psql "$DATABASE_URL" -c "SELECT 1;"
  • Test S3 access: aws s3 ls s3://$AWS_S3_BUCKET/
  • Check services running: pm2 status (or docker ps / systemctl status)

Common issues:

  ❌ psql not found
    → sudo apt install postgresql-client

  ❌ Database connection timeout
    → Verify security group allows inbound on port 5432
    → Check DB is running: psql -h <host> -U <user> -d <db> -c "SELECT 1;"

  ❌ AWS credentials invalid
    → aws sts get-caller-identity
    → Verify AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY

  ❌ ffmpeg not found
    → sudo apt install ffmpeg

  ❌ Services won't restart
    → pm2 logs blazetv
    → docker-compose logs -f app
    → journalctl -u blazetv -f

════════════════════════════════════════════════════════════════════════════════
READY TO DEPLOY?
════════════════════════════════════════════════════════════════════════════════

You have two options:

1. RUN LOCALLY (this machine can reach staging DB/S3):
   → Follow STEP 1-9 above on a local machine with network access
   → Then report back with the evidence bundle link

2. RUN IN CI/CD (recommended):
   → Set env vars in your CI job
   → Run the steps in a CI job that has network access to staging
   → Upload artifact to Issue #12

Timeline once you start: 25-30 minutes until evidence is uploaded

Ready? Run: ./scripts/staging_execute.sh

Then report back with the Issue #12 link and I'll validate immediately. 🚀

EOF
