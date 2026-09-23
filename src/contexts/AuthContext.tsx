import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  PhoneAuthProvider,
  linkWithCredential
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
  const isNavStandalone = (window.navigator as any).standalone === true;
  const isWebView = /\b(WebView|PWABuilder)\b/i.test(navigator.userAgent);

  return (
    isStandalone ||
    isWCO ||
    isMinimalUI ||
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
  sendPhoneOtp: (
    phoneNumber: string,
    recaptchaVerifier: RecaptchaVerifier
  ) => Promise<ConfirmationResult>;
  verifyPhoneOtp: (
    confirmationResult: ConfirmationResult,
    otp: string
  ) => Promise<User>;
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
  sendPhoneOtp: async () => {
    throw new Error('sendPhoneOtp not initialized');
  },
  verifyPhoneOtp: async () => {
    throw new Error('verifyPhoneOtp not initialized');
  },
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
              displayName:
                currentUser.displayName || currentUser.phoneNumber || '',
              email: currentUser.email || '',
              phoneNumber: currentUser.phoneNumber || '',
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
    let userMsg = "We couldn't complete sign-in. Please try again.";

    if (
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request'
    ) {
      userMsg = 'Sign-in was cancelled. You can try again whenever you’re ready.';
    } else if (code === 'auth/popup-blocked') {
      userMsg = 'Popup blocked by browser. Please enable popups or try again.';
    } else if (code === 'auth/network-request-failed') {
      userMsg = 'Network error. Please check your internet connection and try again.';
    } else if (code === 'auth/invalid-phone-number') {
      userMsg = 'Invalid phone number format. Please include country code (e.g. +1 or +92).';
    } else if (code === 'auth/missing-phone-number') {
      userMsg = 'Please enter a valid phone number.';
    } else if (code === 'auth/invalid-verification-code') {
      userMsg = 'Incorrect 6-digit verification code. Please check and try again.';
    } else if (code === 'auth/code-expired') {
      userMsg = 'Verification code has expired. Please request a new code.';
    } else if (code === 'auth/too-many-requests') {
      userMsg = 'Too many attempts. Please wait a few moments before trying again.';
    } else if (code === 'auth/captcha-check-failed') {
      userMsg = 'reCAPTCHA verification failed. Please try again.';
    } else if (code === 'auth/operation-not-allowed') {
      userMsg = 'Phone sign-in is currently disabled in your Firebase Console. Please enable "Phone" provider in Firebase Console > Authentication > Sign-in method.';
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

    console.log('[ConvertingHub Auth] Initiating Google Sign-In via popup...');

    try {
      const res = await signInWithPopup(auth, googleProvider);
      console.log('[ConvertingHub Auth] Popup login successful:', res.user.email);
      setUser(res.user);
    } catch (error: any) {
      console.warn('[ConvertingHub Auth] Popup auth notice/error:', error?.code || error);

      const code = error?.code || '';

      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request'
      ) {
        console.log('[ConvertingHub Auth] Popup closed or cancelled by user.');
        return;
      }

      if (code === 'auth/popup-blocked') {
        setAuthError('Popup was blocked by your browser. Please allow popups for this site to sign in with Google.');
      } else {
        handleAuthError(error);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const sendPhoneOtp = async (
    phoneNumber: string,
    recaptchaVerifier: RecaptchaVerifier
  ): Promise<ConfirmationResult> => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      console.log('[ConvertingHub Auth] Sending SMS OTP to:', phoneNumber);
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        recaptchaVerifier
      );
      console.log('[ConvertingHub Auth] SMS OTP sent successfully');
      return confirmationResult;
    } catch (err: any) {
      console.error('[ConvertingHub Auth] sendPhoneOtp error:', err);
      handleAuthError(err);
      throw err;
    } finally {
      setIsSigningIn(false);
    }
  };

  const verifyPhoneOtp = async (
    confirmationResult: ConfirmationResult,
    otp: string
  ): Promise<User> => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      console.log('[ConvertingHub Auth] Verifying SMS OTP...');
      // Provider linking: if user is already logged in with Google, link phone credential
      if (auth.currentUser && !auth.currentUser.isAnonymous) {
        try {
          const credential = PhoneAuthProvider.credential(
            confirmationResult.verificationId,
            otp
          );
          const linkResult = await linkWithCredential(
            auth.currentUser,
            credential
          );
          console.log(
            '[ConvertingHub Auth] Successfully linked phone to existing user:',
            linkResult.user.phoneNumber
          );
          setUser(linkResult.user);
          return linkResult.user;
        } catch (linkError: any) {
          if (linkError?.code !== 'auth/credential-already-in-use') {
            throw linkError;
          }
        }
      }

      const res = await confirmationResult.confirm(otp);
      console.log(
        '[ConvertingHub Auth] Phone verification successful:',
        res.user.phoneNumber
      );
      setUser(res.user);
      return res.user;
    } catch (err: any) {
      console.error('[ConvertingHub Auth] verifyPhoneOtp error:', err);
      handleAuthError(err);
      throw err;
    } finally {
      setIsSigningIn(false);
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
        sendPhoneOtp,
        verifyPhoneOtp,
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
