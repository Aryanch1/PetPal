import { getApp, getApps, initializeApp } from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Firebase wiring for PetPal — web.
 *
 * No Firebase project exists yet (2026-11-26) — TODO-PETPAL
 * placeholders below for the publish step: create the project in the
 * Firebase Console (sign in with Continue with Google as
 * aryanch99999@gmail.com), enable Email/Password + Google sign-in
 * (email-link OFF), create Firestore with the repo's owner-only
 * firestore.rules, register the web app, and paste the real web config
 * here (and in firebase.native.ts), then set firebaseConfigured=true
 * in lib/config.ts. Until then the app runs in full local/guest mode.
 *
 * The config values are Firebase's public app identifiers — they are
 * designed to ship in client code. Access is controlled by Firebase
 * Authentication plus the Firestore security rules (each user can only
 * read and write their own /users/<uid> tree). No admin keys or secrets
 * live here; the Gemini key stays server-side in the /api/ask Python
 * function (GEMINI_API_KEY env var).
 *
 * Platform note: this file serves web (and tooling). Native builds use
 * firebase.native.ts instead, which imports the scoped @firebase/*
 * packages — the umbrella 'firebase/auth' entry has no React Native
 * build, so on Android/iOS it silently resolves to the browser build
 * whose sessions live in memory only and are lost when the app closes.
 * Every module imports its Auth/Firestore helpers from './firebase' so
 * each platform always gets one consistent set of Firebase modules.
 */
const firebaseConfig = {
  apiKey: 'TODO-PETPAL-apiKey',
  authDomain: 'TODO-PETPAL-authDomain',
  projectId: 'TODO-PETPAL-projectId',
  storageBucket: 'TODO-PETPAL-storageBucket',
  messagingSenderId: 'TODO-PETPAL-messagingSenderId',
  appId: 'TODO-PETPAL-appId',
};

/** OAuth web client ID for the native Google Sign-In flow (not a secret). */
export const GOOGLE_WEB_CLIENT_ID = 'TODO-PETPAL-webClientId';

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = firebaseAuth.getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

/** Plain-language report for Settings: accounts are not configured yet. */
export function firebaseStatusMessage(): string {
  return 'Accounts are not set up for this app yet — guest mode works fully until then.';
}

export {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  type User,
} from 'firebase/auth';

export {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
