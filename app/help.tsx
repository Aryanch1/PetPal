import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DEMO_DISCLAIMER } from '@/lib/demoai';
import { palette, spacing, type, useResponsive } from '@/lib/theme';
import { Card, GhostButton, Header, SectionHeader } from '@/components/ui';

/** Help & support — how PetPal works, and the veterinary disclaimer. */
export default function HelpScreen() {
  const router = useRouter();
  const r = useResponsive();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { maxWidth: r.contentMaxWidth, alignSelf: 'center', width: '100%' }]}
      >
        <View style={{ padding: r.pad }}>
          <Header title="Help" onBack={() => router.back()} />
          <SectionHeader kicker="PetPal" title="How it works" />

          <View style={{ gap: spacing.md }}>
            <Card>
              <Text style={styles.cardTitle}>🐾 Today</Text>
              <Text style={styles.cardBody}>
                Your pets sit in the carousel up top. Tap one to see their day, and check off each
                care as you do it. The “Next up” card always shows what is due next, with a
                countdown.
              </Text>
            </Card>
            <Card>
              <Text style={styles.cardTitle}>🐶 Pets</Text>
              <Text style={styles.cardBody}>
                Add a pet with their breed, age and weight. Tap a pet to open their page: tasks,
                vaccinations, weight chart and vet visits, all in one place.
              </Text>
            </Card>
            <Card>
              <Text style={styles.cardTitle}>🩺 Health</Text>
              <Text style={styles.cardBody}>
                Vaccinations with due dates, a weight chart over time, and a list of vet visits.
                Log a new weight from the pet page and the chart updates right away.
              </Text>
            </Card>
            <Card>
              <Text style={styles.cardTitle}>💬 Ask about your pet</Text>
              <Text style={styles.cardBody}>
                Ask a question and PetPal answers in plain words. Answers are labelled LIVE when
                the service answers and DEMO when the app answers on-device. Either way, the answer
                is general information only.
              </Text>
            </Card>
            <Card>
              <Text style={styles.cardTitle}>👤 Accounts</Text>
              <Text style={styles.cardBody}>
                Sign in with Google or an email account to keep your pets saved across visits.
                Guest mode works fully for one visit and never remembers you. Your data lives under
                your own account and nobody else can see it.
              </Text>
            </Card>
            <Card>
              <Text style={styles.cardTitle}>⚠️ A note on pet health</Text>
              <Text style={styles.cardBody}>{DEMO_DISCLAIMER}</Text>
            </Card>
          </View>

          <View style={{ marginTop: spacing.lg }}>
            <GhostButton label="Back to Today" onPress={() => router.replace('/')} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: palette.ground, flex: 1 },
  scroll: { paddingBottom: spacing.xxl },
  cardTitle: { ...type.subtitle, color: palette.ink },
  cardBody: { ...type.body, color: palette.body, marginTop: 4 },
});
