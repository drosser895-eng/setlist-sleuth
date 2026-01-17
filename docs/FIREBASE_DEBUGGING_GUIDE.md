# Firebase Debugging Guide

This guide covers common Firebase issues encountered during the BlazeTV deployment and how to resolve them.

## 1. Authentication Issues (`auth/invalid-credential`)

### Symptoms
- "Login error: auth/invalid-credential" in the console.
- Failed login attempts even with correct user credentials.
- `GET https://identitytoolkit.googleapis.com/... 400 (Bad Request)`

### Causes
- **Mismatched API Key**: The `VITE_FIREBASE_API_KEY` in `.env` does not match the project being accessed.
- **Project Mismatch**: The app is configured with Project A credentials but hosted on Project B's domain.

### Solutions
1. Verify the API Key in the Firebase Console under **Project Settings > General**.
2. Ensure the `.env` file contains the correct `VITE_FIREBASE_API_KEY` for the active project.
3. If using multiple environments (Staging/Production), ensure the correct `.env` file is being loaded during the build.

---

## 2. OAuth Domain Not Authorized

### Symptoms
- `Info: The current domain is not authorized for OAuth operations.`
- `signInWithPopup` or `signInWithRedirect` fails instantly.

### Causes
- The deployment domain (e.g., `dj-blaze-mix-master.web.app`) is not in the "Authorized Domains" list.

### Solutions
1. Go to the **Firebase Console**.
2. Navigate to **Authentication > Settings > Authorized Domains**.
3. Add your production domain (e.g., `dj-blaze-mix-master.web.app`) and the default Firebase domain (`dj-blaze-mix-master.firebaseapp.com`).

---

## 3. Firestore Permission Denied

### Symptoms
- `FirebaseError: [code=permission-denied]: Missing or insufficient permissions.`
- UI components fail to load data from Firestore.

### Causes
- `firestore.rules` are too restrictive (e.g., blocking reads/writes for specific collections).
- User is not authenticated when performing an action that requires auth.

### Solutions
1. Review `firestore.rules`.
2. Ensure new collections (like `watch_events`) have explicit rules.
   ```firestore-rules
   match /watch_events/{eventId} {
     allow create: if true; // Allow public analytics if required
     allow read: if request.auth != null;
   }
   ```
3. Use the **Firestore Rules Playground** in the Firebase Console to test specific paths.

---

## 4. Resource Blocked (`ERR_BLOCKED_BY_CLIENT`)

### Symptoms
- `Failed to load resource: net::ERR_BLOCKED_BY_CLIENT`

### Causes
- Browser extensions (Ad-blockers, Privacy guards) are blocking Firebase or GTM scripts.

### Solutions
1. Disable ad-blockers for testing.
2. Check if the block is targetting `google-analytics.com` or `firebase.io`.
