import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  isSubscriber: boolean;
  subscriptionPlan: string | null;
  refreshSubscription: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);

  const refreshSubscription = async () => {
    const curr = auth.currentUser;
    if (!curr) return;
    try {
      const userRef = doc(db, 'users', curr.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        setIsSubscriber(!!data.isSubscriber);
        setSubscriptionPlan(data.subscriptionPlan ?? null);
      }
    } catch (e) {
      console.error("Failed to refreshSubscription:", e);
    }
  };

  useEffect(() => {
    // Check for redirect result on mount
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log("Redirect sign-in successful");
        }
      } catch (err: any) {
        console.error("Redirect Error:", err);
        setError(err.message);
      }
    };
    checkRedirect();

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      try {
        setUser(u);
        if (u) {
          // Ensure user document exists
          const userRef = doc(db, 'users', u.uid);
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            await setDoc(userRef, {
              uid: u.uid,
              email: u.email,
              name: u.displayName,
              photoURL: u.photoURL,
              updatedAt: serverTimestamp(),
              weakTopics: [],
              identifiedMistakes: [],
              examPapersAnalysis: [],
              lastExamScore: '',
              isSubscriber: false,
              subscriptionPlan: 'trial'
            });
            setIsSubscriber(false);
            setSubscriptionPlan('trial');
          } else {
            const data = userDoc.data();
            setIsSubscriber(!!data.isSubscriber);
            setSubscriptionPlan(data.subscriptionPlan ?? 'trial');
          }
        } else {
          setIsSubscriber(false);
          setSubscriptionPlan(null);
        }
      } catch (error) {
        console.error("Firebase Auth Init Error:", error);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    setError(null);
    try {
      // First try popup
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.warn("Popup blocked or failed, trying redirect:", err);
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request' || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        try {
          await signInWithRedirect(auth, provider);
        } catch (redirErr: any) {
          console.error("Redirect Login Error:", redirErr);
          setError("Gagal untuk log masuk. Sila gunakan pelayar luaran (Safari/Chrome).");
        }
      } else {
        setError("Masalah log masuk: " + err.message);
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <FirebaseContext.Provider value={{ user, loading, error, signIn, logout, isSubscriber, subscriptionPlan, refreshSubscription }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
