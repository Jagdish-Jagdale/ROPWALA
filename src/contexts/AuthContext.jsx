import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth, db } from "../lib/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { ROLES } from "../utils/roles";

const AuthContext = createContext(null);

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
      setUser(u);
      try {
        // First check users collection
        const userRef = doc(db, "users", u.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data.status === "inactive") {
            await signOut(auth);
            setUser(null);
            setRole(null);
            setLoading(false);
            return;
          }
          if (data.role === ROLES.ADMIN) {
            setRole(data.role);
          } else {
            // Sign out users with other roles (defunct owner/user roles)
            await signOut(auth);
            setUser(null);
            setRole(null);
          }
        } else {
          // If user doesn't exist in users collection, they shouldn't have access
          await signOut(auth);
          setUser(null);
          setRole(null);
        }
      } catch (e) {
        console.error("Error fetching user role:", e);
        // CRITICAL SECURITY FIX: Do NOT default to ADMIN on error
        // Invalid or error state should not grant privileges
        setRole(null);
        // Force sign out to prevents redirect loops and ensure security
        signOut(auth).catch(err => console.error("Error signing out:", err));
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Check users collection
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      if (data.status === "inactive") {
        await signOut(auth);
        throw new Error("Account Inactive: Access is currently restricted. Please contact support.");
      }
      if (data.role !== ROLES.ADMIN) {
        await signOut(auth);
        throw new Error("Access Denied: Only administrators can access this panel.");
      }
      return userCredential;
    }

    // If not in users collection, they might be an old owner/user - deny access
    await signOut(auth);
    throw new Error("Access Denied: Your account type is no longer supported.");

    return userCredential;
  };
  const register = async (email, password, profile = {}) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const ref = doc(db, "users", cred.user.uid);
    await setDoc(
      ref,
      {
        uid: cred.user.uid,
        email,
        password,
        // Default role is no longer USER
        createdAt: serverTimestamp(),
        ...profile,
      },
      { merge: true }
    );
    return cred;
  };
  const logout = () => signOut(auth);

  const value = useMemo(
    () => ({
      user,
      role,
      loading,
      login,
      register,
      logout,
      isAdmin: role === ROLES.ADMIN,
      isSuperAdmin: role === ROLES.ADMIN, // Alias for backward compatibility
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
