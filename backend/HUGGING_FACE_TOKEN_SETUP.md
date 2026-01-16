# Hugging Face Token & GitHub Actions Setup — 5 Minutes

## ✅ Step A: Create Hugging Face Token (2 min)

1. Open: https://huggingface.co/settings/tokens
2. Click: **"New token"**
3. Fill in:
   - **Name:** `setlist-sleuth-actions`
   - **Type:** Select `read` (minimum for inference)
   - **Expiration:** 1 year or longer
4. Click: **"Create"**
5. **Copy token immediately** (you'll only see it once)
   - It starts with `hf_`

---

## ✅ Step B: Add Token to GitHub Actions Secret (2 min)

1. Go to: https://github.com/drosser895-eng/setlist-sleuth
2. Click: **Settings** tab
3. Left sidebar → **Secrets and variables** → **Actions**
4. Click: **"New repository secret"**
5. Fill in:
   - **Name:** `HF_API_KEY` (exactly)
   - **Value:** Paste your Hugging Face token
6. Click: **"Add secret"**

✅ Done! GitHub now has the token.

---

## ✅ Step C: Create validation-approval Environment (1 min)

1. In the same **Settings** tab
2. Left sidebar → **Environments**
3. Click: **"New environment"**
4. **Name:** `validation-approval` (exactly)
5. Click: **"Create environment"**
6. **Leave "Required reviewers" empty** (allows workflow to run immediately)
   - If you want manual approval later, add reviewers here

✅ Done! Workflow won't error on missing environment.

---

## ✅ Step D: Run the Workflow (1 min)

1. Go to: **Actions** tab
2. Find workflow: **"Auto Validate, Approve & Upload"**
3. Click: **"Run workflow"** dropdown (right side)
4. (Optional) Set `issue_number` to `12`
5. Click: **"Run workflow"** button

✅ Workflow started! Check the run logs.

---

## Optional: Test Token Locally (Before Adding to GitHub)

If you want to verify the token works before adding it to GitHub:

```bash
# Replace 'hf_xxxYOURTOKENxxx' with your actual token
export HF_API_KEY='hf_xxxYOURTOKENxxx'

# Test the token
curl -s -X POST \
  -H "Authorization: Bearer $HF_API_KEY" \
  -H "Content-Type: application/json" \
  --data '{"inputs":"Say hello in one sentence."}' \
  https://api-inference.huggingface.co/models/google/flan-ul2 | jq .

# Clean up
unset HF_API_KEY
```

**Expected output:** JSON with `generated_text` field
**Error (401/403):** Token lacks permission — go back and select "read" or "inference" scope

---

## Optional: Add Secret via GitHub CLI

If you have `gh` authenticated locally:

```bash
# Interactive and safe (token won't echo)
read -s -p "HF token: " HF_API_KEY && echo
gh secret set HF_API_KEY --repo drosser895-eng/setlist-sleuth --body "$HF_API_KEY"
unset HF_API_KEY
```

---

## ✅ After Setup: Verify Everything

```bash
# Check secret was created
gh secret list --repo drosser895-eng/setlist-sleuth

# You should see: HF_API_KEY ✓
```

---

## 🔐 Security Notes

- ✅ Do **not** paste token anywhere public
- ✅ Use only `read` or `inference` scope
- ✅ If leaked, revoke immediately in Hugging Face settings
- ✅ Token is masked in GitHub Actions logs

---

## 🎯 Next: Run the Workflow

Once you've completed Steps A–C above:

1. Commit evidence bundle to repo (or ensure it exists)
2. Go to **Actions** tab
3. Run the workflow manually
4. Check Issue #12 for generated counsel email

---

**Blocked?** Paste the workflow run URL here and I'll help debug the logs.
