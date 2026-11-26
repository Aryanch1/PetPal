# PetPal — Design

**Figma file:** https://www.figma.com/design/e33tI2ZizXwo2ALnAqXsZG — "PetPal — Daily App"
(Tokens & Components page + one frame per screen below, in flow order.)

## Identity — "warm playroom"

PetPal is the warm playroom of the daily-app series: cocoa brown walls, a
coral toy box, sunny yellow highlights, on a warm cream floor. Rounded and
friendly everywhere — paw prints are the recurring motif (paw icons as
bullets, paw chips, circular pet avatars). Nothing in the app looks like a
default template: the home is a pet carousel, not a list; the navigation is
a top segmented control, not a tab bar; detail screens are full-screen
takeovers with a big colored banner header.

**Distinct from BillBeacon** (the previous app): navy beacon board, flat
labeled bottom tabs, dark header board, Plus Jakarta Sans, amber beacon,
due-date timeline. PetPal shares none of it — no bottom tabs, no dark
header, no navy, no amber beacon, a different display font, a different
palette, a different home structure, and a different refresh motif.

## Tokens

| Token | Value | Role |
| --- | --- | --- |
| primary `#5C3D2E` | cocoa brown | Brand, segmented-tab selected state, headings |
| primaryDeep `#3E271C` | dark cocoa | Gradient end, Ask card |
| coral `#F26B4E` | coral | The one accent: primary CTAs, "next up", kicker text |
| sunny `#FFC53D` | sunny yellow | Highlight: paw chips, done-count pills, tennis ball |
| ground `#FFF7EF` | warm cream | App background |
| ink `#2B211B` | warm ink | Headlines, body text |
| leaf `#3E9B4F` | leaf green | Done / healthy states |
| radii | cards 30, sheets 38, pills fully round | Rounder than standard |
| display font | **Fredoka 600/700** (`@expo-google-fonts/fredoka`) | Headlines, screen titles, big numbers |

Previous display fonts, none reused: Sora, Fraunces, Bricolage Grotesque,
Archivo, Space Grotesk, DM Serif Display, Bebas Neue, Lora, Outfit, Bitter,
Plus Jakarta Sans.

## Screen inventory + flow

1. **Splash** — cream screen, coral paw mark, "PetPal" in Fredoka. Fades into
   the gate.
2. **Welcome** — big paw + "PetPal / Every pet, cared for on time." Four ways
   in: Continue with Google · Create account · Log in · Continue without an
   account. Create → name/email/password/confirm with match check. Log in →
   email/password + Forgot password (reset email). Guest is per-visit only.
3. **Today (home)** — date kicker + Fredoka greeting, header gear (Settings)
   and refresh button; top segmented tabs (Today | Pets | Health); pet
   carousel (horizontal cards: photo or initial tile, name, breed, done-count
   pill; selected card gets a coral ring); "Next up" countdown strip (coral
   glass card, Mark done inline); big cocoa "Ask about your pet" card; today's
   care timeline with check-off circles. Checking a task shows "Done — nice
   work!" right on that row. ≥840dp: two-pane — timeline left, selected pet
   at a glance right.
4. **Pets panel** — same segmented tabs; pet rows (avatar, name, breed, age,
   weight, cares done today) opening the pet page; Add a pet CTA.
5. **Health panel** — pet picker chips; vaccinations due (with Done toggle);
   weight chart (bars scaled in grams so dogs, cats and budgies share one
   scale); vet visits list.
6. **Pet detail** — full-screen takeover; big colored banner header (tile
   color) with large photo/avatar, name, breed, age, weight, cares done;
   Ask + Add care actions; today's care with Done/Undo; vaccinations with
   Done/Undo; weight chart + log-weight row (confirmation appears in place);
   vet visits; Remove pet (confirm dialog).
