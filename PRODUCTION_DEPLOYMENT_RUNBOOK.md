╔════════════════════════════════════════════════════════════════════════════════╗
║                                                                                ║
║                   BLAZETV PRODUCTION DEPLOYMENT RUNBOOK                        ║
║                                                                                ║
║                         From Staging to Live in 30 Minutes                     ║
║                                                                                ║
╚════════════════════════════════════════════════════════════════════════════════╝

⚠️  CRITICAL PREREQUISITES BEFORE PRODUCTION DEPLOYMENT:

  ☑️  Legal counsel has reviewed and approved all compliance measures
  ☑️  Staging deployment successful with validated evidence
  ☑️  All payment integrations tested (Lemon Squeezy/PayPal)
  ☑️  Database backups automated and tested
  ☑️  Monitoring and alerting configured
  ☑️  Incident response team briefed
  ☑️  Rollback plan prepared
  ☑️  Launch communications prepared

If ANY of these are missing, DO NOT PROCEED. Return to staging.

════════════════════════════════════════════════════════════════════════════════

PHASE 1: PRE-DEPLOYMENT (30 min before launch)
════════════════════════════════════════════════════════════════════════════════

STEP 1.1: Final System Check (5 minutes)

  □ Verify all staging tests passing
    bash tests/smoke.sh
  
  □ Confirm database backup automation is active
    pg_dump --version && echo "✅ PostgreSQL ready"
  
  □ Test payment processor connectivity
    curl -s https://api.lemonsqueezy.com/v1/status | jq .
  
  □ Verify CDN is configured and responding
    curl -I https://cdn.blazetv.example.com/health

STEP 1.2: Final Evidence Review (10 minutes)

  □ Review COUNSEL_PSP_EMAIL_SIGNED.md (must be signed by counsel)
  
  □ Confirm all proofs in evidence_*.zip are valid
    unzip -t evidence_*.zip
  
  □ Verify blockchain anchor transaction
    Check: ANCHOR_VERIFICATION.txt contains confirmed tx hash
  
  □ Review LAUNCH_CHECKLIST.md completion status
    All items must be checked ✓

STEP 1.3: Notify Team (5 minutes)

  □ Slack announcement: "Production deployment starting in 15 minutes"
  
  □ Alert ops team: Point to this runbook
  
  □ Confirm incident response team is standing by
  
  □ Set Slack status: 🔴 Production Deployment in Progress

STEP 1.4: Final Production Prep (10 minutes)

  □ Set environment variables on production runner:
    export REAL_MONEY_ENABLED="true"
    export ENVIRONMENT="production"
    export NODE_ENV="production"
    export LOG_LEVEL="info"
  
  □ Pull latest code from main branch
    git fetch origin
    git checkout main
    git pull origin main --verify-signatures
  
  □ Verify production database is healthy
    psql "$PROD_DATABASE_URL" -c "SELECT COUNT(*) FROM videos;"
  
  □ Confirm all dependencies installed
    npm ci --production

════════════════════════════════════════════════════════════════════════════════

PHASE 2: DEPLOYMENT (30 minutes)
════════════════════════════════════════════════════════════════════════════════

STEP 2.1: Full Database Backup (5 minutes)

  💾 CRITICAL: Create full backup before any changes

  □ Run backup
    BACKUP_FILE="/backups/blazetv_prod_$(date +%Y%m%d_%H%M%S).dump"
    pg_dump "$PROD_DATABASE_URL" -Fc -f "$BACKUP_FILE"
  
  □ Verify backup integrity
    pg_restore -l "$BACKUP_FILE" | head -20
  
  □ Store backup location in team notes
    Note: $BACKUP_FILE

STEP 2.2: Apply Production Migrations (5 minutes)

  □ List migrations to be applied
    ls -lh migrations/2026*.sql
  
  □ Apply each migration sequentially
    psql "$PROD_DATABASE_URL" -f migrations/20260125_create_videos_table.sql
    psql "$PROD_DATABASE_URL" -f migrations/20260126_add_owner_verification.sql
    psql "$PROD_DATABASE_URL" -f migrations/20260127_create_watch_events.sql
  
  □ Verify schema updated
    psql "$PROD_DATABASE_URL" -c "\dt"

STEP 2.3: Build Production Assets (5 minutes)

  □ Build optimized frontend
    npm run build
  
  □ Verify build succeeded
    [ -d build/ ] && echo "✅ Build OK" || echo "❌ Build failed"
  
  □ Check asset sizes (should be <5MB gzipped)
    gzip -c build/index.js | wc -c

