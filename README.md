# PetPal — Every pet, cared for on time

PetPal is a warm daily companion for pet owners. Feeding, walks, medication
and vet visits live on one friendly timeline, so no pet in the house ever
misses a care. Add your pets, check off each care as you do it, track
vaccinations and weight, and ask kind pet-care questions in plain words.

**Figma design:** https://www.figma.com/design/e33tI2ZizXwo2ALnAqXsZG
**Live web app:** coming soon — the live link will be added here once deployed.
**License:** MIT — Copyright (c) 2026 Aryanmouli Cherupalli

## Who it helps

- Busy pet owners juggling several pets and their different routines.
- Families sharing care — everyone sees the same timeline and what is done.
- New pet owners who want gentle, plain-language guidance without guessing.
- Owners tracking weight and vaccinations between vet visits.

## Features

- **Today timeline** — feeding, walks, medication, grooming, play and vet
  visits for today, with check-off and a "Next up" countdown strip.
- **Pet profiles** — photo or warm initial tile, breed, age, weight and notes;
  a horizontal pet-switcher carousel on the home screen.
- **Ask about your pet** — kind pet-care answers with a clear "not veterinary
  advice, ask your vet" disclaimer on every AI screen, and an honest LIVE /
  DEMO label on every answer.
- **Health** — vaccination schedule with due dates, a weight chart over time,
  and a vet-visit list.
- **Accounts** — sign in with Google or email, or continue as a guest for one
  visit. Signed-in users stay signed in; profile photo, display name and
  password reset live in Settings. Data is per-user only.
- **History** — past questions, checked-off cares and weigh-ins, saved for
  one-tap re-use, with a clear-history control.
- **Demo data** — Milo (Golden Retriever, 3y, 28 kg), Luna (Tabby cat, 2y,
  4.5 kg) and Kiwi (Budgie, 1y, 35 g) come pre-loaded so the app can be tried
  right away. Demo data is clearly labelled and clearable from Settings.

## Tech stack

- React Native + Expo (SDK 58) + TypeScript, one codebase for Android, iOS
  and web (expo-router).
- Python serverless backend (`api/ask.py`) calling Google Gemini
  (`gemini-3.5-flash-lite`) — key server-side only. On-device demo answerer
  when the endpoint is not configured.
- Firebase Authentication + Firestore for accounts and per-user data
  (owner-only rules in `firestore.rules`).
- Reanimated spring animations, expo-blur frosted glass, expo-haptics press
  feedback, Fredoka display type.

## How to run

```bash
npm install
npm run typecheck   # tsc --noEmit
npm run lint
npm start           # Expo dev server (Android / iOS / web)
npm run web         # web only
npx expo export --platform web      # static web build in dist/
npx expo export --platform android  # Android bundle check
```

Set `GEMINI_API_KEY` in the deployment environment (Vercel) for live
pet-care answers; without it the app runs in honest demo mode and says so.
For Firebase accounts, create a project, enable Email/Password + Google
sign-in, and replace the `TODO-PETPAL` placeholders in
`lib/firebase.ts` / `lib/firebase.native.ts`, then set
`firebaseConfigured = true` in `lib/config.ts`.

## License

MIT License — Copyright (c) 2026 Aryanmouli Cherupalli. See `LICENSE`.
