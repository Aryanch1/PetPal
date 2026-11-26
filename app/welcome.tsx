import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GhostButton, PrimaryButton, StyledInput } from '@/components/ui';
import { useApp } from '@/lib/store';
import { palette, spacing, type } from '@/lib/theme';

type Mode = 'menu' | 'create' | 'login' | 'forgot';

/**
 * Welcome gate — the first screen for a signed-out, non-guest user.
 * Exactly four ways in: Continue with Google, Create account, Log in
 * (with a Forgot password reset-email flow), or Continue without an
 * account (guest, per-visit only — never persisted).
 */
export default function WelcomeScreen() {
  const { signIn, signInWithEmail, signUpWithEmail, resetPasswordForEmail, continueAsGuest } =
    useApp();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('menu');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate() {
    if (!name.trim()) return setError('Please add your name.');
    if (password !== confirm) return setError('The two passwords do not match.');
    if (password.length < 6) return setError('Please choose a password of at least 6 characters.');
    await run(async () => {
      await signUpWithEmail(name, email, password);
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.springify()} style={styles.hero}>
          <Text style={styles.paw}>🐾</Text>
          <Text style={styles.title}>PetPal</Text>
          <Text style={styles.tagline}>Every pet, cared for on time.</Text>
          <Text style={styles.body}>
            Feeding, walks, medication and vet visits on one friendly timeline — for every pet in
            your home.
          </Text>
        </Animated.View>

        {mode === 'menu' && (
          <Animated.View entering={FadeInDown.springify().delay(120)} style={styles.stack}>
            <PrimaryButton
              label="Continue with Google"
              loading={busy}
              onPress={() => void run(signIn)}
            />
            <GhostButton label="Create account" onPress={() => setMode('create')} />
            <GhostButton label="Log in" onPress={() => setMode('login')} />
            <GhostButton
              label="Continue without an account"
              onPress={() => {
                continueAsGuest();
                router.replace('/');
              }}
            />
            <Text style={styles.fine}>
              Guest mode lasts for this visit only — sign in to keep your pets saved across visits.
            </Text>
          </Animated.View>
        )}

        {mode === 'create' && (
          <Animated.View entering={FadeInDown.springify()} style={styles.stack}>
            <Text style={styles.formTitle}>Create your account</Text>
            <StyledInput placeholder="Your name" value={name} onChangeText={setName} autoCapitalize="words" />
            <StyledInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <StyledInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <StyledInput
              placeholder="Confirm password"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton label="Create account" loading={busy} onPress={() => void handleCreate()} />
            <GhostButton
              label="Back"
              onPress={() => {
                setMode('menu');
                setError(null);
              }}
            />
          </Animated.View>
        )}

        {mode === 'login' && (
          <Animated.View entering={FadeInDown.springify()} style={styles.stack}>
            <Text style={styles.formTitle}>Welcome back</Text>
            <StyledInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <StyledInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton
              label="Log in"
              loading={busy}
              onPress={() => void run(() => signInWithEmail(email, password))}
            />
            <GhostButton label="Forgot password?" onPress={() => setMode('forgot')} />
            <GhostButton
              label="Back"
              onPress={() => {
                setMode('menu');
                setError(null);
              }}
            />
          </Animated.View>
        )}

        {mode === 'forgot' && (
          <Animated.View entering={FadeInDown.springify()} style={styles.stack}>
            <Text style={styles.formTitle}>Reset your password</Text>
            <Text style={styles.body}>
              Enter your email and we will send you a link to choose a new password.
            </Text>
            <StyledInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {notice ? <Text style={styles.notice}>{notice}</Text> : null}
            <PrimaryButton
              label="Send reset email"
              loading={busy}
              onPress={() =>
                void run(async () => {
                  await resetPasswordForEmail(email);
                  setNotice('Reset email sent — check your inbox.');
                })
              }
            />
            <GhostButton
              label="Back to log in"
              onPress={() => {
                setMode('login');
                setError(null);
                setNotice(null);
              }}
            />
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: palette.ground, flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  hero: { alignItems: 'center', marginBottom: spacing.xl },
  paw: { fontSize: 56, marginBottom: spacing.sm },
  title: { ...type.displayWide, color: palette.primary, textAlign: 'center' },
  tagline: { ...type.title, color: palette.coralDeep, marginTop: spacing.sm, textAlign: 'center' },
  body: { ...type.body, color: palette.body, marginTop: spacing.sm, textAlign: 'center' },
  stack: { gap: spacing.md },
  formTitle: { ...type.title, color: palette.ink, marginBottom: spacing.sm },
  error: { ...type.bodyStrong, color: palette.error, textAlign: 'center' },
  notice: { ...type.bodyStrong, color: palette.success, textAlign: 'center' },
  fine: { ...type.caption, color: palette.muted, textAlign: 'center' },
});
