import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Safe singleton Firebase initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.modify',
];

const provider = new GoogleAuthProvider();
GMAIL_SCOPES.forEach((scope) => provider.addScope(scope));

const TOKEN_STORAGE_KEY = 'stripe_hub_google_access_token';

// Retrieve cached access token from memory or browser storage
let cachedAccessToken: string | null = null;
try {
  if (typeof window !== 'undefined') {
    cachedAccessToken = sessionStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem(TOKEN_STORAGE_KEY);
  }
} catch (_e) {}

let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  try {
    return onAuthStateChanged(
      auth,
      async (user: User | null) => {
        try {
          if (user) {
            let token = cachedAccessToken;
            if (!token && typeof window !== 'undefined') {
              token = sessionStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem(TOKEN_STORAGE_KEY);
            }
            if (token) {
              cachedAccessToken = token;
              if (onAuthSuccess) onAuthSuccess(user, token);
            } else {
              // Firebase user exists; pass empty token to maintain login UI state
              if (onAuthSuccess) onAuthSuccess(user, '');
            }
          } else {
            cachedAccessToken = null;
            if (onAuthFailure) onAuthFailure();
          }
        } catch (innerErr) {
          console.warn('Auth callback notice:', innerErr);
        }
      },
      (err) => {
        console.warn('onAuthStateChanged error:', err);
        if (onAuthFailure) onAuthFailure();
      }
    );
  } catch (err) {
    console.warn('Failed to attach Firebase onAuthStateChanged listener:', err);
    if (onAuthFailure) onAuthFailure();
    return () => {};
  }
};

export const isAuthCancellationError = (error: any): boolean => {
  if (!error) return false;
  const code = typeof error === 'object' && error.code ? error.code : '';
  const message = typeof error === 'object' && error.message ? error.message : String(error || '');
  return (
    code === 'auth/popup-closed-by-user' ||
    code === 'auth/cancelled-popup-request' ||
    message.includes('popup-closed-by-user') ||
    message.includes('cancelled-popup-request')
  );
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  if (isSigningIn) {
    return null;
  }
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    let token = credential?.accessToken || null;
    if (!token && result.user) {
      try {
        token = await result.user.getIdToken();
      } catch (_idTokenErr) {
        token = '';
      }
    }

    cachedAccessToken = token;
    try {
      if (typeof window !== 'undefined' && token) {
        sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
      }
    } catch (_e) {}

    return { user: result.user, accessToken: token || '' };
  } catch (error: any) {
    if (isAuthCancellationError(error)) {
      // User closed or dismissed the popup; handle gracefully without console.error
      return null;
    }

    if (error?.code === 'auth/popup-blocked') {
      console.warn('Google sign-in popup was blocked by browser settings.');
      throw new Error(
        'ব্রাউজার পপ-আপ ব্লক করেছে। অনুগ্রহ করে ব্রাউজার সেটিংসে পপ-আপ অনুমোদন করুন।'
      );
    }

    console.warn('Google Sign-in encountered an issue:', error?.message || error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const logout = async (): Promise<void> => {
  try {
    cachedAccessToken = null;
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch (_e) {}
    await signOut(auth);
  } catch (error: any) {
    console.warn('Firebase sign-out notice:', error?.message || error);
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;
  try {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem(TOKEN_STORAGE_KEY);
      if (stored) {
        cachedAccessToken = stored;
        return stored;
      }
    }
  } catch (_e) {}
  return null;
};

export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  try {
    if (typeof window !== 'undefined') {
      if (token) {
        sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
      } else {
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    }
  } catch (_e) {}
};
