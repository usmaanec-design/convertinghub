import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const getAuthDomain = () => {
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const host = window.location.hostname;
    if (host.endsWith('web.app') || host.endsWith('convertinghub.app') || host.endsWith('firebaseapp.com')) {
      return host;
    }
  }
  return import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'convertinghub-official.firebaseapp.com';
};

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    'AIzaSyDVBvzaEv3t6kY1vGzk7aa7Zp9hy6OmsbQ',
  authDomain: getAuthDomain(),
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID || 'convertinghub-official',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    'convertinghub-official.firebasestorage.app',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1054539236517',
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    '1:1054539236517:web:1f27aeb7a64a7fa500b94c'
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Ensure local persistence across app restarts, PWAs & WebView2
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('[ConvertingHub Auth] Persistence setup notice:', err);
});

export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
