import type {
  CareKind,
  CareTask,
  Pet,
  Vaccination,
  VetVisit,
  WeightEntry,
} from './types';

/** Shift today by `days` and return an ISO date (YYYY-MM-DD). */
export function isoDateFromOffset(days: number, now: Date = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Today's ISO date (YYYY-MM-DD). */
export function todayIso(now: Date = new Date()): string {
  return isoDateFromOffset(0, now);
}

/**
 * Seeded DEMO pets — Milo the Golden Retriever (3y, 28 kg), Luna the
 * Tabby cat (2y, 4.5 kg) and Kiwi the Budgie (1y, 35 g). Milo has no
 * generated photo yet, so he gets a warm initial tile; Luna and Kiwi
 * use their generated portraits. Clearable from Settings.
 */
export function seedPets(now: Date = new Date()): Pet[] {
  const created = now.getTime();
  return [
    {
      id: 'demo-milo',
      name: 'Milo',
      species: 'Dog',
      breed: 'Golden Retriever',
      ageYears: 3,
      weight: 28,
      weightUnit: 'kg',
      photoKey: null,
      tileColor: '#F2A93B',
      notes: 'Gentle, food-motivated, loves the morning walk.',
      isDemo: true,
      createdAt: created,
    },
    {
      id: 'demo-luna',
      name: 'Luna',
      species: 'Cat',
      breed: 'Tabby',
      ageYears: 2,
      weight: 4.5,
      weightUnit: 'kg',
      photoKey: 'luna',
      tileColor: '#8A6A54',
      notes: 'Shy at first, then a lap cat. Indoor only.',
      isDemo: true,
      createdAt: created,
    },
    {
      id: 'demo-kiwi',
      name: 'Kiwi',
      species: 'Bird',
      breed: 'Budgie',
      ageYears: 1,
      weight: 35,
      weightUnit: 'g',
      photoKey: 'kiwi',
      tileColor: '#3E9B4F',
      notes: 'Chatty in the morning. Fresh water every day.',
      isDemo: true,
      createdAt: created,
    },
  ];
}

/** Seeded DEMO care tasks for today — times are today's local times. */
export function seedTasks(now: Date = new Date()): CareTask[] {
  const created = now.getTime();
  const date = todayIso(now);
  const mk = (
    id: string,
    petId: string,
    title: string,
    kind: CareKind,
    time: string,
    notes = '',
  ): CareTask => ({ id, petId, title, kind, time, done: false, date, notes, isDemo: true, createdAt: created });
  return [
    mk('demo-t1', 'demo-milo', 'Breakfast — 2 cups kibble', 'Feeding', '07:30', 'With a spoonful of wet food on Sundays.'),
    mk('demo-t2', 'demo-milo', 'Morning walk — 30 min', 'Walk', '08:00', 'Park loop, bring the tennis ball.'),
    mk('demo-t3', 'demo-luna', 'Breakfast — half a pouch', 'Feeding', '07:30'),
    mk('demo-t4', 'demo-luna', 'Litter box scoop', 'Grooming', '09:00'),
    mk('demo-t5', 'demo-kiwi', 'Fresh water + seed top-up', 'Feeding', '08:30'),
    mk('demo-t6', 'demo-milo', 'Joint supplement with dinner', 'Medication', '18:00', 'One chew, hidden in the kibble.'),
    mk('demo-t7', 'demo-milo', 'Evening walk — 20 min', 'Walk', '18:30'),
    mk('demo-t8', 'demo-luna', 'Play — feather wand, 10 min', 'Play', '19:00'),
    mk('demo-t9', 'demo-kiwi', 'Cover cage for the night', 'Other', '21:00'),
  ];
}

/** Seeded DEMO vaccinations — one due soon, the rest upcoming. */
export function seedVaccinations(now: Date = new Date()): Vaccination[] {
  const created = now.getTime();
  const mk = (id: string, petId: string, name: string, offset: number): Vaccination => ({
    id,
    petId,
    name,
    dueDate: isoDateFromOffset(offset, now),
    done: false,
    isDemo: true,
    createdAt: created,
  });
  return [
    mk('demo-v1', 'demo-milo', 'Rabies booster', 12),
    mk('demo-v2', 'demo-milo', 'DHPP booster', 40),
    mk('demo-v3', 'demo-luna', 'FVRCP booster', 5),
    mk('demo-v4', 'demo-luna', 'Rabies booster', 26),
    mk('demo-v5', 'demo-kiwi', 'Annual avian check', 18),
  ];
}

/** Seeded DEMO weight entries — a short history per pet for the chart. */
export function seedWeights(now: Date = new Date()): WeightEntry[] {
  const created = now.getTime();
  const mk = (
    id: string,
    petId: string,
    offset: number,
    weight: number,
    unit: 'kg' | 'g',
  ): WeightEntry => ({
    id,
    petId,
    date: isoDateFromOffset(offset, now),
    weight,
    unit,
    isDemo: true,
    createdAt: created,
  });
  return [
    mk('demo-w1', 'demo-milo', -60, 27.2, 'kg'),
    mk('demo-w2', 'demo-milo', -30, 27.6, 'kg'),
    mk('demo-w3', 'demo-milo', 0, 28, 'kg'),
    mk('demo-w4', 'demo-luna', -60, 4.3, 'kg'),
    mk('demo-w5', 'demo-luna', -30, 4.4, 'kg'),
    mk('demo-w6', 'demo-luna', 0, 4.5, 'kg'),
    mk('demo-w7', 'demo-kiwi', -30, 33, 'g'),
    mk('demo-w8', 'demo-kiwi', 0, 35, 'g'),
  ];
}

/** Seeded DEMO vet visits — past and upcoming. */
export function seedVetVisits(now: Date = new Date()): VetVisit[] {
  const created = now.getTime();
  const mk = (id: string, petId: string, offset: number, reason: string): VetVisit => ({
    id,
    petId,
    date: isoDateFromOffset(offset, now),
    reason,
    isDemo: true,
    createdAt: created,
  });
  return [
    mk('demo-vv1', 'demo-milo', -45, 'Annual check-up and blood work'),
    mk('demo-vv2', 'demo-luna', -20, 'Dental check'),
    mk('demo-vv3', 'demo-milo', 12, 'Rabies booster appointment'),
  ];
}

/** Whole days from today until the date (negative = past). */
export function daysUntil(iso: string, now: Date = new Date()): number {
  const [y, m, d] = iso.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

/** "7:30 AM" style label for a HH:MM time. */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/** "Dec 3" style short date. */
export function formatShortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/** "Nov 26" style date for the header. */
export function formatToday(now: Date = new Date()): string {
  return now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/** Minutes from now until a HH:MM time today (negative = already passed). */
export function minutesUntilTime(hhmm: string, now: Date = new Date()): number {
  const [h, m] = hhmm.split(':').map(Number);
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
  return Math.round((target.getTime() - now.getTime()) / 60000);
}

/** "in 2h 15m" / "25m ago" style countdown for a task time. */
export function countdownLabel(hhmm: string, now: Date = new Date()): string {
  const mins = minutesUntilTime(hhmm, now);
  if (mins === 0) return 'right now';
  if (mins > 0) {
    if (mins < 60) return `in ${mins}m`;
    return `in ${Math.floor(mins / 60)}h ${mins % 60}m`;
  }
  const ago = -mins;
  if (ago < 60) return `${ago}m ago`;
  return `${Math.floor(ago / 60)}h ${ago % 60}m ago`;
}

/** Weight display with its unit, e.g. "28 kg" or "35 g". */
export function formatWeight(weight: number, unit: 'kg' | 'g'): string {
  return `${weight} ${unit}`;
}

/** Weight in grams, so dogs, cats and budgies share one chart scale. */
export function weightInGrams(weight: number, unit: 'kg' | 'g'): number {
  return unit === 'kg' ? weight * 1000 : weight;
}
