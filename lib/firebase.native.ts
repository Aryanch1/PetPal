import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from '@firebase/app';
import * as firebaseAuth from '@firebase/auth';
import { getFirestore } from '@firebase/firestore';

/**
 * Firebase wiring for PetPal — native (Android/iOS). Metro picks this
 * file over firebase.ts on native.
 *
 * Native imports the scoped @firebase/* packages on purpose: they ship
 * a real React Native build (the umbrella 'firebase/auth' entry does
 * not — it resolves to the browser build, whose sessions are kept in
 * memory only, so users were signed out every time the app closed).
 *
 * No Firebase project exists yet (2026-11-26) — TODO-PETPAL
 * placeholders for the publish step (see lib/firebase.ts). Until the
 * real config lands, the app runs in full local/guest mode.
 *
 * The config values below are Firebase's public app identifiers — they
 * are designed to ship in client code. Access is controlled by Firebase
 * Authentication plus the Firestore security rules (each user can only
 * read and write their own /users/<uid> tree). No admin keys or secrets
 * live here; the Gemini key stays server-side in the /api/ask Python
 * function (GEMINI_API_KEY env var).
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

function createAuth(): firebaseAuth.Auth {
  // Persist the session in AsyncStorage so the user stays signed in
  // between app launches, like every other app.
  const getPersistence = (
    firebaseAuth as unknown as {
      getReactNativePersistence?: (storage: unknown) => firebaseAuth.Persistence;
    }
  ).getReactNativePersistence;
  if (getPersistence) {
    try {
      return firebaseAuth.initializeAuth(firebaseApp, {
        persistence: getPersistence(AsyncStorage),
      });
    } catch {
      // Already initialized (fast refresh) — fall through to getAuth.
    }
  }
  return firebaseAuth.getAuth(firebaseApp);
}

export const auth = createAuth();
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
} from '@firebase/auth';

export {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from '@firebase/firestore';
