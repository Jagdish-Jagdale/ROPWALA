import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth, db } from "../lib/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { ROLES } from "../utils/roles";

const AuthContext = createContext(null);

// Helper: check if UID exists in ownersoo (by uid field) or users (by doc ID)
async function isOwnerOrUser(uid) {
  const [ownerSnap, userSnap] = await Promise.all([
    getDocs(query(collection(db, "franchise"), where("uid", "==", uid))),
    getDoc(doc(db, "users", uid)),
  ]);
  return !ownerSnap.empty || userSnap.exists();
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const found = await isOwnerOrUser(u.uid);

        if (found) {
          // This account belongs to an owner/user — deny admin access
          await signOut(auth);
          setUser(null);
          setRole(null);
        } else {
          // Pure Firebase Auth account — grant admin access
          setUser(u);
          setRole(ROLES.ADMIN);
        }
      } catch (e) {
        console.error("Error checking user collections:", e);
        await signOut(auth);
        setUser(null);
        setRole(null);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const u = userCredential.user;

    const found = await isOwnerOrUser(u.uid);

    if (found) {
      await signOut(auth);
      throw new Error("Access Denied: This account does not have admin privileges.");
    }

    return userCredential;
  };

  const logout = () => signOut(auth);

  const value = useMemo(
    () => ({
      user,
      role,
      loading,
      login,
      logout,
      isAdmin: role === ROLES.ADMIN,
      isSuperAdmin: role === ROLES.ADMIN,
    }),
    [user, role, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
