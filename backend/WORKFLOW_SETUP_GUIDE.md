# GitHub Actions: Auto-Validate & Upload Workflow Setup Guide

This guide walks through enabling the enhanced GitHub Actions workflow for automated evidence bundle validation, approval, and counsel email generation.

## What the Workflow Does

The **Auto Validate, Approve & Upload** workflow (`/.github/workflows/auto-validate-and-upload.yml`):

1. **Validates** evidence bundle (finds `blazetv_evidence_*.zip`)
2. **Extracts** proof data (merkle roots, anchor transactions, match IDs)
3. **Pauses** for manual approval (requires designated reviewer sign-off)
4. **Generates** a professional counsel email using Hugging Face LLM
5. **Posts** validation results + generated email to Issue #12 (or custom issue)
6. **Attaches** evidence bundle and proof summary

### Workflow Architecture

```
┌─────────────────┐
│   trigger()     │  (workflow_dispatch, PR, or push)
└────────┬────────┘
         │
         ▼
    ┌─────────────┐
    │  validate   │  • Find ZIP
    │   (runs)    │  • Extract & check
    └──────┬──────┘  • Build proof_summary.tsv
           │
           ▼
    ┌──────────────────┐
    │   approval       │  ⏸️  PAUSES HERE
    │ (manual gate)    │  Requires reviewer approval
    └─────┬────────────┘
          │
          ▼
    ┌──────────────────┐
    │     post         │  • Extract roots
    │   (runs post-    │  • Call HF Inference API
    │   approval)      │  • Generate counsel email
    └─────┬────────────┘  • Post to Issue
          │
          ▼
    ┌──────────────────┐
    │    summary       │  • Report completion
    └──────────────────┘
```

## Setup Instructions

### Step 1: Create GitHub Environment for Manual Approval

1. Go to your repository **Settings** tab
2. Left sidebar → **Environments**
3. Click **New environment**
4. **Environment name:** `validation-approval`
5. Click **Configure environment**
6. Under **Required reviewers:**
   - Add your GitHub username or team
   - These people must approve before the workflow continues
7. Click **Save protection rules**

✅ The `approval` job in the workflow now requires their sign-off.

### Step 2: Add Hugging Face API Token as GitHub Secret

#### Get your Hugging Face API token:

1. Go to https://huggingface.co/settings/tokens
2. Create a **New token**
   - **Name:** `blazetv-workflow`
   - **Type:** `read` (minimum needed for inference)
   - **Organizations:** Your org (if applicable)
3. Copy the token (starts with `hf_`)

#### Add to GitHub Secrets:

1. Go to your repository **Settings** tab
2. Left sidebar → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. **Name:** `HF_API_KEY`
5. **Value:** Paste your Hugging Face token
6. Click **Add secret**

✅ The workflow now has access to Hugging Face Inference API.

### Step 3: Verify Files Committed

Ensure these files exist in your `main` branch:

```
.github/workflows/auto-validate-and-upload.yml    # Enhanced workflow
scripts/extract_roots.py                          # Python helper (extracts proofs)
scripts/generate_counsel_email.py                 # Python helper (generates email)
```

Run:
```bash
git log --oneline | head -5
# Should show: ci: add enhanced workflow with manual approval and LLM-based counsel email generation
```

## How to Use the Workflow

### Option A: Manual Trigger

1. Go to your repository **Actions** tab
2. Find workflow **"Auto Validate, Approve & Upload"**
3. Click **Run workflow**
4. (Optional) Enter custom issue number in the input field (default: 12)
5. Click **Run workflow** button

**Workflow runs:**
- Validates evidence bundle (if `blazetv_evidence_*.zip` exists in repo root)
- Pauses at `approval` job
- Waits for configured reviewer to approve

### Option B: Trigger on Pull Request

The workflow also runs when a PR is opened/updated against `main`. 

- Useful if you commit evidence bundle in a PR branch
- Same approval gate applies

### Approving the Workflow

Once the workflow pauses at the `approval` job:

1. Go to **Actions** tab
2. Find the running workflow
3. Click on the workflow run
4. You'll see the `approval` job waiting for review
5. Click **Review deployments**
6. Select **validation-approval** environment
7. Add comment (optional) like "Approved - ready to post"
8. Click **Approve and deploy**

✅ Workflow continues to `post` job:
- Extracts merkle roots from proofs
- Calls Hugging Face Inference API to generate counsel email
- Posts both validation output and generated email to Issue #12

## What Gets Generated

### After the Workflow Completes:

**Issue #12 Comments** (automatically posted):

1. **Validation Output** 
   - Lists files in evidence bundle
   - Shows harness output (merkle/anchor lines)
   - Proof summary (IDs, merkle roots, anchor TXs)

2. **Generated Counsel Email**
   - Professional format for legal review
   - Includes all merkle roots and anchor TXs
   - Requests 24-48 hour review
   - Suggests blockchain explorer links

3. **Attached Files**
   - `blazetv_evidence_*.zip` (original bundle)
   - Generated email text file

### Example Generated Email Structure:

