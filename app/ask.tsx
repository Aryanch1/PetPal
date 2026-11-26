import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { askAboutPet } from '@/lib/ai';
import { DEMO_DISCLAIMER, SUGGESTED_QUESTIONS } from '@/lib/demoai';
import { useApp } from '@/lib/store';
import { palette, spacing, type, useResponsive } from '@/lib/theme';
import {
  BouncingDots,
  Chip,
  DemoBadge,
  Header,
  LiveBadge,
  PrimaryButton,
  Skeleton,
  StyledInput,
} from '@/components/ui';

/**
 * Ask AI — kind pet-care answers for the selected pet. Every AI screen
 * carries the "not veterinary advice" disclaimer, and every answer is
 * labelled LIVE or DEMO so it is never mistaken for the other.
 */
export default function AskScreen() {
  const { pets, recordHistory } = useApp();
  const router = useRouter();
  const r = useResponsive();
  const [petId, setPetId] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [source, setSource] = useState<'live' | 'demo' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pet = pets.find((p) => p.id === petId) ?? pets[0] ?? null;

  async function ask(q: string) {
    const clean = q.trim();
    if (clean.length < 3) {
      setError('Please ask a question of at least 3 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    setAnswer(null);
    setSource(null);
    try {
      const result = await askAboutPet(clean, pet);
      setAnswer(result.answer);
      setSource(result.source);
      if (pet) {
        recordHistory({
          petId: pet.id,
          petName: pet.name,
          title: `Asked: ${clean.slice(0, 60)}${clean.length > 60 ? '…' : ''}`,
          kind: 'asked',
        });
      }
    } catch {
      setError('Could not get an answer right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { maxWidth: r.contentMaxWidth, alignSelf: 'center', width: '100%' }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ padding: r.pad }}>
          <Header title="Ask about your pet" onBack={() => router.back()} />
          <Text style={styles.disclaimer}>⚠️ {DEMO_DISCLAIMER}</Text>

          <Text style={styles.label}>WHO IS THIS ABOUT?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
            {pets.map((p) => (
              <Chip
                key={p.id}
                label={p.name}
                selected={pet?.id === p.id}
                onPress={() => setPetId(p.id)}
              />
            ))}
          </ScrollView>

          <Text style={styles.label}>YOUR QUESTION</Text>
          <StyledInput
            placeholder={`Ask about ${pet?.name ?? 'your pet'}…`}
            value={question}
            onChangeText={setQuestion}
            multiline
            style={styles.questionInput}
          />

          <View style={{ marginTop: spacing.md }}>
            <PrimaryButton
              label="Ask PetPal"
              loading={loading}
              disabled={question.trim().length < 3}
              onPress={() => void ask(question)}
            />
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={[styles.label, { marginTop: spacing.xl }]}>TRY ONE OF THESE</Text>
          <View style={styles.suggestions}>
            {SUGGESTED_QUESTIONS.map((s) => (
              <Chip
                key={s.label}
                label={s.label}
                selected={false}
                onPress={() => {
                  setQuestion(s.question);
                  void ask(s.question);
                }}
              />
            ))}
          </View>

          {loading ? (
            <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
              <Skeleton width="100%" height={18} />
              <Skeleton width="92%" height={18} />
              <Skeleton width="80%" height={18} />
              <BouncingDots />
            </View>
          ) : null}

          {answer && source ? (
            <Animated.View entering={FadeInDown.springify()} style={styles.answerCard}>
              <View style={styles.answerHead}>
                <Text style={styles.answerTitle}>PetPal says</Text>
                {source === 'live' ? <LiveBadge /> : <DemoBadge />}
              </View>
              <Text style={styles.answerText}>{answer}</Text>
              {source === 'demo' ? (
                <Text style={styles.demoNote}>
                  Demo answer from the app itself — the live service is not configured yet.
                </Text>
              ) : null}
            </Animated.View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: palette.ground, flex: 1 },
  scroll: { paddingBottom: spacing.xxl },
  disclaimer: {
    ...type.bodyStrong,
    backgroundColor: palette.sunnySoft,
    borderRadius: 16,
    color: palette.sunnyDeep,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    padding: spacing.md,
  },
  label: { ...type.label, color: palette.coralDeep, marginBottom: spacing.sm },
  chips: { marginBottom: spacing.lg },
  questionInput: { minHeight: 96, paddingTop: 14, textAlignVertical: 'top' },
  error: { ...type.bodyStrong, color: palette.error, marginTop: spacing.md, textAlign: 'center' },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  answerCard: {
    backgroundColor: palette.surface,
    borderColor: palette.line,
    borderRadius: 30,
    borderWidth: 1,
    marginTop: spacing.lg,
    padding: spacing.lg,
  },
  answerHead: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  answerTitle: { ...type.title, color: palette.ink, fontSize: 22 },
  answerText: { ...type.body, color: palette.ink, fontSize: 16, lineHeight: 24 },
  demoNote: { ...type.body, color: palette.muted, fontSize: 13, marginTop: spacing.md },
});
