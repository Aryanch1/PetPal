import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  auth,
  db,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from './firebase';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from './firebase';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { firebaseConfigured } from './config';
import {
  seedPets,
  seedTasks,
  seedVaccinations,
  seedVetVisits,
  seedWeights,
  todayIso,
} from './data';
import { signInWithGoogle } from './google';
import type {
  CareKind,
  CareTask,
  HistoryEntry,
  Pet,
  PetSpecies,
  Vaccination,
  VetVisit,
  WeightEntry,
  WeightUnit,
} from './types';

const PETS_KEY = 'petpal:pets:v1';
const TASKS_KEY = 'petpal:tasks:v1';
const VAX_KEY = 'petpal:vaccinations:v1';
const WEIGHTS_KEY = 'petpal:weights:v1';
const VISITS_KEY = 'petpal:vetvisits:v1';
const HISTORY_KEY = 'petpal:history:v1';
const SEEDED_KEY = 'petpal:seeded:v1';
const HISTORY_LIMIT = 30;

export interface AuthUser {
  uid: string;
  name: string | null;
  email: string | null;
  photo: string | null;
  /** 'google.com' or 'password' — how this account signs in. */
  provider: string | null;
}

export interface AddPetInput {
  name: string;
  species: PetSpecies;
  breed: string;
  ageYears: number;
  weight: number;
  weightUnit: WeightUnit;
  notes: string;
}

export interface AddTaskInput {
  petId: string;
  title: string;
  kind: CareKind;
  time: string;
  notes: string;
}

export interface AppState {
  pets: Pet[];
  tasks: CareTask[];
  vaccinations: Vaccination[];
  weights: WeightEntry[];
  vetVisits: VetVisit[];
  history: HistoryEntry[];
  /** Today's tasks for one pet, soonest first. */
  tasksForPetToday: (petId: string) => CareTask[];
  /** Today's tasks across all pets, soonest first. */
  todaysTasks: CareTask[];
  /** Next undone task today, or null when the day is all done. */
  nextTask: CareTask | null;
  /** Demo pets/tasks hidden (not deleted) while off. */
  showDemoData: boolean;
  setShowDemoData: (show: boolean) => void;
  user: AuthUser | null;
  authReady: boolean;
  guest: boolean;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  setAvatarData: (dataUrl: string) => Promise<void>;
  sendPasswordReset: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
  addPet: (input: AddPetInput) => Pet;
  updatePet: (id: string, patch: Partial<Pet>) => void;
  deletePet: (id: string) => void;
  addTask: (input: AddTaskInput) => CareTask;
  updateTask: (id: string, patch: Partial<CareTask>) => void;
  deleteTask: (id: string) => void;
  toggleTaskDone: (id: string) => void;
  addWeight: (petId: string, weight: number, unit: WeightUnit) => WeightEntry;
  toggleVaccination: (id: string) => void;
  addVaccination: (petId: string, name: string, dueDate: string) => Vaccination;
  addVetVisit: (petId: string, date: string, reason: string) => VetVisit;
  recordHistory: (entry: Omit<HistoryEntry, 'id' | 'at'>) => void;
  applyHistory: (entry: HistoryEntry) => Pet | null;
  clearHistory: () => void;
  clearDemoData: () => void;
  petById: (id: string) => Pet | undefined;
}

const AppContext = createContext<AppState | null>(null);

function loadJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const TILE_COLORS = ['#F2A93B', '#8A6A54', '#3E9B4F', '#F26B4E', '#E8A100'];

