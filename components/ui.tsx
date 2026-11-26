import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { palette, radii, shadows, spacing, type } from '../lib/theme';
import type { Pet } from '../lib/types';

/** Pet photos shipped in the app (generated portraits, no stock URLs). */
const PET_PHOTOS = {
  luna: require('../assets/luna.jpg'),
  kiwi: require('../assets/kiwi.jpg'),
} as const;

/** Light haptic tap on primary actions (mobile only, silent on web). */
export function tap() {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  }
}

/* ------------------------------------------------------------------ */
/* Pressable wrapper: spring scale to ~0.95 with overshoot on press.  */
/* ------------------------------------------------------------------ */

export function SpringPress({
  children,
  onPress,
  disabled,
  style,
  haptic = false,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: object;
  haptic?: boolean;
}) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        if (haptic) tap();
        onPress?.();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.95, { damping: 14, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 300 });
      }}
      style={[{ opacity: disabled ? 0.45 : 1 }, style]}
    >
      <Animated.View style={animated}>{children}</Animated.View>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  sub,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  sub?: string;
}) {
  return (
    <SpringPress onPress={onPress} disabled={disabled || loading} haptic>
      <LinearGradient
        colors={[palette.coral, palette.coralDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.primary, shadows.coralGlow, (disabled || loading) && styles.primaryDisabled]}
      >
        {loading ? (
          <BouncingDots color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryLabel}>
            {label}
            {sub ? `  ·  ${sub}` : ''}
          </Text>
        )}
      </LinearGradient>
    </SpringPress>
  );
}

export function GhostButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <SpringPress onPress={onPress} disabled={disabled}>
      <View style={styles.ghost}>
        <Text style={styles.ghostLabel}>{label}</Text>
      </View>
    </SpringPress>
  );
}

/** Circular icon button in a soft circle — used in headers and sheets. */
export function IconButton({
  label,
  onPress,
  active,
  disabled,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <SpringPress onPress={onPress} disabled={disabled} haptic>
      <View style={[styles.iconButton, active && styles.iconButtonActive]}>
        <Text style={[styles.iconButtonLabel, active && styles.iconButtonLabelActive]}>{label}</Text>
      </View>
    </SpringPress>
  );
}