STEP 2.4: Restart Application Services (5 minutes)

  Option A: PM2 (if using)
  
    □ Stop current processes
      pm2 stop all
    
    □ Start new instances
      pm2 start ecosystem.config.js --env production
    
    □ Verify services are running
      pm2 list
  
  Option B: Docker Compose
  
    □ Pull latest images
      docker-compose pull
    
    □ Start services
      docker-compose up -d
    
    □ Verify all containers running
      docker-compose ps
  
  Option C: Kubernetes
  
    □ Update deployment
      kubectl set image deployment/blazetv-app \
        blazetv-app=your-registry/blazetv:latest
    
    □ Watch rollout
      kubectl rollout status deployment/blazetv-app

STEP 2.5: Warm Up Cache & Verify (5 minutes)

  □ Hit feed endpoint to warm cache
    curl -s "https://blazetv.example.com/api/blazetv/feed?limit=10" | jq .
  
  □ Test watch page loads
    curl -s "https://blazetv.example.com/watch/test_vid_1" | head -50
  
  □ Verify search is working
    curl -s "https://blazetv.example.com/api/search/videos?q=music" | jq .
  
  □ Test admin endpoints
    curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
      "https://blazetv.example.com/api/admin/analytics/overview" | jq .

STEP 2.6: Enable Real Money (If not already enabled)

  ⚠️  This is the point of no return

  □ Confirm you have counsel approval
    Reference: COUNSEL_PSP_EMAIL_SIGNED.md
  
  □ Enable real money on production
    # Via environment variable:
    export REAL_MONEY_ENABLED="true"
    
    # Via database (if stored there):
    psql "$PROD_DATABASE_URL" -c \
      "UPDATE config SET real_money_enabled = true WHERE key = 'payments'"
  
  □ Verify payment links are now active
    curl -s "https://blazetv.example.com/api/payment-link/test" | jq .

════════════════════════════════════════════════════════════════════════════════

PHASE 3: POST-DEPLOYMENT VALIDATION (30 minutes)
════════════════════════════════════════════════════════════════════════════════

STEP 3.1: Smoke Tests (10 minutes)

  □ Feed endpoint responds with videos
    RESULT=$(curl -s "https://blazetv.example.com/api/blazetv/feed?limit=1" | jq '.[] | .id')
    [ -n "$RESULT" ] && echo "✅ Feed OK" || echo "❌ Feed failed"
  
  □ Watch page loads and plays HLS
    curl -s "https://blazetv.example.com/watch/$RESULT" | grep -q "hls_url" \
      && echo "✅ Watch page OK" || echo "❌ Watch page failed"
  
  □ Search works
    curl -s "https://blazetv.example.com/api/search/videos?q=test" | jq . \
      && echo "✅ Search OK" || echo "❌ Search failed"
  
  □ Admin dashboard accessible
    curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
      "https://blazetv.example.com/api/admin/analytics/overview" | jq . \
      && echo "✅ Admin OK" || echo "❌ Admin failed"

STEP 3.2: Monitor Critical Metrics (10 minutes)

  □ Check error rate (should be <0.1%)
    Check: CloudWatch / DataDog / your monitoring tool
  
  □ Verify API response times (should be <500ms)
    Check: New Relic / APM tool
  
  □ Monitor database queries (should be <100ms p99)
    psql "$PROD_DATABASE_URL" -c "SELECT * FROM pg_stat_statements LIMIT 10;"
  
  □ Check CDN hit rate (should be >80%)
    Check: CloudFront / Cloudflare console

STEP 3.3: Deployment Notification (5 minutes)

  □ Post successful deployment notice
    Slack: "✅ Production deployment complete. All systems green."
  
  □ Update status page
    Status: "Deployment Complete - Monitoring"
  
  □ Notify team
    Email: team@blazetv.example.com
    Subject: "BlazeTV Production Deployment Successful"

STEP 3.4: Initial Monitoring (Ongoing)

  □ Watch error logs for 30 minutes
    tail -f /var/log/blazetv/app.log
  
  □ Monitor traffic spike
    Expected: 50-100 new visitors in first hour
  
  □ Check payment processing
    If payments enabled: monitor for successful transactions
  
  □ Monitor social media mentions
    Slack integration to real-time mention tracking

════════════════════════════════════════════════════════════════════════════════

