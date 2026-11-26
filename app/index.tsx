import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BouncingBall,
  Card,
  Chip,
  EmptyState,
  GhostButton,
  IconButton,
  PetAvatar,
  PrimaryButton,
  SegmentedTabs,
  SpringPress,
  TaskStatusPill,
} from '@/components/ui';
import { countdownLabel, formatShortDate, formatTime, formatToday, formatWeight, minutesUntilTime, weightInGrams } from '@/lib/data';
import { useApp } from '@/lib/store';
import { palette, radii, shadows, spacing, type, useResponsive } from '@/lib/theme';
import type { CareTask, Pet } from '@/lib/types';

type Tab = 'today' | 'pets' | 'health';

const KIND_GLYPH: Record<string, string> = {
  Feeding: '🍽️',
  Walk: '🦮',
  Medication: '💊',
  Grooming: '🪮',
  Play: '🎾',
  'Vet visit': '🩺',
  Other: '🐾',
};

function greeting(now: Date): string {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/** One timeline row — tap the circle to check it off, right where you are. */
function TaskRow({
  task,
  pet,
  index,
  onToggle,
  onOpenPet,
}: {
  task: CareTask;
  pet: Pet | undefined;
  index: number;
  onToggle: (id: string) => void;
  onOpenPet: (petId: string) => void;
}) {
  const [justDone, setJustDone] = useState(false);
  const overdue = !task.done && minutesUntilTime(task.time) < -30;
  return (
    <Animated.View entering={FadeInDown.springify().delay(index * 60)}>
      <Pressable
        onPress={() => {
          onToggle(task.id);
          if (!task.done) {
            setJustDone(true);
            setTimeout(() => setJustDone(false), 1800);
          }
        }}
        style={styles.taskRow}
      >
        <View style={[styles.checkCircle, task.done && styles.checkCircleDone]}>
          {task.done ? <Text style={styles.checkMark}>✓</Text> : null}
        </View>
        <View style={styles.taskBody}>
          <Text style={[styles.taskTitle, task.done && styles.taskDone]}>{task.title}</Text>
          <Text style={styles.taskMeta}>
            {KIND_GLYPH[task.kind] ?? '🐾'} {task.kind} · {formatTime(task.time)}
            {pet ? ` · ${pet.name}` : ''}
          </Text>
          {justDone ? <Text style={styles.doneNote}>Done — nice work! 🎉</Text> : null}
        </View>
        <TaskStatusPill done={task.done} overdue={overdue} />
        {pet ? (
          <SpringPress onPress={() => onOpenPet(pet.id)}>
            <PetAvatar pet={pet} size={40} />
          </SpringPress>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const { pets, todaysTasks, nextTask, tasksForPetToday, toggleTaskDone, user, guest } = useApp();
  const router = useRouter();
  const r = useResponsive();
  const [tab, setTab] = useState<Tab>('today');
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshNote, setRefreshNote] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const pull = useSharedValue(0);

  const selectedPet = useMemo(
    () => pets.find((p) => p.id === selectedPetId) ?? pets[0] ?? null,
    [pets, selectedPetId],
  );
  const doneCount = todaysTasks.filter((t) => t.done).length;

  const doRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshNote(null);
    setTimeout(() => {
      setNow(new Date());
      setRefreshing(false);
      setRefreshNote('Fresh as a daisy — all caught up.');
      setTimeout(() => setRefreshNote(null), 2500);
    }, 900);
  }, []);

  // Custom pull-to-refresh: a tennis ball drops in and fills with coral
  // as the finger pulls (scrubbed by distance). Past the threshold,
  // releasing plays its bounce loop while the day re-checks itself.
  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      if (e.contentOffset.y < 0) pull.value = Math.min(1, -e.contentOffset.y / 90);
    },
    onEndDrag: (e) => {
      if (e.contentOffset.y < -90) {
        pull.value = 1;
      } else {
        pull.value = withSpring(0);
      }
    },
  });
  const ballStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.4 + pull.value * 0.6 }, { translateY: (1 - pull.value) * -20 }],
    opacity: pull.value,
  }));

  const openPet = useCallback(
    (petId: string) => router.push(`/pet/${petId}`),
    [router],
  );

  const header = (
    <View style={styles.headerRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.kicker}>{formatToday(now).toUpperCase()}</Text>
        <Text style={[type.display, styles.hello, { fontSize: r.display.fontSize }]}>
          {greeting(now)}
          {user?.name ? `, ${user.name.split(' ')[0]}` : ''}
        </Text>
        <Text style={styles.sub}>
          {doneCount} of {todaysTasks.length} cares done today
          {guest ? ' · guest visit' : ''}
        </Text>
      </View>
      <IconButton label="🔄" onPress={doRefresh} />
      <IconButton label="⚙️" onPress={() => router.push('/settings')} />
    </View>
  );

  const petCarousel = (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
      {pets.map((pet) => {
        const selected = selectedPet?.id === pet.id;
        const petTasks = tasksForPetToday(pet.id);
        const petDone = petTasks.filter((t) => t.done).length;
        return (
          <SpringPress
            key={pet.id}
            onPress={() => setSelectedPetId(pet.id)}
            haptic
            style={{ marginRight: spacing.md }}
          >
            <View style={[styles.petCard, selected && styles.petCardSelected]}>
              <PetAvatar pet={pet} size={84} />
              <Text style={styles.petName}>{pet.name}</Text>
              <Text style={styles.petBreed}>
                {pet.breed} · {pet.ageYears}y
              </Text>
              <View style={styles.petPill}>
                <Text style={styles.petPillText}>
                  🐾 {petDone}/{petTasks.length} done
                </Text>
              </View>
            </View>
          </SpringPress>
        );
      })}
      <SpringPress onPress={() => router.push('/new-pet')} haptic>
        <View style={[styles.petCard, styles.addPetCard]}>
          <Text style={styles.addPetGlyph}>＋</Text>
          <Text style={styles.petName}>Add a pet</Text>
          <Text style={styles.petBreed}>Dog, cat, bird…</Text>
        </View>
      </SpringPress>
    </ScrollView>
  );

  const nextUp = nextTask ? (
    <Card style={styles.nextUp}>
      <Text style={styles.nextUpKicker}>NEXT UP · {countdownLabel(nextTask.time, now)}</Text>
      <Text style={styles.nextUpTitle}>{nextTask.title}</Text>
      <Text style={styles.nextUpMeta}>
        {formatTime(nextTask.time)} · {KIND_GLYPH[nextTask.kind] ?? '🐾'} {nextTask.kind}
      </Text>
      <View style={{ marginTop: spacing.md }}>
        <PrimaryButton
          label="Mark done"
          onPress={() => toggleTaskDone(nextTask.id)}
        />
      </View>
    </Card>
  ) : (
    <Card style={styles.nextUp}>
      <Text style={styles.nextUpKicker}>ALL CAUGHT UP</Text>
      <Text style={styles.nextUpTitle}>Every care done today. Good human. 🎉</Text>
    </Card>
  );

  const askCard = (
    <SpringPress onPress={() => router.push('/ask')} haptic>
      <View style={styles.askCard}>
        <Text style={styles.askGlyph}>💬</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.askTitle}>Ask about your pet</Text>
          <Text style={styles.askBody}>
            Feeding, walks, itches, new-pet nerves — kind answers in plain words.
          </Text>
        </View>
        <Text style={styles.askArrow}>›</Text>
      </View>
    </SpringPress>
  );

  const timeline = (
    <View>
      <Text style={styles.sectionTitle}>Today&apos;s care</Text>
      {todaysTasks.length === 0 ? (
        <EmptyState
          glyph="🐾"
          title="No cares yet today"
          body="Add a feeding, walk, or medication and it will show up here on the timeline."
          actionLabel="Add a care task"
          onAction={() => router.push('/new-task')}
        />
      ) : (
        <View style={{ gap: spacing.sm }}>
          {todaysTasks.map((task, i) => (
            <TaskRow
              key={task.id}
              task={task}
              pet={pets.find((p) => p.id === task.petId)}
              index={i}
              onToggle={toggleTaskDone}
              onOpenPet={openPet}
            />
          ))}
        </View>
      )}
      <View style={{ marginTop: spacing.lg }}>
        <GhostButton label="+ Add a care task" onPress={() => router.push('/new-task')} />
      </View>
    </View>
  );

  const petsPanel = (
    <View>
      <Text style={styles.sectionTitle}>Your pets</Text>
      {pets.length === 0 ? (
        <EmptyState
          glyph="🐾"
          title="No pets yet"
          body="Add your first pet and PetPal will build their care timeline."
          actionLabel="Add a pet"
          onAction={() => router.push('/new-pet')}
        />
      ) : (
        <View style={{ gap: spacing.md }}>
          {pets.map((pet, i) => {
            const petTasks = tasksForPetToday(pet.id);
            const petDone = petTasks.filter((t) => t.done).length;
            return (
              <Animated.View key={pet.id} entering={FadeInDown.springify().delay(i * 60)}>
                <SpringPress onPress={() => openPet(pet.id)} haptic>
                  <Card>
                    <View style={styles.petRow}>
                      <PetAvatar pet={pet} size={72} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.petRowName}>{pet.name}</Text>
                        <Text style={styles.petRowMeta}>
                          {pet.breed} · {pet.ageYears} years · {formatWeight(pet.weight, pet.weightUnit)}
                        </Text>
                        <Text style={styles.petRowMeta}>
                          🐾 {petDone}/{petTasks.length} cares done today
                        </Text>
                      </View>
                      <Text style={styles.petRowArrow}>›</Text>
                    </View>
                  </Card>
                </SpringPress>
              </Animated.View>
            );
          })}
        </View>
      )}
      <View style={{ marginTop: spacing.lg }}>
        <PrimaryButton label="Add a pet" onPress={() => router.push('/new-pet')} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.View style={[styles.pullBall, ballStyle]}>
        <BouncingBall size={36} active={refreshing} />
      </Animated.View>
      {refreshing ? (
        <View style={styles.refreshBanner}>
          <BouncingBall size={30} active />
          <Text style={styles.refreshText}>Fetching the tennis ball…</Text>
        </View>
      ) : null}
      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.scroll, { maxWidth: r.contentMaxWidth, alignSelf: 'center', width: '100%' }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ padding: r.pad, paddingBottom: 0 }}>{header}</View>

        <View style={{ paddingHorizontal: r.pad, marginTop: spacing.md }}>
          <SegmentedTabs<Tab>
            options={[
              { value: 'today', label: 'Today' },
              { value: 'pets', label: 'Pets' },
              { value: 'health', label: 'Health' },
            ]}
            value={tab}
            onChange={setTab}
          />
        </View>

        {refreshNote ? (
          <View style={{ paddingHorizontal: r.pad, marginTop: spacing.md }}>
            <Text style={styles.refreshNote}>{refreshNote}</Text>
          </View>
        ) : null}

        {tab === 'today' && (
          <View style={{ padding: r.pad }}>
            {petCarousel}
            <View style={{ height: spacing.lg }} />
            {r.twoPane && selectedPet ? (
              <View style={styles.twoPane}>
                <View style={{ flex: 1 }}>
                  {nextUp}
                  <View style={{ height: spacing.md }} />
                  {askCard}
                  <View style={{ height: spacing.lg }} />
                  {timeline}
                </View>
                <View style={{ flex: 1 }}>
                  <PetDetailSide pet={selectedPet} onOpen={() => openPet(selectedPet.id)} />
                </View>
              </View>
            ) : (
              <>
                {nextUp}
                <View style={{ height: spacing.md }} />
                {askCard}
                <View style={{ height: spacing.lg }} />
                {timeline}
              </>
            )}
          </View>
        )}

        {tab === 'pets' && <View style={{ padding: r.pad }}>{petsPanel}</View>}

        {tab === 'health' && (
          <View style={{ padding: r.pad }}>
            <HealthPanel />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Right-hand pane on wide screens: the selected pet at a glance. */
function PetDetailSide({ pet, onOpen }: { pet: Pet; onOpen: () => void }) {
  const { tasksForPetToday, weights } = useApp();
  const petTasks = tasksForPetToday(pet.id);
  const done = petTasks.filter((t) => t.done).length;
  const entries = weights.filter((w) => w.petId === pet.id);
  const latest = entries[entries.length - 1];
  return (
    <Card>
      <View style={{ alignItems: 'center' }}>
        <PetAvatar pet={pet} size={120} />
        <Text style={styles.petName}>{pet.name}</Text>
        <Text style={styles.petBreed}>
          {pet.breed} · {pet.ageYears} years old
        </Text>
        <Text style={styles.petBreed}>
          {formatWeight(pet.weight, pet.weightUnit)}
          {latest ? ` · last weighed ${formatShortDate(latest.date)}` : ''}
        </Text>
        <Text style={styles.petRowMeta}>🐾 {done}/{petTasks.length} cares done today</Text>
        {pet.notes ? <Text style={styles.petNotes}>{pet.notes}</Text> : null}
        <View style={{ marginTop: spacing.md, width: '100%' }}>
          <PrimaryButton label={`Open ${pet.name}'s page`} onPress={onOpen} />
        </View>
      </View>
    </Card>
  );
}

/** Health panel — vaccinations due, weight chart, vet visits. */
export function HealthPanel() {
  const { pets, vaccinations, weights, vetVisits } = useApp();
  const router = useRouter();
  const [petId, setPetId] = useState<string | null>(null);
  const pet = pets.find((p) => p.id === petId) ?? pets[0] ?? null;
  const vax = (pet ? vaccinations.filter((v) => v.petId === pet.id) : []).sort((a, b) =>
    a.dueDate.localeCompare(b.dueDate),
  );
  const entries = (pet ? weights.filter((w) => w.petId === pet.id) : []).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const visits = (pet ? vetVisits.filter((v) => v.petId === pet.id) : []).sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  const maxGrams = Math.max(...entries.map((e) => weightInGrams(e.weight, e.unit)), 1);
  return (
    <View>
      <Text style={styles.sectionTitle}>Health</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
        {pets.map((p) => (
          <Chip
            key={p.id}
            label={p.name}
            selected={pet?.id === p.id}
            onPress={() => setPetId(p.id)}
          />
        ))}
      </ScrollView>
      {!pet ? (
        <EmptyState
          glyph="🩺"
          title="No pets yet"
          body="Add a pet first and their vaccinations and weight will live here."
          actionLabel="Add a pet"
          onAction={() => router.push('/new-pet')}
        />
      ) : (
        <>
          <Text style={styles.subTitle}>Vaccinations · {pet.name}</Text>
          {vax.length === 0 ? (
            <Text style={styles.mutedText}>No vaccinations tracked yet.</Text>
          ) : (
            <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
              {vax.map((v) => (
                <Card key={v.id}>
                  <View style={styles.vaxRow}>
                    <Text style={styles.vaxName}>{v.name}</Text>
                    <Text style={styles.vaxDate}>
                      {v.done ? 'Done ✓' : `Due ${formatShortDate(v.dueDate)}`}
                    </Text>
                  </View>
                </Card>
              ))}
            </View>
          )}
          <Text style={styles.subTitle}>Weight · {pet.name}</Text>
          {entries.length === 0 ? (
            <Text style={styles.mutedText}>No weigh-ins yet — log one from the pet page.</Text>
          ) : (
            <Card style={{ marginBottom: spacing.lg }}>
              <View style={styles.chart}>
                {entries.map((e) => {
                  const grams = weightInGrams(e.weight, e.unit);
                  const height = Math.max(24, (grams / maxGrams) * 120);
                  return (
                    <View key={e.id} style={styles.barCol}>
                      <Text style={styles.barValue}>{e.weight}</Text>
                      <View style={[styles.bar, { height, backgroundColor: palette.coral }]} />
                      <Text style={styles.barLabel}>{formatShortDate(e.date)}</Text>
                    </View>
                  );
                })}
              </View>
              <Text style={styles.mutedText}>
                Latest: {formatWeight(entries[entries.length - 1].weight, entries[entries.length - 1].unit)} ·{' '}
                {entries[entries.length - 1].unit === 'g' ? 'grams' : 'kilograms'}
              </Text>
            </Card>
          )}
          <Text style={styles.subTitle}>Vet visits · {pet.name}</Text>
          {visits.length === 0 ? (
            <Text style={styles.mutedText}>No vet visits recorded yet.</Text>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {visits.map((v) => (
                <Card key={v.id}>
                  <Text style={styles.vaxName}>{v.reason}</Text>
                  <Text style={styles.vaxDate}>{formatShortDate(v.date)}</Text>
                </Card>
              ))}
            </View>
          )}
          <View style={{ marginTop: spacing.lg }}>
            <GhostButton label={`Open ${pet.name}'s page`} onPress={() => router.push(`/pet/${pet.id}`)} />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: palette.ground, flex: 1 },
  scroll: { paddingBottom: spacing.xxl },
  pullBall: { alignItems: 'center', height: 0, overflow: 'visible', zIndex: 5 },
  refreshBanner: {
    alignItems: 'center',
    backgroundColor: palette.sunnySoft,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  refreshText: { ...type.bodyStrong, color: palette.primary },
  refreshNote: { ...type.bodyStrong, color: palette.success, textAlign: 'center' },
  headerRow: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm },
  kicker: { ...type.label, color: palette.coralDeep },
  hello: { color: palette.ink, marginTop: 2 },
  sub: { ...type.body, color: palette.body, marginTop: 4 },
  carousel: { marginHorizontal: -20, paddingHorizontal: 20 },
  petCard: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.line,
    borderRadius: radii.card,
    borderWidth: 1,
    minHeight: 180,
    padding: spacing.md,
    width: 168,
    ...shadows.float,
  },
  petCardSelected: {
    borderColor: palette.coral,
    borderWidth: 2,
    ...shadows.coralGlow,
  },
  addPetCard: { backgroundColor: palette.primaryPale, borderStyle: 'dashed' },
  addPetGlyph: { color: palette.primary, fontSize: 40, fontWeight: '800' },
  petName: { ...type.title, color: palette.ink, fontSize: 22, marginTop: spacing.sm, textAlign: 'center' },
  petBreed: { ...type.body, color: palette.body, textAlign: 'center' },
  petPill: {
    backgroundColor: palette.sunnySoft,
    borderRadius: radii.pill,
    marginTop: spacing.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  petPillText: { color: palette.sunnyDeep, fontSize: 12, fontWeight: '800' },
  nextUp: { backgroundColor: palette.glass },
  nextUpKicker: { ...type.label, color: palette.coralDeep },
  nextUpTitle: { ...type.title, color: palette.ink, marginTop: 4 },
  nextUpMeta: { ...type.body, color: palette.body, marginTop: 4 },
  askCard: {
    alignItems: 'center',
    backgroundColor: palette.primary,
    borderRadius: radii.card,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.glow,
  },
  askGlyph: { fontSize: 36 },
  askTitle: { color: '#FFFFFF', fontFamily: 'Fredoka_700Bold', fontSize: 22 },
  askBody: { color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 20, marginTop: 2 },
  askArrow: { color: '#FFFFFF', fontSize: 28, fontWeight: '800' },
  sectionTitle: { ...type.title, color: palette.ink, marginBottom: spacing.md },
  subTitle: { ...type.subtitle, color: palette.ink, marginBottom: spacing.sm },
  mutedText: { ...type.body, color: palette.body, marginBottom: spacing.md },
  taskRow: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.line,
    borderRadius: radii.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    ...shadows.float,
  },
  checkCircle: {
    alignItems: 'center',
    borderColor: palette.primaryLight,
    borderRadius: 999,
    borderWidth: 2,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  checkCircleDone: { backgroundColor: palette.leaf, borderColor: palette.leaf },
  checkMark: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  taskBody: { flex: 1 },
  taskTitle: { ...type.bodyStrong, color: palette.ink },
  taskDone: { color: palette.muted, textDecorationLine: 'line-through' },
  taskMeta: { ...type.body, color: palette.body, fontSize: 13, marginTop: 2 },
  doneNote: { color: palette.success, fontSize: 13, fontWeight: '700', marginTop: 4 },
  twoPane: { flexDirection: 'row', gap: spacing.lg },
  petRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  petRowName: { ...type.title, color: palette.ink, fontSize: 22 },
  petRowMeta: { ...type.body, color: palette.body, marginTop: 2 },
  petRowArrow: { color: palette.primary, fontSize: 26, fontWeight: '800' },
  petNotes: { ...type.body, color: palette.body, marginTop: spacing.sm, textAlign: 'center' },
  vaxRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  vaxName: { ...type.bodyStrong, color: palette.ink },
  vaxDate: { ...type.body, color: palette.body, fontSize: 13 },
  chart: { alignItems: 'flex-end', flexDirection: 'row', gap: spacing.md, justifyContent: 'center', minHeight: 160 },
  barCol: { alignItems: 'center', gap: 6, justifyContent: 'flex-end' },
  barValue: { fontSize: 13, fontWeight: '800', color: palette.ink },
  bar: { borderRadius: 8, width: 36 },
  barLabel: { color: palette.muted, fontSize: 11, fontWeight: '700' },
});
