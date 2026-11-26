import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { appName, appVersion, firebaseConfigured } from '@/lib/config';
import { firebaseStatusMessage } from '@/lib/firebase';
import { useApp } from '@/lib/store';
import { palette, spacing, type, useResponsive } from '@/lib/theme';
import { GhostButton, Header, PrimaryButton, StyledInput } from '@/components/ui';

/**
 * Settings — profile (name + photo + sign-in method + password reset +
 * sign out), demo data controls, history controls, and About.
 * A signed-out/guest user sees an account card routing to Welcome.
 */
export default function SettingsScreen() {
  const {
    user,
    guest,
    updateDisplayName,
    setAvatarData,
    sendPasswordReset,
    signOut,
    showDemoData,
    setShowDemoData,
    clearDemoData,
    clearHistory,
    history,
  } = useApp();
  const router = useRouter();
  const r = useResponsive();
  const [name, setName] = useState(user?.name ?? '');
  const [nameNote, setNameNote] = useState<string | null>(null);
  const [photoNote, setPhotoNote] = useState<string | null>(null);
  const [resetNote, setResetNote] = useState<string | null>(null);
  const [demoNote, setDemoNote] = useState<string | null>(null);

  async function saveName() {
    if (!name.trim()) {
      setNameNote('Please enter a name first.');
      return;
    }
    await updateDisplayName(name);
    setNameNote('Name saved — looking good.');
  }

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    // Resize client-side to a small square, then store as base64 data on
    // the user document — no storage bucket needed.
    const resized = await ImageManipulator.manipulateAsync(
      result.assets[0].uri,
      [{ resize: { width: 256, height: 256 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true },
    );
    if (resized.base64) {
      await setAvatarData(`data:image/jpeg;base64,${resized.base64}`);
      setPhotoNote('Profile photo updated.');
    }
  }

  async function resetPassword() {
    await sendPasswordReset();
    setResetNote('Password reset email sent — check your inbox.');
  }

  function clearDemo() {
    Alert.alert(
      'Clear demo pets?',
      'This removes Milo, Luna and Kiwi, and their demo tasks, vaccinations, weight entries and vet visits.',
      [
        { text: 'Keep them', style: 'cancel' },
        {
          text: 'Clear demo data',
          style: 'destructive',
          onPress: () => {
            clearDemoData();
            setDemoNote('Demo pets cleared — your own pets stay put.');
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { maxWidth: r.contentMaxWidth, alignSelf: 'center', width: '100%' }]}
      >
        <View style={{ padding: r.pad }}>
          <Header title="Settings" onBack={() => router.back()} />

          <Text style={styles.sectionTitle}>Account</Text>
          {!user ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {guest ? 'You are visiting as a guest' : 'You are not signed in'}
              </Text>
              <Text style={styles.cardBody}>
                Sign in to keep your pets saved across visits. Guest mode lasts for this visit only.
              </Text>
              <View style={{ marginTop: spacing.md }}>
                <PrimaryButton label="Go to sign in" onPress={() => router.push('/welcome')} />
              </View>
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.profileRow}>
                {user.photo ? (
                  <Image source={{ uri: user.photo }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarLetter}>{(user.name ?? 'P').slice(0, 1)}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{user.name ?? 'Pet lover'}</Text>
                  <Text style={styles.cardBody}>{user.email ?? 'No email on file'}</Text>
                  <Text style={styles.cardBody}>
                    Signed in with {user.provider === 'google.com' ? 'Google' : 'email and password'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.label, { marginTop: spacing.lg }]}>DISPLAY NAME</Text>
              <StyledInput value={name} onChangeText={setName} autoCapitalize="words" />
              {nameNote ? <Text style={styles.note}>{nameNote}</Text> : null}
              <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
                <PrimaryButton label="Save name" onPress={() => void saveName()} />
                <GhostButton label="Change profile photo" onPress={() => void pickPhoto()} />
                {photoNote ? <Text style={styles.note}>{photoNote}</Text> : null}
                {user.provider === 'password' ? (
                  <GhostButton label="Send password reset email" onPress={() => void resetPassword()} />
                ) : null}
                {resetNote ? <Text style={styles.note}>{resetNote}</Text> : null}
                <GhostButton
                  label="Sign out"
                  onPress={() =>
                    void (async () => {
                      await signOut();
                      router.replace('/welcome');
                    })()
                  }
                />
              </View>
            </View>
          )}
          <Text style={styles.fine}>
            {firebaseConfigured ? 'Accounts are connected.' : firebaseStatusMessage()}
          </Text>

          <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Demo data</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Demo pets: {showDemoData ? 'shown' : 'hidden'}</Text>
            <Text style={styles.cardBody}>
              Milo, Luna and Kiwi came with the app so you can try it right away. Hide them or clear
              them completely — your own pets are never touched.
            </Text>
            <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
              <GhostButton
                label={showDemoData ? 'Hide demo pets' : 'Show demo pets'}
                onPress={() => setShowDemoData(!showDemoData)}
              />
              <GhostButton label="Clear demo pets" onPress={clearDemo} />
              {demoNote ? <Text style={styles.note}>{demoNote}</Text> : null}
            </View>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>History</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {history.length} saved {history.length === 1 ? 'item' : 'items'}
            </Text>
            <Text style={styles.cardBody}>
              Past questions, checked-off cares and weigh-ins, saved for one-tap re-use.
            </Text>
            <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
              <GhostButton label="View history" onPress={() => router.push('/history')} />
              <GhostButton
                label="Clear history"
                onPress={() => {
                  clearHistory();
                }}
              />
            </View>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>About</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {appName} · v{appVersion}
            </Text>
            <Text style={styles.cardBody}>
              Every pet, cared for on time. Built by Aryanmouli Cherupalli. PetPal answers are
              general pet-care information, not veterinary advice — please ask your vet about your
              pet.
            </Text>
            <View style={{ marginTop: spacing.md }}>
              <GhostButton label="Help & support" onPress={() => router.push('/help')} />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: palette.ground, flex: 1 },
  scroll: { paddingBottom: spacing.xxl },
  sectionTitle: { ...type.title, color: palette.ink, marginBottom: spacing.md },
  card: {
    backgroundColor: palette.surface,
    borderColor: palette.line,
    borderRadius: 30,
    borderWidth: 1,
    padding: spacing.lg,
  },
  cardTitle: { ...type.subtitle, color: palette.ink },
  cardBody: { ...type.body, color: palette.body, marginTop: 4 },
  profileRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  avatar: { borderRadius: 40, height: 80, width: 80 },
  avatarFallback: { alignItems: 'center', backgroundColor: palette.coral, justifyContent: 'center' },
  avatarLetter: { color: '#FFFFFF', fontFamily: 'Fredoka_700Bold', fontSize: 32 },
  label: { ...type.label, color: palette.coralDeep, marginBottom: spacing.sm },
  note: { ...type.bodyStrong, color: palette.success, marginTop: spacing.sm },
  fine: { ...type.caption, color: palette.muted, marginTop: spacing.sm },
});
