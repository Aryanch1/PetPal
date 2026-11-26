import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CARE_KINDS } from '@/lib/types';
import type { CareKind } from '@/lib/types';
import { useApp } from '@/lib/store';
import { palette, spacing, type, useResponsive } from '@/lib/theme';
import { Chip, Header, PrimaryButton, StyledInput } from '@/components/ui';

/** Add a care task — which pet, what kind, what time, and a note. */
export default function NewTaskScreen() {
  const { pets, addTask } = useApp();
  const router = useRouter();
  const r = useResponsive();
  const [petId, setPetId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<CareKind>('Feeding');
  const [time, setTime] = useState('08:00');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const pet = pets.find((p) => p.id === petId) ?? pets[0] ?? null;

  function save() {
    if (!pet) return setError('Add a pet first, then add a care task for them.');
    if (!title.trim()) return setError('Please say what the care is (e.g. Breakfast, Evening walk).');
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time.trim())) {
      return setError('Please enter a time like 08:00 or 18:30.');
    }
    addTask({ petId: pet.id, title, kind, time: time.trim(), notes });
    setSaved(true);
    setError(null);
    setTimeout(() => router.replace('/'), 700);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { maxWidth: r.contentMaxWidth, alignSelf: 'center', width: '100%' }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ padding: r.pad }}>
          <Header title="Add a care task" onBack={() => router.back()} />
          <Text style={styles.label}>WHICH PET?</Text>
          <View style={styles.chips}>
            {pets.map((p) => (
              <Chip key={p.id} label={p.name} selected={pet?.id === p.id} onPress={() => setPetId(p.id)} />
            ))}
          </View>
          {pets.length === 0 ? (
            <Text style={styles.mutedText}>No pets yet — add a pet first.</Text>
          ) : null}
          <Text style={[styles.label, { marginTop: spacing.lg }]}>WHAT IS IT?</Text>
          <StyledInput
            placeholder="Breakfast, Morning walk, Medicine…"
            value={title}
            onChangeText={setTitle}
          />
          <Text style={[styles.label, { marginTop: spacing.lg }]}>KIND</Text>
          <View style={styles.chips}>
            {CARE_KINDS.map((k) => (
              <Chip key={k} label={k} selected={kind === k} onPress={() => setKind(k)} />
            ))}
          </View>
          <Text style={[styles.label, { marginTop: spacing.lg }]}>TIME (24H, E.G. 08:00)</Text>
          <StyledInput placeholder="08:00" value={time} onChangeText={setTime} />
          <Text style={[styles.label, { marginTop: spacing.lg }]}>NOTES (OPTIONAL)</Text>
          <StyledInput
            placeholder="Two cups kibble, park loop, hide in food…"
            value={notes}
            onChangeText={setNotes}
            multiline
            style={styles.notesInput}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {saved ? (
            <Text style={styles.saved}>Added to today&apos;s timeline — see it right on Today. 🐾</Text>
          ) : null}
          <View style={{ marginTop: spacing.lg }}>
            <PrimaryButton label="Add to today" onPress={save} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: palette.ground, flex: 1 },
  scroll: { paddingBottom: spacing.xxl },
  label: { ...type.label, color: palette.coralDeep, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  notesInput: { minHeight: 80, paddingTop: 14, textAlignVertical: 'top' },
  mutedText: { ...type.body, color: palette.body, marginTop: spacing.sm },
  error: { ...type.bodyStrong, color: palette.error, marginTop: spacing.md, textAlign: 'center' },
  saved: { ...type.bodyStrong, color: palette.success, marginTop: spacing.md, textAlign: 'center' },
});
