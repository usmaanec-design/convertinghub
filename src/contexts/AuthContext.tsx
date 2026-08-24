import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut
} from 'firebase/auth';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../config/firebase';
import { getRatingState, getDownloadState } from '../utils/conversionTracker';
import { getBackendUrl } from '../utils/backendConfig';

export const isStandaloneApp = (): boolean => {
  if (typeof window === 'undefined') return false;

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isWCO = window.matchMedia(
    '(display-mode: window-controls-overlay)'
  ).matches;
  const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
  const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
  const isNavStandalone = (window.navigator as any).standalone === true;
  const isWebView = /\b(WebView|PWABuilder)\b/i.test(navigator.userAgent);

  return (
    isStandalone ||
    isWCO ||
    isMinimalUI ||
    isFullscreen ||
    isNavStandalone ||
    isWebView
  );
};

export interface TokenWalletData {
  dailyLimit: number;
  dailyUsed: number;
  bonusTokens: number;
  availableTokens: number;
  lastResetAt: number;
  resetCountdown: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isProUser: boolean;
  isGuest: boolean;
  loading: boolean;
  isSigningIn: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  guestToolUsageCount: number;
  incrementGuestUsage: () => void;
  showFirstLaunchDialog: boolean;
  dismissFirstLaunchDialog: (choice?: 'guest' | 'not_now') => void;
  showLoginPrompt: boolean;
  dismissLoginPrompt: () => void;
  authError: string | null;
  clearAuthError: () => void;
  tokenWallet: TokenWalletData | null;
  refreshTokens: () => Promise<void>;
  setProStatus: (isPro: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isProUser: false,
  isGuest: true,
  loading: true,
  isSigningIn: false,
  signInWithGoogle: async () => {},
  logout: async () => {},
  guestToolUsageCount: 0,
  incrementGuestUsage: () => {},
  showFirstLaunchDialog: false,
  dismissFirstLaunchDialog: () => {},
  showLoginPrompt: false,
  dismissLoginPrompt: () => {},
  authError: null,
  clearAuthError: () => {},
  tokenWallet: null,
  refreshTokens: async () => {},
  setProStatus: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [isProUser, setIsProUser] = useState<boolean>(() => {
    return localStorage.getItem('convertinghub_is_pro_user') === 'true';
  });

  const [tokenWallet, setTokenWallet] = useState<TokenWalletData | null>(null);

  const [guestToolUsageCount, setGuestToolUsageCount] = useState<number>(() => {
    const saved = localStorage.getItem('guestToolUsageCount');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [firstLaunchChoice, setFirstLaunchChoice] = useState<string | null>(
    () => {
      return localStorage.getItem('convertinghub_first_launch_choice');
    }
  );

  const [promptDismissed, setPromptDismissed] = useState<boolean>(() => {
    return localStorage.getItem('googleLoginPromptDismissed') === 'true';
  });

  // Calculate countdown to midnight UTC reset
  const getResetCountdownStr = (): string => {
    const now = new Date();
    const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const diffMs = tomorrow.getTime() - now.getTime();
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const refreshTokens = async () => {
    if (!isProUser && !user) {
      setTokenWallet(null);
      return;
    }

    try {
      const userId = user ? user.uid : 'test-pro-user';
      const res = await fetch(getBackendUrl('/api/tokens/balance'), {
        headers: {
          'x-user-id': userId,
          Authorization: user ? `Bearer ${user.uid}` : 'Bearer guest'
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.wallet) {
          const w = data.wallet;
          setTokenWallet({
            dailyLimit: w.dailyLimit || 10,
            dailyUsed: w.dailyUsed || 0,
            bonusTokens: w.bonusTokens || 0,
            availableTokens: w.availableTokens ?? Math.max(0, (w.dailyLimit || 10) - (w.dailyUsed || 0)) + (w.bonusTokens || 0),
            lastResetAt: w.lastResetAt || Date.now(),
            resetCountdown: getResetCountdownStr()
          });
        }
      }
    } catch (e) {
      // Fallback wallet if bridge backend is starting
      setTokenWallet((prev) => prev || {
        dailyLimit: 10,
        dailyUsed: 3,
        bonusTokens: 0,
        availableTokens: 7,
        lastResetAt: Date.now(),
        resetCountdown: getResetCountdownStr()
      });
    }
  };

  // Timer countdown updater for active Pro user token wallet
  useEffect(() => {
    if (!isProUser) {
      setTokenWallet(null);
      return;
    }

    refreshTokens();

    const timer = setInterval(() => {
      setTokenWallet((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          resetCountdown: getResetCountdownStr()
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isProUser, user]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    // Process redirect result when user returns from Google OAuth redirect flow
    getRedirectResult(auth)
      .then((result) => {
        if (!isMounted) return;
        if (result?.user) {
          console.log(
            '[ConvertingHub Auth] Redirect login successful:',
            result.user.email
          );
          setUser(result.user);
        }
      })
      .catch((err: any) => {
        console.warn('[ConvertingHub Auth] Redirect result check notice:', err);
        if (isMounted) {
          const code = err?.code || '';
          if (
            code &&
            code !== 'auth/popup-closed-by-user' &&
            code !== 'auth/cancelled-popup-request'
          ) {
            handleAuthError(err);
          }
        }
      });

    // Single source of truth for Auth state
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return;
      console.log(
        '[ConvertingHub Auth] onAuthStateChanged:',
        currentUser ? currentUser.email : 'Logged Out'
      );
      setUser(currentUser);
      setLoading(false);
      setIsSigningIn(false);

      if (currentUser) {
        setAuthError(null);
        localStorage.setItem('convertinghub_first_launch_choice', 'google');
        setFirstLaunchChoice('google');

        try {
          const ratingState = getRatingState();
          const downloadState = getDownloadState();

          const userRef = doc(db, 'users', currentUser.uid);
          await setDoc(
            userRef,
            {
              displayName: currentUser.displayName || '',
              email: currentUser.email || '',
              photoURL: currentUser.photoURL || '',
              hasRated: ratingState.hasRated,
              downloadCount: downloadState.downloadCount,
              downloadPeriodStart: downloadState.downloadPeriodStart,
              lastLoginAt: serverTimestamp()
            },
            { merge: true }
          );
        } catch (e) {
          console.warn(
            '[ConvertingHub Auth] Firestore user profile sync notice:',
            e
          );
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribeAuth();
    };
  }, []);

  // Real-time Firestore snapshot listener for user document plan/subscription changes
  useEffect(() => {
    if (!user) {
      // Respect local pro override for testing if set
      const localPro = localStorage.getItem('convertinghub_is_pro_user') === 'true';
      setIsProUser(localPro);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const unsubscribeSnapshot = onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const isPro = data.plan === 'pro' || data.subscription?.status === 'active';
          setIsProUser(isPro);
          localStorage.setItem('convertinghub_is_pro_user', isPro ? 'true' : 'false');
          if (isPro) {
            refreshTokens();
          } else {
            setTokenWallet(null);
          }
        }
      },
      (err) => {
        console.warn('[ConvertingHub Auth] User document snapshot listener notice:', err);
      }
    );

    return () => unsubscribeSnapshot();
  }, [user]);

  const setProStatus = async (isPro: boolean) => {
    setIsProUser(isPro);
    localStorage.setItem('convertinghub_is_pro_user', isPro ? 'true' : 'false');

    const userId = user ? user.uid : 'test-pro-user';
    try {
      await fetch(getBackendUrl('/api/tokens/set-plan'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, plan: isPro ? 'pro' : 'free' })
      });
    } catch (e) {}

    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { plan: isPro ? 'pro' : 'free' }, { merge: true });
      } catch (e) {}
    }

    if (isPro) {
      await refreshTokens();
    } else {
      setTokenWallet(null);
    }
  };

  const handleAuthError = (error: any) => {
    console.warn('[ConvertingHub Auth] Auth error detail:', error);
    const code = error?.code || '';
    let userMsg = "We couldn't complete Google sign-in. Please try again.";

    if (
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request'
    ) {
      userMsg = 'Google sign-in was cancelled. You can try again whenever you’re ready.';
    } else if (code === 'auth/popup-blocked') {
      userMsg = 'Popup blocked by browser. Please enable popups or try again.';
    } else if (code === 'auth/network-request-failed') {
      userMsg = 'Network error. Please check your internet connection and try again.';
    }

    setAuthError(userMsg);
  };

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
    if (isSigningIn) return;
    setIsSigningIn(true);
    setAuthError(null);

    console.log('[ConvertingHub Auth] Initiating Google Sign-In...');

    try {
      // First attempt signInWithPopup (works seamlessly without full-page state loss on mobile Chrome/Safari)
      const res = await signInWithPopup(auth, googleProvider);
      console.log('[ConvertingHub Auth] Popup login successful:', res.user.email);
      setUser(res.user);
      setIsSigningIn(false);
    } catch (error: any) {
      console.warn('[ConvertingHub Auth] Popup auth notice/error:', error?.code || error);
      
      const code = error?.code || '';
      if (
        code === 'auth/popup-blocked' ||
        code === 'auth/operation-not-supported-in-this-environment' ||
        code === 'auth/cancelled-popup-request' ||
        isStandaloneApp()
      ) {
        console.log('[ConvertingHub Auth] Redirecting to Google OAuth via signInWithRedirect...');
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (e2: any) {
          console.error('[ConvertingHub Auth] Redirect error:', e2);
          setIsSigningIn(false);
          handleAuthError(e2);
        }
      } else if (code === 'auth/popup-closed-by-user') {
        setIsSigningIn(false);
        setAuthError('Google sign-in was cancelled. You can try again whenever you’re ready.');
      } else {
        setIsSigningIn(false);
        handleAuthError(error);
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setAuthError(null);
      setIsProUser(false);
      setTokenWallet(null);
      localStorage.setItem('convertinghub_is_pro_user', 'false');
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

  const dismissFirstLaunchDialog = (choice: 'guest' | 'not_now' = 'guest') => {
    setFirstLaunchChoice(choice);
    localStorage.setItem('convertinghub_first_launch_choice', choice);
  };

  const dismissLoginPrompt = () => {
    setPromptDismissed(true);
    localStorage.setItem('googleLoginPromptDismissed', 'true');
  };

  const clearAuthError = () => setAuthError(null);

  const isAuthenticated = !!user;
  const isGuest = !user;

  const showFirstLaunchDialog = isGuest && !loading && !firstLaunchChoice;
  const showLoginPrompt =
    isGuest && !loading && !promptDismissed && guestToolUsageCount >= 4;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isProUser,
        isGuest,
        loading,
        isSigningIn,
        signInWithGoogle,
        logout,
        guestToolUsageCount,
        incrementGuestUsage,
        showFirstLaunchDialog,
        dismissFirstLaunchDialog,
        showLoginPrompt,
        dismissLoginPrompt,
        authError,
        clearAuthError,
        tokenWallet,
        refreshTokens,
        setProStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
