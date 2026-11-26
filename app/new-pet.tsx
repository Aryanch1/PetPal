import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PET_SPECIES } from '@/lib/types';
import type { PetSpecies, WeightUnit } from '@/lib/types';
import { useApp } from '@/lib/store';
import { palette, spacing, type, useResponsive } from '@/lib/theme';
import { Chip, Header, PrimaryButton, StyledInput } from '@/components/ui';

/** Add a pet — name, species, breed, age, weight and a note. */
export default function NewPetScreen() {
  const { addPet, pets } = useApp();
  const router = useRouter();
  const r = useResponsive();
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<PetSpecies>('Dog');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState<WeightUnit>('kg');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function save() {
    if (!name.trim()) return setError('Please give your pet a name.');
    const ageYears = Number(age);
    const weightValue = Number(weight);
    if (!age || Number.isNaN(ageYears) || ageYears < 0 || ageYears > 40) {
      return setError('Please enter an age in years (0 to 40).');
    }
    if (!weight || Number.isNaN(weightValue) || weightValue <= 0) {
      return setError('Please enter a weight above zero.');
    }
    const pet = addPet({
      name,
      species,
      breed: breed.trim() || species,
      ageYears,
      weight: weightValue,
      weightUnit: unit,
      notes,
    });
    setSaved(true);
    setError(null);
    setTimeout(() => router.replace(`/pet/${pet.id}`), 700);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { maxWidth: r.contentMaxWidth, alignSelf: 'center', width: '100%' }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ padding: r.pad }}>
          <Header title="Add a pet" onBack={() => router.back()} />
          <Text style={styles.label}>NAME</Text>
          <StyledInput placeholder="Milo, Luna, Kiwi…" value={name} onChangeText={setName} autoCapitalize="words" />
          <Text style={[styles.label, { marginTop: spacing.lg }]}>SPECIES</Text>
          <View style={styles.chips}>
            {PET_SPECIES.map((s) => (
              <Chip key={s} label={s} selected={species === s} onPress={() => setSpecies(s)} />
            ))}
          </View>
          <Text style={[styles.label, { marginTop: spacing.lg }]}>BREED</Text>
          <StyledInput placeholder="Golden Retriever, Tabby, Budgie…" value={breed} onChangeText={setBreed} />
          <Text style={[styles.label, { marginTop: spacing.lg }]}>AGE (YEARS)</Text>
          <StyledInput placeholder="3" value={age} onChangeText={setAge} keyboardType="decimal-pad" />
          <Text style={[styles.label, { marginTop: spacing.lg }]}>WEIGHT</Text>
          <View style={styles.weightRow}>
            <StyledInput
              placeholder="28"
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              style={{ flex: 1 }}
            />
            <Chip label="kg" selected={unit === 'kg'} onPress={() => setUnit('kg')} />
            <Chip label="g" selected={unit === 'g'} onPress={() => setUnit('g')} />
          </View>
          <Text style={[styles.label, { marginTop: spacing.lg }]}>NOTES (OPTIONAL)</Text>
          <StyledInput
            placeholder="Gentle, loves walks, indoor only…"
            value={notes}
            onChangeText={setNotes}
            multiline
            style={styles.notesInput}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {saved ? (
            <Text style={styles.saved}>Saved — welcome to the family! 🐾 Opening their page…</Text>
          ) : null}
          <View style={{ marginTop: spacing.lg }}>
            <PrimaryButton label="Add pet" onPress={save} />
          </View>
          <Text style={styles.fine}>
            {pets.length} pet{pets.length === 1 ? '' : 's'} in PetPal already.
          </Text>
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
  weightRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  notesInput: { minHeight: 80, paddingTop: 14, textAlignVertical: 'top' },
  error: { ...type.bodyStrong, color: palette.error, marginTop: spacing.md, textAlign: 'center' },
  saved: { ...type.bodyStrong, color: palette.success, marginTop: spacing.md, textAlign: 'center' },
  fine: { ...type.caption, color: palette.muted, marginTop: spacing.md, textAlign: 'center' },
});
