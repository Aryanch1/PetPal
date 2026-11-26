import Constants from 'expo-constants';

/**
 * PetPal runtime config.
 *
 * Pet-care answers come from the Python serverless function api/ask.py:
 * POST /api/ask. On native, EXPO_PUBLIC_API_URL is the deployed origin;
 * on web the app calls the same-origin /api path. When no endpoint
 * answers, the app falls back to its on-device demo answerer
 * (lib/demoai.ts) and labels the answer DEMO — care is always available
 * either way, and nothing is ever presented as live when it is not.
 *
 * No Gemini key ever lives in this file or in app code; the key is
 * server-side only in api/ask.py (GEMINI_API_KEY env var).
 */

/** Deployed backend origin for native, or '' to use same-origin /api on web. */
export const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? '').trim().replace(/\/$/, '');

/**
 * Set to true once the Firebase project for PetPal exists and the values
 * in lib/firebase.ts / lib/firebase.native.ts are the real web config.
 * No project exists yet (2026-11-26) — TODO-PETPAL placeholders in both
 * files; wiring is a publish step. Until then the app runs in
 * local/guest mode with the full accounts screens ready in code.
 */
export const firebaseConfigured = false;

/** 'live' when the /api/ask endpoint answers, 'demo' while the on-device answerer is used. */
export const geminiMode: 'live' | 'demo' = 'demo';

/** App name and version — read from app.json, the single version source. */
export const appName: string = Constants.expoConfig?.name ?? 'PetPal';
export const appVersion: string = Constants.expoConfig?.version ?? '1.0.0';

/** Figma design file for PetPal (created before coding). */
export const figmaUrl = 'https://www.figma.com/design/e33tI2ZizXwo2ALnAqXsZG';
