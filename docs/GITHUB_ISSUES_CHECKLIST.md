# Firebase Configuration Checklist (GitHub Issues)

Use these to track manual production alignment tasks.

## Issue 1: Align Firebase Environment Variables
**Assignee:** @user
**Priority:** High
**Description:** Update production `.env` files with credentials for the `dj-blaze-mix-master-6288e` project.
- [ ] Set `VITE_FIREBASE_API_KEY` to production key.
- [ ] Update `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, etc.
- [ ] Sync with CI/CD secrets.

## Issue 2: Authorize Production Domains
**Assignee:** @user
**Priority:** High
**Description:** Add the production domain to Firebase Authentication.
- [ ] Add `dj-blaze-mix-master.web.app` to Authorized Domains in Firebase Console.
- [ ] Add `dj-blaze-mix-master.firebaseapp.com` to Authorized Domains.
- [ ] Verify OAuth redirect domains matches.

## Issue 3: Verify Firestore Rule Deployment
**Assignee:** @user / @agent
**Priority:** Medium
**Description:** Ensure the updated `firestore.rules` are deployed to the `dj-blaze-mix-master-6288e` project.
- [ ] Run `firebase deploy --only firestore:rules`.
- [ ] Test `watch_events` write access using Firestore Playground.

## Issue 4: End-to-End Validation
**Assignee:** @agent
**Priority:** High
**Description:** Perform final verification once credentials are aligned.
- [ ] Confirm successful login on `web.app`.
- [ ] Verify video discovery feed loads without permission errors.
- [ ] Confirm analytics reporting.