PHASE 4: ROLLBACK PROCEDURE (If needed)
════════════════════════════════════════════════════════════════════════════════

⚠️  ONLY execute if critical failures occur

STEP 4.1: Immediate Actions (1 minute)

  □ Disable payments immediately (if issue is payment-related)
    export REAL_MONEY_ENABLED="false"
  
  □ Set maintenance mode
    # Redirect all traffic to maintenance page
    Update load balancer / nginx to serve maintenance.html
  
  □ Notify team
    Slack: "🔴 EMERGENCY: Rolling back deployment"

STEP 4.2: Database Rollback (5 minutes)

  □ Stop application
    pm2 stop all  (or docker-compose down)
  
  □ Restore from backup (CHOOSE ONE):
    
    Option A: Restore entire database
      pg_restore -d "$PROD_DATABASE_URL" "$BACKUP_FILE"
    
    Option B: Restore specific table
      pg_restore -t videos "$BACKUP_FILE" | psql "$PROD_DATABASE_URL"

STEP 4.3: Code Rollback (5 minutes)

  □ Revert to previous working commit
    git checkout <LAST_KNOWN_GOOD_COMMIT>
  
  □ Rebuild
    npm ci && npm run build
  
  □ Restart services
    pm2 restart all

STEP 4.4: Verification (5 minutes)

  □ Test basic functionality
    curl -s "https://blazetv.example.com/api/blazetv/feed" | jq .
  
  □ Verify errors stopped
    Check: Log file shows no critical errors
  
  □ Remove maintenance mode
    Update load balancer to serve production

STEP 4.5: Post-Incident (After stabilization)

  □ Document what went wrong
  
  □ Schedule incident retrospective
  
  □ Create fix tickets
  
  □ Update runbook if procedures need improvement

════════════════════════════════════════════════════════════════════════════════

STEP 5: DECLARE SUCCESS
════════════════════════════════════════════════════════════════════════════════

After 1 hour of successful monitoring:

✅ DEPLOYMENT SUCCESSFUL

Checklist:
  ☑️  Error rate <0.1%
  ☑️  API response time <500ms
  ☑️  All smoke tests passing
  ☑️  No payment failures
  ☑️  Database healthy
  ☑️  CDN working
  ☑️  Creators can verify
  ☑️  Audience can watch

Next Steps:
  1. Monitor for 24 hours
  2. Analyze launch metrics
  3. Begin creator onboarding
  4. Plan feature releases

════════════════════════════════════════════════════════════════════════════════

TROUBLESHOOTING REFERENCE
════════════════════════════════════════════════════════════════════════════════

Problem: Migration fails
Solution:
  1. Check migration file syntax
  2. Restore database backup
  3. Review migration logs in /tmp/blazetv_*.log
  4. Run migration manually to see exact error
  5. Contact DBA if needed

Problem: Services won't start
Solution:
  1. Check environment variables are set
  2. Verify database connectivity
  3. Check port availability (ps aux | grep node)
  4. Review application logs
  5. Rollback to previous version

Problem: High error rate
Solution:
  1. Check error logs for patterns
  2. Monitor database load
  3. Check CDN status
  4. Verify payment processor status
  5. Consider rollback if >1% error rate persists

Problem: Slow API responses
Solution:
  1. Check database slow query log
  2. Verify database indexes
  3. Clear cache if possible
  4. Scale up resources if needed
  5. Monitor network latency

Problem: Payment failures
Solution:
  1. Set REAL_MONEY_ENABLED=false immediately
  2. Test payment endpoint in staging
  3. Verify payment processor credentials
  4. Check webhook signature validation
  5. Contact payment processor support

════════════════════════════════════════════════════════════════════════════════

CONTACTS & ESCALATION
════════════════════════════════════════════════════════════════════════════════

During deployment, contact:
  🔴 Critical Issue: [YOUR_EMERGENCY_NUMBER]
  🟡 Urgent Issue: [TEAM_SLACK]
  🟢 General: [TEAM_EMAIL]

External Contacts:
  Payment Processor: [SUPPORT_URL]
  CDN Provider: [SUPPORT_URL]
  Database Hosting: [SUPPORT_URL]
  DNS Provider: [SUPPORT_URL]

On-Call Schedule:
  [INSERT YOUR ON-CALL ROTATION]

════════════════════════════════════════════════════════════════════════════════

Remember: When in doubt, ROLLBACK.
Your reputation depends on stability, not speed.

Good luck! 🚀

════════════════════════════════════════════════════════════════════════════════
