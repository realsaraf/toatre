import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signInWithPhoneNumber,
  type ApplicationVerifier,
  type UserCredential,
  type Auth,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Return (or create) the Firebase client app.
 * Called lazily — never at module evaluation time — so Next.js SSR/RSC
 * passes don't throw when NEXT_PUBLIC_* env vars are absent on the server.
 */
function getClientApp(): FirebaseApp {
  if (getApps().length > 0) return getApps()[0]!;
  return initializeApp(firebaseConfig);
}

/** Lazy Firebase Auth singleton — safe to call only on the client. */
let _auth: Auth | null = null;
export function getClientAuth(): Auth {
  if (!_auth) {
    _auth = getAuth(getClientApp());
  }
  return _auth;
}

/** The Firebase app instance (lazy). */
export const firebaseApp = {
  get current(): FirebaseApp {
    return getClientApp();
  },
};

/** Sign in with Google via popup. */
export async function signInWithGoogle(): Promise<UserCredential> {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(getClientAuth(), provider);
}

/**
 * Send a magic-link email to the given address.
 * Stores the email in localStorage so the verify page can retrieve it.
 */
export async function sendEmailMagicLink(email: string): Promise<void> {
  const actionCodeSettings = {
    url: `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/login/verify`,
    handleCodeInApp: true,
  };
  await sendSignInLinkToEmail(getClientAuth(), email, actionCodeSettings);
  window.localStorage.setItem("toatre_magic_email", email);
}

/**
 * Complete magic-link sign-in on the verify page.
 * Retrieves the stored email from localStorage.
 */
export async function verifyEmailMagicLink(): Promise<UserCredential> {
  const href = window.location.href;
  if (!isSignInWithEmailLink(getClientAuth(), href)) {
    throw new Error("Not a valid sign-in link.");
  }
  const email = window.localStorage.getItem("toatre_magic_email") ?? "";
  if (!email) {
    throw new Error("Could not find the email address. Please sign in again.");
  }
  const result = await signInWithEmailLink(getClientAuth(), email, href);
  window.localStorage.removeItem("toatre_magic_email");
  return result;
}

/**
 * Start phone-number sign-in (sends OTP via Firebase + reCAPTCHA).
 * The returned ConfirmationResult is used to verify the code.
 */
export async function sendPhoneOtp(
  phone: string,
  recaptchaVerifier: ApplicationVerifier
) {
  return signInWithPhoneNumber(getClientAuth(), phone, recaptchaVerifier);
}
