"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { auth } from "@/lib/firebase/client";
import {
  onAuthStateChanged,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  OAuthProvider,
  sendSignInLinkToEmail,
  signOut as firebaseSignOut,
  User,
} from "firebase/auth";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /** Pending redirect-sign-in outcome consumed by the login page after a redirect. */
  pendingRedirect: { hasHandle: boolean } | null;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function createSession(user: User): Promise<{ hasHandle: boolean }> {
  const idToken = await user.getIdToken();
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) throw new Error("Session creation failed");
  const data = (await res.json()) as { ok: boolean; hasHandle: boolean };
  return { hasHandle: data.hasHandle ?? false };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingRedirect, setPendingRedirect] = useState<{ hasHandle: boolean } | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    // Consume the redirect result (if any) once on mount.
    let cancelled = false;
    (async () => {
      try {
        const result = await getRedirectResult(auth);
        if (cancelled) return;
        if (result?.user) {
          const { hasHandle } = await createSession(result.user);
          if (!cancelled) setPendingRedirect({ hasHandle });
        }
      } catch (e) {
        console.error("[auth] getRedirectResult failed", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signInWithGoogle = async (): Promise<void> => {
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
  };

  const signInWithApple = async (): Promise<void> => {
    const provider = new OAuthProvider("apple.com");
    await signInWithRedirect(auth, provider);
  };

  const sendMagicLink = async (email: string): Promise<void> => {
    await sendSignInLinkToEmail(auth, email, {
      url: `${window.location.origin}/auth/finish`,
      handleCodeInApp: true,
    });
    localStorage.setItem("toatre_email_for_link", email);
  };

  const signOut = async (): Promise<void> => {
    await firebaseSignOut(auth);
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setPendingRedirect(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        pendingRedirect,
        signInWithGoogle,
        signInWithApple,
        sendMagicLink,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
