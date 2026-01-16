# Environment-Scoped Secret Setup — Next Steps

## ✅ Progress So Far

- ✅ **repo-level secret created:** `HF_API_KEY` (repo-wide, 7 min ago)
- ✅ **environment created:** `validation-approval` (Jan 16, 23:49 UTC)
- ⏳ **environment-scoped secret:** NOT YET SET (you'll do this next)

---

## Step 1: Add HF_API_KEY to validation-approval Environment

This will move your token from repo-wide to environment-scoped (more secure).

**Run this command locally:**

```bash
# Interactive prompt — paste your HF token (no echo)
printf "Paste HF token (no echo), then press Enter: "
read -s HF_API_KEY
echo
# Set token as environment-scoped secret
gh secret set HF_API_KEY --repo drosser895-eng/setlist-sleuth --env validation-approval --body "$HF_API_KEY"
# Clear local copy
unset HF_API_KEY
echo "✅ HF_API_KEY set for environment 'validation-approval'."
```

**What this does:**
- Prompts you to paste your Hugging Face token (no echo for security)
- Stores it as an environment-scoped secret (only available in validation-approval)
- Clears the token from your local shell

---

## Step 2: Verify Environment-Scoped Secret

After running Step 1, verify it was created:

```bash
gh secret list --repo drosser895-eng/setlist-sleuth --env validation-approval
```

**Expected output:**
```
NAME        UPDATED
HF_API_KEY  just now
```

---

## Step 3: Run the Workflow

Test the workflow with the environment-scoped secret:

```bash
gh workflow run auto-validate-and-upload.yml -f issue_number=12 --repo drosser895-eng/setlist-sleuth
echo "Workflow triggered!"
```

**Then check the run:**

```bash
gh run list --repo drosser895-eng/setlist-sleuth
```

---

## Step 4: (Optional) Remove Repo-Level Secret

Once you confirm the workflow succeeds using the env-scoped secret, you can remove the repo-wide secret to narrow exposure:

```bash
gh secret remove HF_API_KEY --repo drosser895-eng/setlist-sleuth
echo "✅ Removed repo-level HF_API_KEY (env-scoped secret remains)"
```

**After this, verify both:**

```bash
# Repo-level should be empty
gh secret list --repo drosser895-eng/setlist-sleuth

# Environment-level should still have it
gh secret list --repo drosser895-eng/setlist-sleuth --env validation-approval
```

---

## 🎯 Summary of Security Posture

**Before (current):**
- ✅ Repo-level secret: HF_API_KEY (available to all workflows)
- ✅ Environment exists: validation-approval (no protection rules yet)
- ⏳ Environment secret: not yet set

**After Steps 1-4:**
- ✅ Repo-level secret: REMOVED (narrow exposure)
- ✅ Environment secret: HF_API_KEY (only available in validation-approval environment)
- ✅ Full automation: workflow proceeds without manual approval (no reviewers set yet)
- ✅ Security benefit: token only exposed to jobs targeting validation-approval environment

**If you want manual approval later:**
```bash
# Add required reviewers to environment (via UI)
# Settings → Environments → validation-approval → Required reviewers
```

---

## 📋 Commands Cheat Sheet

```bash
# 1. Set environment-scoped secret (interactive)
printf "Paste HF token (no echo): " && read -s HF_API_KEY && echo && \
gh secret set HF_API_KEY --repo drosser895-eng/setlist-sleuth --env validation-approval --body "$HF_API_KEY" && \
unset HF_API_KEY

# 2. Verify it was set
gh secret list --repo drosser895-eng/setlist-sleuth --env validation-approval

# 3. Run workflow
gh workflow run auto-validate-and-upload.yml -f issue_number=12 --repo drosser895-eng/setlist-sleuth

# 4. Check runs
gh run list --repo drosser895-eng/setlist-sleuth

# 5. View workflow logs
gh run view <run-id> --log --repo drosser895-eng/setlist-sleuth

# 6. (Optional) Remove repo-level secret after env-secret works
gh secret remove HF_API_KEY --repo drosser895-eng/setlist-sleuth
```

---

## ✅ How to Tell It Worked

**Success indicators:**
1. ✅ Workflow runs and completes
2. ✅ Issue #12 has new comments with:
   - Validation output
   - Generated counsel email
   - Attached evidence bundle
3. ✅ Logs show successful Hugging Face API call (no 401/403 errors)

**If something fails:**
- Check workflow logs: `gh run view <run-id> --log`
- Look for error messages about missing HF_API_KEY or invalid token
- Verify token has `read`/`inference` scope in Hugging Face settings

---

## 🔒 Security Notes

- ✅ Token never pasted in chat or logs
- ✅ Environment-scoped secret is more secure than repo-wide
- ✅ Token only exposed to jobs targeting validation-approval environment
- ✅ Future: can add required reviewers to gate token exposure behind approval
- ✅ If token leaks: revoke in Hugging Face settings, update secret, no need to change GitHub access

---

## Next: Ready to Proceed?

Run **Step 1** command above (the `read -s` prompt for your HF token), then run **Step 2** to verify it was set. 

Paste the output of `gh secret list --repo drosser895-eng/setlist-sleuth --env validation-approval` here and I'll confirm it's ready, then we can run the workflow!