/* ------------------------------------------------------------------ */
/* Chips — pop (scale bounce) when they become selected.               */
/* ------------------------------------------------------------------ */

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const pop = useSharedValue(1);
  useEffect(() => {
    if (selected) {
      pop.value = withSequence(
        withSpring(1.18, { damping: 10, stiffness: 500 }),
        withSpring(1, { damping: 12, stiffness: 400 }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  return (
    <Pressable onPress={onPress} hitSlop={6}>
      <Animated.View style={[styles.chip, selected && styles.chipSelected, animated]}>
        <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
          {selected ? '🐾 ' : ''}
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Inputs                                                              */
/* ------------------------------------------------------------------ */

export function StyledInput(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      {...props}
      style={[styles.input, props.style]}
      placeholderTextColor={palette.muted}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Glass surfaces                                                      */
/* ------------------------------------------------------------------ */

export function GlassCard({
  children,
  style,
  intensity = 18,
  flush = false,
}: {
  children: React.ReactNode;
  style?: object;
  intensity?: number;
  /** Flush removes the inner padding so children can bleed to the card's edges. */
  flush?: boolean;
}) {
  // Two layers on purpose: the outer view carries the background and the
  // shadow (Android elevation needs a real background, and a shadow on a
  // clipped view renders as a hard white plate offset behind the card).
  // The inner view clips the content to the rounded shape. Real backdrop
  // blur is web-only; on native the translucent surface over the cream
  // ground reads as frost.
  return (
    <View style={[styles.glassShadow, style]}>
      <View style={styles.glassClip}>
        {Platform.OS === 'web' ? (
          <BlurView intensity={intensity} tint="light" style={StyleSheet.absoluteFill} />
        ) : null}
        <View style={[styles.glassInner, flush && styles.glassInnerFlush]}>{children}</View>
      </View>
    </View>
  );
}

/** Alias used across screens for the shared card surface. */
export const Card = GlassCard;

/* ------------------------------------------------------------------ */
/* Pet avatar — photo when one exists, warm initial tile otherwise.    */
/* ------------------------------------------------------------------ */

export function PetAvatar({ pet, size = 72 }: { pet: Pet; size?: number }) {
  const photo = pet.photoKey ? PET_PHOTOS[pet.photoKey] : null;
  if (photo) {
    return (
      <Image
        source={photo}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        accessibilityLabel={`${pet.name}, a ${pet.breed}`}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: pet.tileColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#FFFFFF', fontFamily: 'Fredoka_700Bold', fontSize: size * 0.42 }}>
        {pet.name.slice(0, 1)}
      </Text>
      <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: size * 0.16 }}>🐾</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Top segmented tabs (Today | Pets | Health) — the app's nav chrome.  */
/* ------------------------------------------------------------------ */

export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.segment, selected && styles.segmentSelected]}
            hitSlop={4}
          >
            <Text style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Loading & empty states                                              */
/* ------------------------------------------------------------------ */

export function BouncingDots({ color = palette.coral }: { color?: string }) {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);
  useEffect(() => {
    const bounce = (sv: SharedValue<number>, delay: number) => {
      sv.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(-6, { duration: 260 }),
            withTiming(0, { duration: 260 }),
          ),
          -1,
          false,
        ),
      );
    };
    bounce(dot1, 0);
    bounce(dot2, 90);
    bounce(dot3, 180);
  }, [dot1, dot2, dot3]);
  const style1 = useAnimatedStyle(() => ({ transform: [{ translateY: dot1.value }] }));
  const style2 = useAnimatedStyle(() => ({ transform: [{ translateY: dot2.value }] }));
  const style3 = useAnimatedStyle(() => ({ transform: [{ translateY: dot3.value }] }));
  return (
    <View style={styles.dots}>
      <Animated.View style={[styles.dot, { backgroundColor: color }, style1]} />
      <Animated.View style={[styles.dot, { backgroundColor: color }, style2]} />
      <Animated.View style={[styles.dot, { backgroundColor: color }, style3]} />
    </View>
  );
}

/** Bouncing tennis ball — PetPal's refresh motif. */
export function BouncingBall({ size = 40, active = true }: { size?: number; active?: boolean }) {
  const bounce = useSharedValue(0);
  const squash = useSharedValue(1);
  useEffect(() => {
    if (!active) return;
    bounce.value = withRepeat(
      withSequence(
        withTiming(-size * 0.55, { duration: 320 }),
        withTiming(0, { duration: 320 }),
      ),
      -1,
      false,
    );
    squash.value = withRepeat(
      withSequence(
        withTiming(0.82, { duration: 320 }),
        withTiming(1, { duration: 320 }),
      ),
      -1,
      false,
    );
  }, [active, bounce, squash, size]);
  const animated = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }, { scaleY: squash.value }],
  }));
  return (
    <View style={{ height: size * 1.6, alignItems: 'center', justifyContent: 'flex-end' }}>
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: palette.sunny,
            borderWidth: 3,
            borderColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
          },
          animated,
        ]}
      >
        <Text style={{ fontSize: size * 0.45 }}>🎾</Text>
      </Animated.View>
    </View>
  );
}

export function Skeleton({ width, height, radius = radii.md }: { width: number | string; height: number; radius?: number }) {
  const opacity = useSharedValue(0.45);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.9, { duration: 900 }), -1, true);
  }, [opacity]);
  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: 'rgba(43,33,27,0.08)' }, animated]} />;
}

