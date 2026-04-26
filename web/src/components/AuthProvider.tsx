"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { onIdTokenChanged, signOut as firebaseSignOut, type User } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Push the Firebase ID token to /api/auth/session to keep the HttpOnly
   * session cookie in sync with the Firebase auth state.  We await this
   * before setting loading:false so that any code that reads !loading && user
   * can trust the cookie is already written server-side.
   */
  const syncSession = useCallback(async (firebaseUser: User | null) => {
    if (firebaseUser) {
      try {
        const idToken = await firebaseUser.getIdToken();
        const res = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
        if (!res.ok) {
          console.error("[toatre] session sync failed:", res.status);
        }
      } catch (err) {
        console.error("[toatre] session sync error:", err);
      }
    } else {
      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } catch {
        // Non-fatal.
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(getClientAuth(), async (firebaseUser) => {
      setUser(firebaseUser);
      await syncSession(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, [syncSession]);

  const signOut = useCallback(async () => {
    await firebaseSignOut(getClientAuth());
    // syncSession(null) is called automatically by onIdTokenChanged above.
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook to access the current auth state anywhere in the client tree. */
export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