7. **Ask AI** — disclaimer banner on top ("not veterinary advice, ask your
   vet"), pet picker chips, question input, suggested-question chips, skeleton
   loaders + bouncing dots while answering, answer card with LIVE/DEMO badge
   and the demo note when on-device.
8. **Add/edit pet** — name, species chips, breed, age, weight + kg/g chips,
   notes; validation errors in place; success note then opens the new pet.
9. **Add care task** — pet chips, title, kind chips, 24h time, notes;
   validation in place; success note then back to Today.
10. **Settings** — account card (guest → route to Welcome; signed-in →
    avatar, name, email, sign-in method, name edit, photo picker with
    client-side resize to base64, password-reset email, sign out); demo-data
    controls (hide/show, clear); history (view, clear); About (version read
    from app.json).
11. **History** — past questions, checked-off cares, weigh-ins; tap one to
    open its pet; clear-history control.
12. **Help** — how each tab works, accounts, and the veterinary disclaimer.
13. **Empty states** — no pets, no cares today, no vaccinations, no weigh-ins,
    unknown pet id; each with a next step. **Error states** — short question,
    bad time, bad weight, sign-in failure, answer failure; each with a plain
    message and a retry.

## Transition + animation plan

- App open: splash fades to Welcome/Today; cards rise in with a Reanimated
  spring stagger (60ms per card).
- Tab change (Today/Pets/Health): content swaps with a spring fade/slide;
  the selected segment slides its cocoa fill (spring, not a jump).
- Pet carousel: cards spring-scale on press (~0.95 + overshoot); selecting a
  pet pops its ring in.
- Check-off: circle fills leaf green with a spring pop; the row's title
  strikes through; "Done — nice work!" appears on the row.
- Pet detail: full-screen takeover slides in from the right; banner photo
  settles with a gentle spring.
- Ask: skeleton shimmer while waiting; answer card rises in with a spring;
  bouncing dots while the answer loads.
- Buttons: every tappable element springs to ~0.95 on press with overshoot;
  primary actions add a light haptic tap (mobile only); chips pop when
  selected.
- **Refresh (custom, never the stock spinner):** a tennis ball drops in and
  fills with coral as the finger pulls (scrubbed by pull distance); past the
  threshold, release plays its bounce loop while the day re-checks; content
  settles with a spring and cards re-enter staggered. On web the same
  animation runs from the header refresh button.
- Glass: every frosted surface is two-layer (outer view background + shadow,
  inner overflow-hidden view clipping the blur) — never a bare BlurView with
  elevation on Android.

## Responsive

Breakpoints via `useWindowDimensions`: <600 single column; 600–840 wider
cap; ≥840 two-pane (timeline left, pet detail right); ≥1280 centered shell.
Tap targets ≥44px everywhere; no horizontal scrolling; nothing clipped.

## Self-check — quality + distinctness vs BillBeacon

| Screen | Premium quality (8 rules) | Distinctness vs BillBeacon |
| --- | --- | --- |
| Today | 9/10 — bold Fredoka greeting, one coral accent, pill CTAs, carousel micro-components, big "next up" number | 10/10 — carousel + top tabs + coral/cream; no beacon board, no bottom tabs |
| Pets | 9/10 — round avatars, pill done-counts, generous whitespace | 10/10 — pet cards, not a bill list |
| Health | 8/10 — bar chart with big numbers, quiet labels | 9/10 — chart + vax list; no due-date strip |
| Pet detail | 9/10 — full-bleed colored banner, editorial composition | 10/10 — banner takeover; BillBeacon has no equivalent |
| Ask AI | 9/10 — cocoa card, disclaimer banner, skeleton loaders | 9/10 — chat-style, not a parser form |
| Welcome | 9/10 — huge Fredoka wordmark, paw hero, pill stack | 9/10 — warm playroom vs navy board |
| Settings/Help/History | 8/10 — same tokens, glass cards, clear hierarchy | 9/10 — same system, different subject |

No screen could be mistaken for BillBeacon: different palette, font,
navigation, home structure, and motif throughout.