export function EmptyState({
  glyph,
  title,
  body,
  actionLabel,
  onAction,
}: {
  glyph: string;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Animated.View entering={FadeInDown.springify()} style={styles.empty}>
      <View style={styles.emptyGlyph}>
        <Text style={styles.emptyGlyphText}>{glyph}</Text>
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      {actionLabel && onAction ? (
        <View style={styles.emptyAction}>
          <GhostButton label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </Animated.View>
  );
}

export function SectionHeader({ kicker, title }: { kicker: string; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.kicker}>{kicker.toUpperCase()}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

/** Screen header with a back button — used on sub-screens. */
export function Header({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <View style={styles.header}>
      <IconButton label="←" onPress={onBack} />
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Status — dots and pills                                             */
/* ------------------------------------------------------------------ */

export function TaskStatusPill({ done, overdue }: { done: boolean; overdue?: boolean }) {
  const bg = done ? palette.doneSoft : overdue ? palette.overdueSoft : palette.sunnySoft;
  const fg = done ? palette.done : overdue ? palette.overdue : palette.sunnyDeep;
  const label = done ? 'Done' : overdue ? 'Overdue' : 'To do';
  return (
    <View style={[styles.statusPill, { backgroundColor: bg }]}>
      <View style={[styles.statusDot, { backgroundColor: fg }]} />
      <Text style={[styles.statusPillText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function LiveBadge() {
  return (
    <View style={styles.liveBadge}>
      <Text style={styles.liveBadgeText}>LIVE AI</Text>
    </View>
  );
}

export function DemoBadge() {
  return (
    <View style={styles.demoBadge}>
      <Text style={styles.demoBadgeText}>DEMO</Text>
    </View>
  );
}

/** Small paw bullet used in lists — the app's recurring motif. */
export function PawBullet({ color = palette.coral }: { color?: string }) {
  return <Text style={{ color, fontSize: 14 }}>🐾</Text>;
}

const styles = StyleSheet.create({
  primary: {
    alignItems: 'center',
    borderRadius: radii.pill,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: spacing.lg,
  },
  primaryDisabled: { opacity: 0.55 },
  primaryLabel: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
  ghost: {
    alignItems: 'center',
    backgroundColor: palette.glassStrong,
    borderColor: palette.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  ghostLabel: { color: palette.primary, fontSize: 16, fontWeight: '800' },
  iconButton: {
    alignItems: 'center',
    backgroundColor: palette.glassStrong,
    borderColor: palette.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  iconButtonActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  iconButtonLabel: { color: palette.ink, fontSize: 18, fontWeight: '700' },
  iconButtonLabelActive: { color: '#FFFFFF' },
  chip: {
    backgroundColor: palette.glassStrong,
    borderColor: palette.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  chipSelected: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
    ...shadows.glow,
  },
  chipLabel: { color: palette.ink, fontSize: 15, fontWeight: '700' },
  chipLabelSelected: { color: '#FFFFFF' },
  input: {
    backgroundColor: palette.primaryPale,
    borderRadius: radii.input,
    color: palette.ink,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 18,
  },
  glassShadow: {
    backgroundColor: palette.glass,
    borderRadius: radii.card,
    ...shadows.card,
  },
  glassClip: {
    backgroundColor: palette.sheet,
    borderColor: 'rgba(255,255,255,0.75)',
    borderRadius: radii.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  glassInner: { padding: spacing.md },
  glassInnerFlush: { padding: 0 },
  segmented: {
    backgroundColor: palette.primaryPale,
    borderRadius: radii.pill,
    flexDirection: 'row',
    padding: 4,
  },
  segment: {
    alignItems: 'center',
    borderRadius: radii.pill,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  segmentSelected: {
    backgroundColor: palette.primary,
    ...shadows.glow,
  },
  segmentLabel: { color: palette.body, fontSize: 15, fontWeight: '700' },
  segmentLabelSelected: { color: '#FFFFFF' },
  dots: { alignItems: 'center', flexDirection: 'row', gap: 6, height: 24, justifyContent: 'center' },
  dot: { borderRadius: 5, height: 10, width: 10 },
  empty: { alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.xl },
  emptyGlyph: {
    alignItems: 'center',
    backgroundColor: palette.sunnySoft,
    borderRadius: 48,
    height: 96,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 96,
  },
  emptyGlyphText: { fontSize: 44 },
  emptyTitle: { ...type.title, color: palette.ink, marginBottom: spacing.sm, textAlign: 'center' },
  emptyBody: { ...type.body, color: palette.body, textAlign: 'center' },
  emptyAction: { marginTop: spacing.lg },
  sectionHeader: { marginBottom: spacing.md },
  kicker: { ...type.label, color: palette.coralDeep, marginBottom: 4 },
  sectionTitle: { ...type.title, color: palette.ink },
  header: { alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: spacing.md },
  headerTitle: { ...type.title, color: palette.ink, flex: 1 },
  headerSpacer: { width: 44 },
  statusDot: { borderRadius: 4, height: 8, width: 8 },
  statusPill: {
    alignItems: 'center',
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusPillText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  liveBadge: {
    backgroundColor: palette.doneSoft,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  liveBadgeText: { color: palette.done, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  demoBadge: {
    backgroundColor: palette.warningSoft,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  demoBadgeText: { color: palette.warning, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
});
