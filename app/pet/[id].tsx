import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatShortDate, formatTime, formatWeight, minutesUntilTime, weightInGrams } from '@/lib/data';
import { useApp } from '@/lib/store';
import { palette, radii, spacing, type, useResponsive } from '@/lib/theme';
import {
  Card,
  EmptyState,
  GhostButton,
  Header,
  PetAvatar,
  PrimaryButton,
  StyledInput,
  TaskStatusPill,
} from '@/components/ui';

/**
 * Pet detail — a full-screen takeover with a big colored banner header:
 * photo, name, breed, age and weight, then their tasks, vaccinations,
 * weight chart, vet visits, and the add-weight / edit / remove actions.
 */
export default function PetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    petById,
    tasksForPetToday,
    vaccinations,
    weights,
    vetVisits,
    toggleTaskDone,
    toggleVaccination,
    addWeight,
    deletePet,
  } = useApp();
  const router = useRouter();
  const r = useResponsive();
  const [weightText, setWeightText] = useState('');
  const [weightNote, setWeightNote] = useState<string | null>(null);

  const pet = petById(id ?? '');
  const petTasks = useMemo(
    () => (pet ? tasksForPetToday(pet.id) : []),
    [pet, tasksForPetToday],
  );
  const vax = useMemo(
    () =>
      (pet ? vaccinations.filter((v) => v.petId === pet.id) : []).sort((a, b) =>
        a.dueDate.localeCompare(b.dueDate),
      ),
    [pet, vaccinations],
  );
  const entries = useMemo(
    () =>
      (pet ? weights.filter((w) => w.petId === pet.id) : []).sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
    [pet, weights],
  );
  const visits = useMemo(
    () =>
      (pet ? vetVisits.filter((v) => v.petId === pet.id) : []).sort((a, b) =>
        b.date.localeCompare(a.date),
      ),
    [pet, vetVisits],
  );
  const maxGrams = Math.max(...entries.map((e) => weightInGrams(e.weight, e.unit)), 1);

  if (!pet) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ padding: r.pad }}>
          <Header title="Pet" onBack={() => router.back()} />
          <EmptyState
            glyph="🐾"
            title="That pet is gone"
            body="This pet may have been removed. Head back and pick another friend."
            actionLabel="Back to Today"
            onAction={() => router.replace('/')}
          />
        </View>
      </SafeAreaView>
    );
  }

  const done = petTasks.filter((t) => t.done).length;

  function logWeight() {
    if (!pet) return;
    const value = Number(weightText);
    if (!value || value <= 0) {
      setWeightNote('Please enter a weight above zero.');
      return;
    }
    addWeight(pet.id, value, pet.weightUnit);
    setWeightText('');
    setWeightNote(`Logged ${value} ${pet.weightUnit} for ${pet.name} — nice, it is on the chart now.`);
  }

  function removePet() {
    if (!pet) return;
    Alert.alert(
      `Remove ${pet.name}?`,
      'This removes the pet and all of their tasks, vaccinations, weight entries and vet visits.',
      [
        { text: 'Keep them', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            deletePet(pet.id);
            router.replace('/');
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
          <Header title={pet.name} onBack={() => router.back()} />

          <Animated.View entering={FadeInDown.springify()}>
            <View style={[styles.banner, { backgroundColor: pet.tileColor }]}>
              <PetAvatar pet={pet} size={128} />
              <Text style={styles.bannerName}>{pet.name}</Text>
              <Text style={styles.bannerMeta}>
                {pet.breed} · {pet.ageYears} years old · {formatWeight(pet.weight, pet.weightUnit)}
              </Text>
              <Text style={styles.bannerMeta}>
                🐾 {done}/{petTasks.length} cares done today
              </Text>
              {pet.notes ? <Text style={styles.bannerNotes}>{pet.notes}</Text> : null}
            </View>
          </Animated.View>

          <View style={styles.actions}>
            <PrimaryButton label="Ask about this pet" onPress={() => router.push('/ask')} />
            <GhostButton label="Add a care task" onPress={() => router.push('/new-task')} />
          </View>

          <Text style={styles.sectionTitle}>Today&apos;s care</Text>
          {petTasks.length === 0 ? (
            <Text style={styles.mutedText}>No cares scheduled for {pet.name} today.</Text>
          ) : (
            <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
              {petTasks.map((task) => {
                const overdue = !task.done && minutesUntilTime(task.time) < -30;
                return (
                  <Card key={task.id}>
                    <View style={styles.taskRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.taskTitle, task.done && styles.taskDone]}>{task.title}</Text>
                        <Text style={styles.taskMeta}>
                          {task.kind} · {formatTime(task.time)}
                        </Text>
                      </View>
                      <TaskStatusPill done={task.done} overdue={overdue} />
                      <GhostButton
                        label={task.done ? 'Undo' : 'Done'}
                        onPress={() => toggleTaskDone(task.id)}
                      />
                    </View>
                  </Card>
                );
              })}
            </View>
          )}

          <Text style={styles.sectionTitle}>Vaccinations</Text>
          {vax.length === 0 ? (
            <Text style={styles.mutedText}>No vaccinations tracked for {pet.name} yet.</Text>
          ) : (
            <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
              {vax.map((v) => (
                <Card key={v.id}>
                  <View style={styles.taskRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.taskTitle}>{v.name}</Text>
                      <Text style={styles.taskMeta}>
                        {v.done ? 'Done ✓' : `Due ${formatShortDate(v.dueDate)}`}
                      </Text>
                    </View>
                    <GhostButton
                      label={v.done ? 'Undo' : 'Done'}
                      onPress={() => toggleVaccination(v.id)}
                    />
                  </View>
                </Card>
              ))}
            </View>
          )}

          <Text style={styles.sectionTitle}>Weight</Text>
          {entries.length === 0 ? (
            <Text style={styles.mutedText}>No weigh-ins yet.</Text>
          ) : (
            <Card style={{ marginBottom: spacing.md }}>
              <View style={styles.chart}>
                {entries.map((e) => {
                  const grams = weightInGrams(e.weight, e.unit);
                  const height = Math.max(24, (grams / maxGrams) * 120);
                  return (
                    <View key={e.id} style={styles.barCol}>
                      <Text style={styles.barValue}>{e.weight}</Text>
                      <View style={[styles.bar, { height }]} />
                      <Text style={styles.barLabel}>{formatShortDate(e.date)}</Text>
                    </View>
                  );
                })}
              </View>
            </Card>
          )}
          <View style={styles.weightRow}>
            <StyledInput
              placeholder={`New weight (${pet.weightUnit})`}
              value={weightText}
              onChangeText={setWeightText}
              keyboardType="decimal-pad"
              style={{ flex: 1 }}
            />
            <PrimaryButton label="Log weight" onPress={logWeight} />
          </View>
          {weightNote ? <Text style={styles.weightNote}>{weightNote}</Text> : null}

          <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Vet visits</Text>
          {visits.length === 0 ? (
            <Text style={styles.mutedText}>No vet visits recorded yet.</Text>
          ) : (
            <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
              {visits.map((v) => (
                <Card key={v.id}>
                  <Text style={styles.taskTitle}>{v.reason}</Text>
                  <Text style={styles.taskMeta}>{formatShortDate(v.date)}</Text>
                </Card>
              ))}
            </View>
          )}

          <View style={{ marginTop: spacing.lg }}>
            <GhostButton label={`Remove ${pet.name}`} onPress={removePet} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: palette.ground, flex: 1 },
  scroll: { paddingBottom: spacing.xxl },
  banner: {
    alignItems: 'center',
    borderRadius: radii.sheet,
    padding: spacing.xl,
  },
  bannerName: { color: '#FFFFFF', fontFamily: 'Fredoka_700Bold', fontSize: 36, marginTop: spacing.md },
  bannerMeta: { color: 'rgba(255,255,255,0.92)', fontSize: 15, fontWeight: '600', marginTop: 2 },
  bannerNotes: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  actions: { gap: spacing.md, marginTop: spacing.lg },
  sectionTitle: { ...type.title, color: palette.ink, marginBottom: spacing.md, marginTop: spacing.lg },
  mutedText: { ...type.body, color: palette.body, marginBottom: spacing.md },
  taskRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  taskTitle: { ...type.bodyStrong, color: palette.ink },
  taskDone: { color: palette.muted, textDecorationLine: 'line-through' },
  taskMeta: { ...type.body, color: palette.body, fontSize: 13, marginTop: 2 },
  chart: { alignItems: 'flex-end', flexDirection: 'row', gap: spacing.md, justifyContent: 'center', minHeight: 160 },
  barCol: { alignItems: 'center', gap: 6, justifyContent: 'flex-end' },
  barValue: { color: palette.ink, fontSize: 13, fontWeight: '800' },
  bar: { backgroundColor: palette.coral, borderRadius: 8, width: 36 },
  barLabel: { color: palette.muted, fontSize: 11, fontWeight: '700' },
  weightRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  weightNote: { ...type.bodyStrong, color: palette.success, marginTop: spacing.sm },
});
