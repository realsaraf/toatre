import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

// Use the current page's host as authDomain so Firebase serves the
// /__/auth/* iframe + handler from the SAME origin as the app.
// Combined with the rewrite in next.config.ts that proxies
// /__/auth/:path* → toatre-prod.firebaseapp.com, this avoids the
// third-party-cookie / iframe sessionStorage failure that breaks
// signInWithRedirect on modern Chrome when authDomain is the
// .firebaseapp.com subdomain.
//
// Firebase forces HTTPS for /__/auth/handler, so we ONLY apply this
// override on production HTTPS pages. On http://localhost dev we keep
// the env-supplied authDomain (which Firebase auto-allows for localhost).
const browserAuthDomain =
  typeof window !== "undefined" && window.location.protocol === "https:"
    ? window.location.host
    : undefined;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:
    browserAuthDomain ?? process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]!;

export const auth = getAuth(app);
export default app;