async function upsertProfile(u: User): Promise<void> {
  if (!firebaseConfigured) return;
  try {
    const ref = doc(db, 'users', u.uid);
    const snap = await getDoc(ref);
    const base = {
      displayName: u.displayName ?? '',
      email: u.email ?? '',
      photoURL: u.photoURL ?? '',
      lastLoginAt: serverTimestamp(),
    };
    if (!snap.exists()) {
      await setDoc(ref, { ...base, createdAt: serverTimestamp() });
    } else {
      await setDoc(ref, base, { merge: true });
    }
  } catch {
    // Sync is best-effort; the app keeps working offline.
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [tasks, setTasks] = useState<CareTask[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [vetVisits, setVetVisits] = useState<VetVisit[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showDemoData, setShowDemoDataState] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [guest, setGuest] = useState(false);
  const petsRef = useRef<Pet[]>([]);
  const tasksRef = useRef<CareTask[]>([]);
  const vaxRef = useRef<Vaccination[]>([]);
  const weightsRef = useRef<WeightEntry[]>([]);
  const visitsRef = useRef<VetVisit[]>([]);
  const historyRef = useRef<HistoryEntry[]>([]);
  const historyLoadedRef = useRef(false);
  const unsubsRef = useRef<(() => void)[]>([]);

  // Local data loads once at startup; first launch seeds demo pets.
  useEffect(() => {
    void (async () => {
      const [pRaw, tRaw, vRaw, wRaw, vvRaw, hRaw, seeded] = await Promise.all([
        AsyncStorage.getItem(PETS_KEY),
        AsyncStorage.getItem(TASKS_KEY),
        AsyncStorage.getItem(VAX_KEY),
        AsyncStorage.getItem(WEIGHTS_KEY),
        AsyncStorage.getItem(VISITS_KEY),
        AsyncStorage.getItem(HISTORY_KEY),
        AsyncStorage.getItem(SEEDED_KEY),
      ]);
      const p = loadJson<Pet[]>(pRaw);
      if (p && p.length > 0) {
        setPets(p);
        setTasks(loadJson<CareTask[]>(tRaw) ?? []);
        setVaccinations(loadJson<Vaccination[]>(vRaw) ?? []);
        setWeights(loadJson<WeightEntry[]>(wRaw) ?? []);
        setVetVisits(loadJson<VetVisit[]>(vvRaw) ?? []);
        setHistory(loadJson<HistoryEntry[]>(hRaw) ?? []);
      } else if (!seeded) {
        setPets(seedPets());
        setTasks(seedTasks());
        setVaccinations(seedVaccinations());
        setWeights(seedWeights());
        setVetVisits(seedVetVisits());
        setHistory([]);
        await AsyncStorage.setItem(SEEDED_KEY, '1');
      }
      historyLoadedRef.current = true;
    })();
  }, []);

  // Local mirrors.
  useEffect(() => {
    petsRef.current = pets;
    AsyncStorage.setItem(PETS_KEY, JSON.stringify(pets)).catch(() => undefined);
  }, [pets]);
  useEffect(() => {
    tasksRef.current = tasks;
    AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks)).catch(() => undefined);
  }, [tasks]);
  useEffect(() => {
    vaxRef.current = vaccinations;
    AsyncStorage.setItem(VAX_KEY, JSON.stringify(vaccinations)).catch(() => undefined);
  }, [vaccinations]);
  useEffect(() => {
    weightsRef.current = weights;
    AsyncStorage.setItem(WEIGHTS_KEY, JSON.stringify(weights)).catch(() => undefined);
  }, [weights]);
  useEffect(() => {
    visitsRef.current = vetVisits;
    AsyncStorage.setItem(VISITS_KEY, JSON.stringify(vetVisits)).catch(() => undefined);
  }, [vetVisits]);
  useEffect(() => {
    historyRef.current = history;
    if (!historyLoadedRef.current) return;
    AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history)).catch(() => undefined);
  }, [history]);

  // Auth state: profile write, cloud subscriptions.
  // Readiness waits for Firebase to finish restoring any persisted
  // session from storage — the gate must not decide "signed out" (and
  // show Welcome) before the saved session has had its chance to load.
  useEffect(() => {
    let alive = true;
    void auth.authStateReady().then(() => {
      if (alive) setAuthReady(true);
    });
    const unsub = onAuthStateChanged(auth, (u) => {
      for (const fn of unsubsRef.current) fn();
      unsubsRef.current = [];
      if (!u) {
        setUser(null);
        return;
      }
      setUser({
        uid: u.uid,
        name: u.displayName,
        email: u.email,
        photo: u.photoURL,
        provider: u.providerData[0]?.providerId ?? null,
      });
      void upsertProfile(u);
      if (!firebaseConfigured) return;

      const subscribe = <T,>(
        colName: string,
        apply: (items: T[]) => void,
        local: () => T[],
        idOf: (item: T) => string,
      ) => {
        const col = collection(db, 'users', u.uid, colName);
        unsubsRef.current.push(
          onSnapshot(
            col,
            (snap) => {
              apply(snap.docs.map((d) => d.data() as T));
            },
            () => undefined,
          ),
        );
        // One-time merge: anything saved locally before sign-in joins the account.
        void (async () => {
          try {
            const cloud = await getDocs(col);
            const cloudIds = new Set(cloud.docs.map((d) => d.id));
            for (const item of local()) {
              const id = idOf(item);
              if (!cloudIds.has(id)) {
                await setDoc(
                  doc(db, 'users', u.uid, colName, id),
                  item as unknown as Record<string, unknown>,
                );
              }
            }
          } catch {
            // Best-effort merge only.
          }
        })();
      };
      subscribe<Pet>('pets', setPets, () => petsRef.current, (e) => e.id);
      subscribe<CareTask>('tasks', setTasks, () => tasksRef.current, (e) => e.id);
      subscribe<Vaccination>('vaccinations', setVaccinations, () => vaxRef.current, (e) => e.id);
      subscribe<WeightEntry>('weights', setWeights, () => weightsRef.current, (e) => e.id);
      subscribe<VetVisit>('vetvisits', setVetVisits, () => visitsRef.current, (e) => e.id);
      subscribe<HistoryEntry>('history', setHistory, () => historyRef.current, (h) => h.id);

      // Profile doc: a custom avatar / edited name stored there overrides
      // the auth copy.
      void (async () => {
        try {
          const snap = await getDoc(doc(db, 'users', u.uid));
          if (snap.exists()) {
            const data = snap.data();
            setUser((prev) =>
              prev && prev.uid === u.uid
                ? {
                    ...prev,
                    name: (data.displayName as string) || prev.name,
                    photo: (data.photoData as string) || prev.photo,
                  }
                : prev,
            );
          }
        } catch {
          // Keep the auth profile.
        }
      })();
    });
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  const visiblePets = useMemo(
    () => (showDemoData ? pets : pets.filter((p) => !p.isDemo)),
    [pets, showDemoData],
  );
  const visibleTasks = useMemo(
    () => (showDemoData ? tasks : tasks.filter((t) => !t.isDemo)),
    [tasks, showDemoData],
  );
  const visibleVaccinations = useMemo(
    () => (showDemoData ? vaccinations : vaccinations.filter((v) => !v.isDemo)),
    [vaccinations, showDemoData],
  );
  const visibleWeights = useMemo(
    () => (showDemoData ? weights : weights.filter((w) => !w.isDemo)),
    [weights, showDemoData],
  );
  const visibleVetVisits = useMemo(
    () => (showDemoData ? vetVisits : vetVisits.filter((v) => !v.isDemo)),
    [vetVisits, showDemoData],
  );

  const todaysTasks = useMemo(() => {
    const today = todayIso();
    return [...visibleTasks]
      .filter((t) => t.date === today)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [visibleTasks]);

  const nextTask = useMemo(
    () => todaysTasks.find((t) => !t.done) ?? null,
    [todaysTasks],
  );

  const tasksForPetToday = useCallback(
    (petId: string) =>
      todaysTasks.filter((t) => t.petId === petId),
    [todaysTasks],
  );

  const signIn = useCallback(async () => {
    await signInWithGoogle();
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const signUpWithEmail = useCallback(
    async (name: string, email: string, password: string) => {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const cleanName = name.trim();
      if (cleanName) {
        await updateProfile(cred.user, { displayName: cleanName });
        setUser({
          uid: cred.user.uid,
          name: cleanName,
          email: cred.user.email,
          photo: null,
          provider: 'password',
        });
        void upsertProfile({ ...cred.user, displayName: cleanName } as User);
      }
    },
    [],
  );

  const updateDisplayName = useCallback(async (name: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const clean = name.trim();
    await updateProfile(currentUser, { displayName: clean });
    if (firebaseConfigured) {
      await setDoc(doc(db, 'users', currentUser.uid), { displayName: clean }, { merge: true });
    }
    setUser((prev) => (prev ? { ...prev, name: clean } : prev));
  }, []);

  const setAvatarData = useCallback(async (dataUrl: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    if (firebaseConfigured) {
      await setDoc(doc(db, 'users', currentUser.uid), { photoData: dataUrl }, { merge: true });
    }
    setUser((prev) => (prev ? { ...prev, photo: dataUrl } : prev));
  }, []);

  const sendPasswordReset = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser?.email) return;
    await sendPasswordResetEmail(auth, currentUser.email);
  }, []);

  const resetPasswordForEmail = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    // Back to the welcome screen — the gate routes there as soon as the
    // user is signed out and not a guest.
    setGuest(false);
  }, []);

  const continueAsGuest = useCallback(() => {
    // Deliberately NOT persisted: guest lasts for this visit only, so the
    // next open asks for sign-in again. A signed-in user, by contrast,
    // stays signed in (Firebase Auth persistence).
    setGuest(true);
  }, []);

  const syncDoc = useCallback(
    (colName: string, id: string, data: unknown) => {
      if (!user || !firebaseConfigured) return;
      void setDoc(doc(db, 'users', user.uid, colName, id), data).catch(() => undefined);
    },
    [user],
  );

  const deleteDocCloud = useCallback(
    (colName: string, id: string) => {
      if (!user || !firebaseConfigured) return;
      void deleteDoc(doc(db, 'users', user.uid, colName, id)).catch(() => undefined);
    },
    [user],
  );

  const recordHistory = useCallback(
    (entry: Omit<HistoryEntry, 'id' | 'at'>) => {
      const full: HistoryEntry = { ...entry, id: uid('h'), at: Date.now() };
      setHistory((prev) => [full, ...prev].slice(0, HISTORY_LIMIT));
      syncDoc('history', full.id, full);
    },
    [syncDoc],
  );

  const addPet = useCallback(
    (input: AddPetInput): Pet => {
      const pet: Pet = {
        id: uid('pet'),
        name: input.name.trim(),
        species: input.species,
        breed: input.breed.trim(),
        ageYears: input.ageYears,
        weight: input.weight,
        weightUnit: input.weightUnit,
        photoKey: null,
        tileColor: TILE_COLORS[petsRef.current.length % TILE_COLORS.length],
        notes: input.notes.trim(),
        isDemo: false,
        createdAt: Date.now(),
      };
      setPets((prev) => [...prev, pet]);
      syncDoc('pets', pet.id, pet);
      return pet;
    },
    [syncDoc],
  );

  const updatePet = useCallback(
    (id: string, patch: Partial<Pet>) => {
      setPets((prev) => {
        const next = prev.map((p) => (p.id === id ? { ...p, ...patch } : p));
        const updated = next.find((p) => p.id === id);
        if (updated) syncDoc('pets', id, updated);
        return next;
      });
    },
    [syncDoc],
  );

  const deletePet = useCallback(
    (id: string) => {
      setPets((prev) => prev.filter((p) => p.id !== id));
      setTasks((prev) => prev.filter((t) => t.petId !== id));
      setVaccinations((prev) => prev.filter((v) => v.petId !== id));
      setWeights((prev) => prev.filter((w) => w.petId !== id));
      setVetVisits((prev) => prev.filter((v) => v.petId !== id));
      deleteDocCloud('pets', id);
    },
    [deleteDocCloud],
  );

  const addTask = useCallback(
    (input: AddTaskInput): CareTask => {
      const task: CareTask = {
        id: uid('task'),
        petId: input.petId,
        title: input.title.trim(),
        kind: input.kind,
        time: input.time,
        done: false,
        date: todayIso(),
        notes: input.notes.trim(),
        isDemo: false,
        createdAt: Date.now(),
      };
      setTasks((prev) => [...prev, task]);
      syncDoc('tasks', task.id, task);
      return task;
    },
    [syncDoc],
  );

  const updateTask = useCallback(
    (id: string, patch: Partial<CareTask>) => {
      setTasks((prev) => {
        const next = prev.map((t) => (t.id === id ? { ...t, ...patch } : t));
        const updated = next.find((t) => t.id === id);
        if (updated) syncDoc('tasks', id, updated);
        return next;
      });
    },
    [syncDoc],
  );

  const deleteTask = useCallback(
    (id: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      deleteDocCloud('tasks', id);
    },
    [deleteDocCloud],
  );

  /** Check off / uncheck a care task; checking off records a history entry. */
  const toggleTaskDone = useCallback(
    (id: string) => {
      const task = tasksRef.current.find((t) => t.id === id);
      if (!task) return;
      const done = !task.done;
      updateTask(id, { done });
      if (done) {
        const pet = petsRef.current.find((p) => p.id === task.petId);
        recordHistory({
          petId: task.petId,
          petName: pet?.name ?? 'Pet',
          title: `${task.title} — done`,
          kind: 'checked',
        });
      }
    },
    [updateTask, recordHistory],
  );

  const addWeight = useCallback(
    (petId: string, weight: number, unit: WeightUnit): WeightEntry => {
      const entry: WeightEntry = {
        id: uid('w'),
        petId,
        date: todayIso(),
        weight,
        unit,
        isDemo: false,
        createdAt: Date.now(),
      };
      setWeights((prev) => [...prev, entry]);
      syncDoc('weights', entry.id, entry);
      const pet = petsRef.current.find((p) => p.id === petId);
      recordHistory({
        petId,
        petName: pet?.name ?? 'Pet',
        title: `Weighed ${pet?.name ?? 'pet'} — ${weight} ${unit}`,
        kind: 'weighed',
      });
      return entry;
    },
    [syncDoc, recordHistory],
  );

  const toggleVaccination = useCallback(
    (id: string) => {
      const vax = vaxRef.current.find((v) => v.id === id);
      if (!vax) return;
      const done = !vax.done;
      setVaccinations((prev) => {
        const next = prev.map((v) => (v.id === id ? { ...v, done } : v));
        const updated = next.find((v) => v.id === id);
        if (updated) syncDoc('vaccinations', id, updated);
        return next;
      });
    },
    [syncDoc],
  );

  const addVaccination = useCallback(
    (petId: string, name: string, dueDate: string): Vaccination => {
      const vax: Vaccination = {
        id: uid('vax'),
        petId,
        name: name.trim(),
        dueDate,
        done: false,
        isDemo: false,
        createdAt: Date.now(),
      };
      setVaccinations((prev) => [...prev, vax]);
      syncDoc('vaccinations', vax.id, vax);
      return vax;
    },
    [syncDoc],
  );

  const addVetVisit = useCallback(
    (petId: string, date: string, reason: string): VetVisit => {
      const visit: VetVisit = {
        id: uid('vv'),
        petId,
        date,
        reason: reason.trim(),
        isDemo: false,
        createdAt: Date.now(),
      };
      setVetVisits((prev) => [...prev, visit]);
      syncDoc('vetvisits', visit.id, visit);
      return visit;
    },
    [syncDoc],
  );

  const applyHistory = useCallback((entry: HistoryEntry): Pet | null => {
    return petsRef.current.find((p) => p.id === entry.petId) ?? null;
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    if (user && firebaseConfigured) {
      void (async () => {
        try {
          const snap = await getDocs(collection(db, 'users', user.uid, 'history'));
          await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
        } catch {
          // The subscription will reconcile the visible list.
        }
      })();
    }
  }, [user]);

  const clearDemoData = useCallback(() => {
    setPets((prev) => prev.filter((p) => !p.isDemo));
    setTasks((prev) => prev.filter((t) => !t.isDemo));
    setVaccinations((prev) => prev.filter((v) => !v.isDemo));
    setWeights((prev) => prev.filter((w) => !w.isDemo));
    setVetVisits((prev) => prev.filter((v) => !v.isDemo));
    setHistory((prev) => {
      const demoPetIds = new Set(petsRef.current.filter((p) => p.isDemo).map((p) => p.id));
      return prev.filter((h) => !demoPetIds.has(h.petId));
    });
    if (user && firebaseConfigured) {
      for (const pet of petsRef.current.filter((p) => p.isDemo)) {
        void deleteDoc(doc(db, 'users', user.uid, 'pets', pet.id)).catch(() => undefined);
      }
      for (const task of tasksRef.current.filter((t) => t.isDemo)) {
        void deleteDoc(doc(db, 'users', user.uid, 'tasks', task.id)).catch(() => undefined);
      }
      for (const vax of vaxRef.current.filter((v) => v.isDemo)) {
        void deleteDoc(doc(db, 'users', user.uid, 'vaccinations', vax.id)).catch(() => undefined);
      }
      for (const entry of weightsRef.current.filter((w) => w.isDemo)) {
        void deleteDoc(doc(db, 'users', user.uid, 'weights', entry.id)).catch(() => undefined);
      }
      for (const visit of visitsRef.current.filter((v) => v.isDemo)) {
        void deleteDoc(doc(db, 'users', user.uid, 'vetvisits', visit.id)).catch(() => undefined);
      }
    }
  }, [user]);

  const setShowDemoData = useCallback((show: boolean) => {
    setShowDemoDataState(show);
  }, []);

  const petById = useCallback(
    (id: string) => pets.find((p) => p.id === id),
    [pets],
  );

  const value = useMemo<AppState>(
    () => ({
      pets: visiblePets,
      tasks: visibleTasks,
      vaccinations: visibleVaccinations,
      weights: visibleWeights,
      vetVisits: visibleVetVisits,
      history,
      tasksForPetToday,
      todaysTasks,
      nextTask,
      showDemoData,
      setShowDemoData,
      user,
      authReady,
      guest,
      signIn,
      signInWithEmail,
      signUpWithEmail,
      updateDisplayName,
      setAvatarData,
      sendPasswordReset,
      resetPasswordForEmail,
      signOut,
      continueAsGuest,
      addPet,
      updatePet,
      deletePet,
      addTask,
      updateTask,
      deleteTask,
      toggleTaskDone,
      addWeight,
      toggleVaccination,
      addVaccination,
      addVetVisit,
      recordHistory,
      applyHistory,
      clearHistory,
      clearDemoData,
      petById,
    }),
    [
      visiblePets,
      visibleTasks,
      visibleVaccinations,
      visibleWeights,
      visibleVetVisits,
      history,
      tasksForPetToday,
      todaysTasks,
      nextTask,
      showDemoData,
      setShowDemoData,
      user,
      authReady,
      guest,
      signIn,
      signInWithEmail,
      signUpWithEmail,
      updateDisplayName,
      setAvatarData,
      sendPasswordReset,
      resetPasswordForEmail,
      signOut,
      continueAsGuest,
      addPet,
      updatePet,
      deletePet,
      addTask,
      updateTask,
      deleteTask,
      toggleTaskDone,
      addWeight,
      toggleVaccination,
      addVaccination,
      addVetVisit,
      recordHistory,
      applyHistory,
      clearHistory,
      clearDemoData,
      petById,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
