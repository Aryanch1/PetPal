import { useWindowDimensions } from 'react-native';

/**
 * PetPal design tokens — one consistent system for the whole app.
 *
 * Identity: "warm playroom". Cocoa brown (#5C3D2E) is the primary, coral
 * (#F26B4E) the accent, sunny yellow (#FFC53D) the highlight, on a warm
 * cream ground (#FFF7EF) with warm ink (#2B211B). Rounded and friendly
 * throughout: paw-print motif (paw icons as bullets, paw-shaped chips,
 * circular pet avatars), big soft cards, and a bouncing tennis ball as
 * the refresh motif. Fredoka (600/700) is the display face — deliberately
 * different from Plus Jakarta Sans (BillBeacon), Bitter (RecycleRight),
 * Outfit (SkillSwapLocal), Sora, Fraunces, Bricolage Grotesque, Archivo,
 * Space Grotesk, DM Serif Display, Bebas Neue and Lora.
 * Navigation is top segmented tabs (Today | Pets | Health) — no bottom
 * tab bar, no floating pill tab bar, no navy beacon board. Home leads
 * with a horizontal pet-switcher carousel, a "next up" countdown strip,
 * and today's care timeline with check-off. Detail screens are
 * full-screen takeovers with a big colored banner header.
 */

export const palette = {
  // Brand — warm cocoa brown, the playroom walls.
  primary: '#5C3D2E',
  primaryDeep: '#3E271C',
  primaryLight: '#8A6A54',
  primarySoft: '#EFE3D8',
  primaryPale: '#F7EDE3',
  // Coral — the one accent, for key CTAs and the "next up" strip.
  coral: '#F26B4E',
  coralDeep: '#D94E31',
  coralSoft: '#FDE4DC',
  // Sunny yellow — highlight for paws, chips and big numbers.
  sunny: '#FFC53D',
  sunnyDeep: '#E8A100',
  sunnySoft: '#FFF3D1',
  // Leaf green — done / healthy states.
  leaf: '#3E9B4F',
  leafDeep: '#2C7A3A',
  leafSoft: '#DFF2E2',
  // Status colors.
  overdue: '#D94E31',
  overdueSoft: '#FDE4DC',
  dueSoon: '#E8A100',
  dueSoonSoft: '#FFF3D1',
  done: '#3E9B4F',
  doneSoft: '#DFF2E2',
  // Ground — warm cream.
  ground: '#FFF7EF',
  // Neutrals (warm tinted so the whole UI feels one family).
  ink: '#2B211B',
  body: '#6B5B4F',
  muted: '#A08B7A',
  line: 'rgba(43, 33, 27, 0.10)',
  surface: '#FFFFFF',
  glass: 'rgba(255, 255, 255, 0.62)',
  glassStrong: 'rgba(255, 255, 255, 0.88)',
  sheet: 'rgba(255, 255, 255, 0.94)',
  // Playroom background stops — cream, cocoa tint, coral tint.
  aurora: ['#FFF7EF', '#F7EDE3', '#FDE4DC'] as const,
  warning: '#E8A100',
  warningSoft: '#FFF3D1',
  error: '#D94E31',
  errorSoft: '#FDE4DC',
  success: '#3E9B4F',
  successSoft: '#DFF2E2',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 12,
  md: 18,
  card: 30,
  sheet: 38,
  pill: 999,
  input: 24,
} as const;

/**
 * Display typeface — Fredoka (bundled via @expo-google-fonts/fredoka,
 * loaded in app/_layout.tsx). Used for headlines, screen titles and big
 * numbers; body text stays on the system font.
 */
export const font = {
  display: 'Fredoka_700Bold',
  bold: 'Fredoka_600SemiBold',
} as const;

export const type = {
  display: { fontFamily: font.display, fontSize: 40, lineHeight: 44, letterSpacing: -0.3 },
  displayWide: { fontFamily: font.display, fontSize: 52, lineHeight: 54, letterSpacing: -0.3 },
  title: { fontFamily: font.display, fontSize: 26, lineHeight: 32, letterSpacing: -0.2 },
  subtitle: { fontSize: 17, lineHeight: 24, fontWeight: '700' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '700' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const, letterSpacing: 0.6 },
  label: { fontSize: 11, lineHeight: 14, fontWeight: '700' as const, letterSpacing: 1.1 },
} as const;

export const shadows = {
  card: {
    shadowColor: '#2B211B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
  },
  glow: {
    shadowColor: '#5C3D2E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  coralGlow: {
    shadowColor: '#D94E31',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8,
  },
  float: {
    shadowColor: '#2B211B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
} as const;

export type Breakpoint = 'compact' | 'medium' | 'wide' | 'desktop';

export interface Responsive {
  breakpoint: Breakpoint;
  width: number;
  /** Max width for the centered content column. */
  contentMaxWidth: number;
  /** Horizontal page padding. */
  pad: number;
  /** Columns for card grids. */
  columns: number;
  /** Two-pane list + detail layout (foldable unfolded / tablet / desktop). */
  twoPane: boolean;
  display: typeof type.display | typeof type.displayWide;
}

export function useResponsive(): Responsive {
  const { width } = useWindowDimensions();
  if (width < 600) {
    return {
      breakpoint: 'compact',
      width,
      contentMaxWidth: width,
      pad: 20,
      columns: 1,
      twoPane: false,
      display: type.display,
    };
  }
  if (width < 840) {
    return {
      breakpoint: 'medium',
      width,
      contentMaxWidth: 640,
      pad: 28,
      columns: 1,
      twoPane: false,
      display: type.displayWide,
    };
  }
  if (width < 1280) {
    return {
      breakpoint: 'wide',
      width,
      contentMaxWidth: 1024,
      pad: 32,
      columns: 2,
      twoPane: true,
      display: type.displayWide,
    };
  }
  return {
    breakpoint: 'desktop',
    width,
    contentMaxWidth: 1120,
    pad: 40,
    columns: 3,
    twoPane: true,
    display: type.displayWide,
  };
}
