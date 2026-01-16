# Quick Reference: GitHub Actions Workflow Setup

## ⚡ TL;DR — 5 Minutes to Enable

### 1️⃣ Create Approval Environment (2 min)
```
Settings → Environments → New environment
  Name: validation-approval
  Add Required reviewers: (your GitHub username or team)
  Save
```

### 2️⃣ Add HF API Token Secret (2 min)
```
Settings → Secrets and variables → Actions → New repository secret
  Name: HF_API_KEY
  Value: hf_xxxxxxxxxxxxxxxxxxx (from https://huggingface.co/settings/tokens)
  Add secret
```

### 3️⃣ Files Already Committed ✅
```
✅ .github/workflows/auto-validate-and-upload.yml
✅ scripts/extract_roots.py
✅ scripts/generate_counsel_email.py
✅ WORKFLOW_SETUP_GUIDE.md (full docs)
```

---

## 🚀 How to Use

### Manual Trigger:
```
Actions → "Auto Validate, Approve & Upload" → Run workflow
  (optional: enter custom issue number)
```

### On Pull Request:
```
Automatically runs when PR created/updated on main
```

### Workflow Pauses at Approval:
```
Actions → click running workflow → Review deployments
  Select: validation-approval
  Comment: "Approved"
  Click: Approve and deploy
```

---

## 📧 What You Get

**Issue #12 Comments:**
- ✅ Validation output (files, harness, proofs)
- ✅ AI-generated counsel email (via Hugging Face)
- ✅ Attached evidence bundle ZIP
- ✅ Proof summary TSV

**Then:**
- Send generated email to counsel/PSP
- Request sign-off (24-48 hours)
- Upon approval → deploy to production

---

## 🔧 Configuration

**Change LLM model:**
```yaml
# Edit: .github/workflows/auto-validate-and-upload.yml
env:
  HF_MODEL: 'mistralai/Mistral-7B'  # or any HF model
```

**Change default issue:**
```yaml
env:
  DEFAULT_ISSUE: '15'  # instead of 12
```

---

## ❌ Troubleshooting

| Problem | Solution |
|---------|----------|
| "No evidence zip found" | Place `blazetv_evidence_*.zip` in repo root |
| Approval job hangs | Set Required reviewers in Environment |
| "HF_API_KEY not set" | Add secret in Settings → Secrets |
| Generated email wrong | Manually edit before sending, or change HF_MODEL |

---

## 📚 Full Guide
See: `WORKFLOW_SETUP_GUIDE.md` in repo root

---

**Status:** ✅ Ready to use!

**Next:** 
1. Create `validation-approval` environment
2. Add `HF_API_KEY` secret
3. Test by running workflow manually
