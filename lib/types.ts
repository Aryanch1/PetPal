/** PetPal types — pets, care tasks, vaccinations, weight, history, profile. */

export type PetSpecies = 'Dog' | 'Cat' | 'Bird' | 'Rabbit' | 'Other';

export const PET_SPECIES: PetSpecies[] = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Other'];

export type WeightUnit = 'kg' | 'g';

export interface Pet {
  id: string;
  name: string;
  species: PetSpecies;
  breed: string;
  /** Age in years (whole or half years are fine as a number). */
  ageYears: number;
  weight: number;
  weightUnit: WeightUnit;
  /** Local photo asset key: 'luna' | 'kiwi' | null (initial tile). */
  photoKey: 'luna' | 'kiwi' | null;
  /** Tile colour for pets without a photo. */
  tileColor: string;
  notes: string;
  isDemo: boolean;
  createdAt: number;
}

export type CareKind = 'Feeding' | 'Walk' | 'Medication' | 'Grooming' | 'Play' | 'Vet visit' | 'Other';

export const CARE_KINDS: CareKind[] = [
  'Feeding',
  'Walk',
  'Medication',
  'Grooming',
  'Play',
  'Vet visit',
  'Other',
];

export interface CareTask {
  id: string;
  petId: string;
  title: string;
  kind: CareKind;
  /** HH:MM, 24-hour clock, local time. */
  time: string;
  done: boolean;
  /** ISO date (YYYY-MM-DD) the task belongs to. */
  date: string;
  notes: string;
  isDemo: boolean;
  createdAt: number;
}

export interface Vaccination {
  id: string;
  petId: string;
  name: string;
  /** ISO date (YYYY-MM-DD) it is due. */
  dueDate: string;
  done: boolean;
  isDemo: boolean;
  createdAt: number;
}

export interface WeightEntry {
  id: string;
  petId: string;
  /** ISO date (YYYY-MM-DD) of the weigh-in. */
  date: string;
  weight: number;
  unit: WeightUnit;
  isDemo: boolean;
  createdAt: number;
}

export interface VetVisit {
  id: string;
  petId: string;
  /** ISO date (YYYY-MM-DD) of the visit. */
  date: string;
  reason: string;
  isDemo: boolean;
  createdAt: number;
}

export interface HistoryEntry {
  id: string;
  at: number;
  petId: string;
  petName: string;
  title: string;
  kind: 'asked' | 'checked' | 'weighed';
}

export interface UserProfile {
  uid: string;
  name: string | null;
  email: string | null;
  photo: string | null;
  provider: string | null;
}
