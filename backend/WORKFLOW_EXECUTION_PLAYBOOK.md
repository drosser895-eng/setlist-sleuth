# Workflow Execution Playbook — Final Steps

## Current Status

✅ GitHub environment `validation-approval` created
✅ Repo-level secret `HF_API_KEY` exists
✅ All workflow files committed to main
⏳ Environment-scoped secret: NOT YET SET
⏳ Workflow: READY TO TRIGGER

---

## Run These Commands On Your Machine (zsh macOS)

### Step 1: Set Environment-Scoped Secret

```bash
printf "Paste HF token (no echo), then press Enter: "
read -s HF_API_KEY
echo
gh secret set HF_API_KEY --repo drosser895-eng/setlist-sleuth \
  --env validation-approval --body "$HF_API_KEY"
unset HF_API_KEY
echo "✅ HF_API_KEY set for environment 'validation-approval'."
```

**What it does:**
- Prompts you to paste HF token (secure, no echo)
- Stores as environment-scoped secret
- Clears token from shell
- Prints success

### Step 2: Verify Environment Secret

```bash
gh secret list --repo drosser895-eng/setlist-sleuth --env validation-approval
```

**Expected:**
```
NAME        UPDATED
HF_API_KEY  just now
```

### Step 3: Trigger Workflow

```bash
gh workflow run auto-validate-and-upload.yml -f issue_number=12 \
  --repo drosser895-eng/setlist-sleuth
```

**Expected:** `✓ Workflow run queued`

### Step 4: Get Run ID

```bash
gh run list --workflow auto-validate-and-upload.yml \
  --repo drosser895-eng/setlist-sleuth
```

**Copy the RUN ID from the output** (first column, looks like: `1234567890`)

### Step 5: View Logs (optional)

```bash
gh run view <run-id> --log --repo drosser895-eng/setlist-sleuth
```

Or open in browser:
```bash
gh run view <run-id> --repo drosser895-eng/setlist-sleuth --web
```

### Step 6: Check Results

Open Issue #12:
```bash
open "https://github.com/drosser895-eng/setlist-sleuth/issues/12"
```

Look for:
- ✅ Validation output comment
- ✅ Generated counsel email
- ✅ Attached evidence bundle ZIP
- ✅ Attached proof summary TSV

---

## After Running the Workflow

Paste the **RUN ID** or **run URL** here and I'll help you:

1. **Interpret the logs** — show what succeeded/failed
2. **Confirm email generation** — verify HF call worked
3. **Check Issue #12** — confirm all attachments posted
4. **Remove repo secret** (optional) — narrow exposure once verified

---

## Quick Reference: All Commands

```bash
# 1. Set env secret (interactive)
printf "Paste HF token (no echo): " && read -s HF_API_KEY && echo && \
gh secret set HF_API_KEY --repo drosser895-eng/setlist-sleuth --env validation-approval --body "$HF_API_KEY" && \
unset HF_API_KEY

# 2. Verify env secret
gh secret list --repo drosser895-eng/setlist-sleuth --env validation-approval

# 3. Trigger workflow
gh workflow run auto-validate-and-upload.yml -f issue_number=12 --repo drosser895-eng/setlist-sleuth

# 4. List runs
gh run list --workflow auto-validate-and-upload.yml --repo drosser895-eng/setlist-sleuth

# 5. View logs
gh run view <run-id> --log --repo drosser895-eng/setlist-sleuth

# 6. View in browser
gh run view <run-id> --repo drosser895-eng/setlist-sleuth --web

# 7. Check repo secrets (current state)
gh secret list --repo drosser895-eng/setlist-sleuth

# 8. Check env secrets
gh secret list --repo drosser895-eng/setlist-sleuth --env validation-approval

# 9. (Optional) Remove repo secret after env-secret verified
gh secret remove HF_API_KEY --repo drosser895-eng/setlist-sleuth

# 10. View Issue #12
open "https://github.com/drosser895-eng/setlist-sleuth/issues/12"
```

---

## What the Workflow Does

1. **Validate** — finds `blazetv_evidence_*.zip`, extracts & validates
2. **Approval** — pauses (unless you added reviewers; then requires approval)
3. **Generate** — calls Hugging Face to generate counsel email
4. **Post** — attaches validation + email to Issue #12

---

## Key Log Lines to Watch

**Validate job:**
- Look for: "Found evidence bundle" or "No evidence zip found"
- If ZIP missing: place `blazetv_evidence_*.zip` in repo root

**Post job:**
- Look for: "Generate counsel email via Hugging Face inference"
- Success: "✅ Email written to generated_counsel_email.txt"
- Error 401/403: Token missing permission or wrong value

**Final step:**
- Look for: "Posted validation results to Issue #12"
- Then check Issue #12 for comments & attachments

---

## Next Step

Run Steps 1–4 above on your machine, copy the RUN ID, and paste it here!

Example: `gh run list` output shows:
```
STATUS    TITLE                           RUN ID        CONCLUSION
...       Auto Validate, Approve & Upload  1719482039    in_progress
```

Paste: `1719482039` (or the full run URL)

Then I'll help you verify everything worked!