```
Subject: BlazeTV Evidence Bundle Validation & Legal Review Request

TO: Legal Counsel & Compliance Officers
FROM: BlazeTV Development Team

EXECUTIVE SUMMARY
  Total Proofs Validated: 47
  Bundle Status: ✅ VERIFIED
  Merkle Root Chain: Complete
  Anchor Transactions: Anchored to blockchain

PROOF DETAILS
  Proof #1: Match ID 49279
    Merkle Root: 0xabcd...
    Anchor TX: 0x1234...
    Verify: https://etherscan.io/tx/0x1234...

  [... more proofs ...]

ACTION REQUIRED
  1. Review proof details
  2. Verify anchor transactions on blockchain
  3. Confirm compliance requirements met
  4. Provide written approval

[... professional close ...]
```

## Environment Variables & Configuration

### Optional: Change the LLM Model

The workflow uses `google/flan-ul2` by default. To change:

1. Edit `.github/workflows/auto-validate-and-upload.yml`
2. Find the `env:` section at the top
3. Change `HF_MODEL: 'google/flan-ul2'` to another model:
   - `meta-llama/Llama-2-7b-hf` (fast, good quality)
   - `mistralai/Mistral-7B` (newer, optimized)
   - `gpt2` (lightweight)
4. Commit and push

### Optional: Always Post to Different Issue

Instead of using `workflow_dispatch` input, set a fixed issue:

1. Edit `.github/workflows/auto-validate-and-upload.yml`
2. Change: `ISSUE: ${{ github.event.inputs.issue_number || env.DEFAULT_ISSUE }}`
3. To: `ISSUE: '15'` (or whatever issue number)
4. Commit and push

## Security & Best Practices

### 🔐 Security Notes

- **HF_API_KEY** is stored as a GitHub Secret (never exposed in logs)
- Workflow uses read-only GitHub Token for posting comments
- No database mutations or admin SQL runs automatically
- Manual approval gate prevents accidental posting
- LLM output is reviewed before sending to counsel

### ✅ Best Practices

1. **Always review generated email** before forwarding to counsel
   - LLMs can hallucinate details
   - Check all merkle roots and TX links match the evidence bundle

2. **Verify anchor transactions** on blockchain explorer
   - Use provided TX link in generated email
   - Confirm transaction is confirmed (not pending)

3. **Test workflow with test evidence bundle first**
   - Run on a test issue (#999) before using Issue #12
   - Ensure approval gate and email generation work as expected

4. **Keep HF_API_KEY secure**
   - Don't commit it to the repo
   - Rotate periodically if compromised
   - Use fine-grained tokens if Hugging Face supports it

## Troubleshooting

### Issue: "No evidence zip found"

**Cause:** Workflow didn't find `blazetv_evidence_*.zip` in repo root

**Solution:**
```bash
# Ensure ZIP is committed or present in repo root
ls -lh blazetv_evidence_*.zip

# If not present, upload:
git add blazetv_evidence_*.zip
git commit -m "test: add evidence bundle"
git push origin main
```

### Issue: Workflow fails at "approval" job

**Cause:** GitHub Environment not configured or no reviewers set

**Solution:**
1. Go to **Settings** → **Environments**
2. Verify `validation-approval` environment exists
3. Verify **Required reviewers** is set (not empty)
4. Try adding yourself as a reviewer initially

### Issue: "HF_API_KEY not set" error

**Cause:** GitHub Secret wasn't added

**Solution:**
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Verify `HF_API_KEY` secret exists
3. Test token is valid:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://huggingface.co/api/user
   ```

### Issue: Workflow hangs at "approval" job

**Cause:** Normal behavior! Waiting for reviewer approval.

**Solution:**
1. Go to **Actions** → find the workflow run
2. Click on it to see details
3. Click **Review deployments** button
4. Select `validation-approval` environment
5. Click **Approve and deploy**

### Issue: Generated email looks wrong or incomplete

**Cause:** Hugging Face model generated unexpected output

**Solution:**
1. Review the email in Issue #12
2. Edit before sending to counsel
3. (Optional) Try a different model:
   - Edit `.github/workflows/auto-validate-and-upload.yml`
   - Change `HF_MODEL` to `mistralai/Mistral-7B`
   - Re-run workflow

## Next Steps

1. **Complete setup:**
   - ✅ Create `validation-approval` environment
   - ✅ Add `HF_API_KEY` secret
   - ✅ Verify files committed

2. **Test the workflow:**
   ```bash
   # Ensure evidence bundle is in repo root
   cp ~/Downloads/blazetv_evidence_*.zip .
   git add blazetv_evidence_*.zip
   git commit -m "test: add evidence bundle for workflow test"
   git push origin main
   
   # Trigger workflow manually from Actions tab
   ```

3. **After successful test:**
   - Review generated email in Issue #12
   - Modify if needed
   - Save to send to counsel

4. **Send to counsel:**
   - Download the generated email from Issue #12
   - Send to legal/compliance contacts
   - Request sign-off (24-48 hour target)

## Support

For issues or questions:

1. Check workflow logs: **Actions** tab → click workflow run → view logs
2. Check GitHub environment settings are correct
3. Verify HF_API_KEY is valid
4. Review this guide's Troubleshooting section

---

**Questions?** Ask in repo issues or check the full workflow file at `.github/workflows/auto-validate-and-upload.yml`.
