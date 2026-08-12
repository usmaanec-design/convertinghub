import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../config/firebase';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  guestToolUsageCount: number;
  incrementGuestUsage: () => void;
  showLoginPrompt: boolean;
  dismissLoginPrompt: () => void;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isGuest: true,
  loading: true,
  signInWithGoogle: async () => {},
  logout: async () => {},
  guestToolUsageCount: 0,
  incrementGuestUsage: () => {},
  showLoginPrompt: false,
  dismissLoginPrompt: () => {},
  authError: null,
  clearAuthError: () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [guestToolUsageCount, setGuestToolUsageCount] = useState<number>(() => {
    const saved = localStorage.getItem('guestToolUsageCount');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [promptDismissed, setPromptDismissed] = useState<boolean>(() => {
    return localStorage.getItem('googleLoginPromptDismissed') === 'true';
  });

  useEffect(() => {
    // Check redirect auth result if popup was bypassed or blocked
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log('[ConvertingHub Auth] Redirect login successful:', result.user.email);
        }
      })
      .catch((err) => {
        console.warn('[ConvertingHub Auth] Redirect result check error:', err);
      });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        setAuthError(null);
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          await setDoc(
            userRef,
            {
              displayName: currentUser.displayName || '',
              email: currentUser.email || '',
              photoURL: currentUser.photoURL || '',
              lastLoginAt: serverTimestamp()
            },
            { merge: true }
          );
        } catch (e) {
          console.warn('[ConvertingHub Auth] Firestore user profile sync notice:', e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleUsage = () => {
      if (auth.currentUser) return;
      setGuestToolUsageCount((prev) => {
        const updated = prev + 1;
        localStorage.setItem('guestToolUsageCount', updated.toString());
        return updated;
      });
    };

    window.addEventListener('toolUsageCompleted', handleUsage);
    return () => window.removeEventListener('toolUsageCompleted', handleUsage);
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      // First attempt: Popup auth flow
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('[ConvertingHub Auth] Google sign-in popup error:', error);
      const code = error?.code || '';

      if (code === 'auth/configuration-not-found' || code === 'auth/operation-not-allowed') {
        setAuthError(
          'Google Sign-In requires 1-click activation in Firebase Console. Go to Firebase Console -> Authentication -> Sign-in method -> Enable Google.'
        );
        return;
      }

      // If popup is blocked by browser COOP/COEP, attempt redirect flow
      if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user' || error?.message?.includes('Cross-Origin-Opener-Policy')) {
        try {
          console.log('[ConvertingHub Auth] Falling back to signInWithRedirect...');
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr: any) {
          console.error('[ConvertingHub Auth] Redirect auth error:', redirectErr);
        }
      }

      setAuthError(error.message || 'Failed to sign in with Google');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('[ConvertingHub Auth] Logout failed:', error);
    }
  };

  const incrementGuestUsage = () => {
    if (user) return;
    const updated = guestToolUsageCount + 1;
    setGuestToolUsageCount(updated);
    localStorage.setItem('guestToolUsageCount', updated.toString());
  };

  const dismissLoginPrompt = () => {
    setPromptDismissed(true);
    localStorage.setItem('googleLoginPromptDismissed', 'true');
  };

  const clearAuthError = () => setAuthError(null);

  const isAuthenticated = !!user;
  const isGuest = !user;
  const showLoginPrompt = isGuest && !promptDismissed && guestToolUsageCount >= 2;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isGuest,
        loading,
        signInWithGoogle,
        logout,
        guestToolUsageCount,
        incrementGuestUsage,
        showLoginPrompt,
        dismissLoginPrompt,
        authError,
        clearAuthError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
