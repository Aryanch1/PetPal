import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useApp } from '@/lib/store';
import { palette, spacing, type, useResponsive } from '@/lib/theme';
import { Card, EmptyState, GhostButton, Header, SpringPress } from '@/components/ui';

/** History — past questions, checked-off cares and weigh-ins, one tap to re-use. */
export default function HistoryScreen() {
  const { history, applyHistory, clearHistory } = useApp();
  const router = useRouter();
  const r = useResponsive();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { maxWidth: r.contentMaxWidth, alignSelf: 'center', width: '100%' }]}
      >
        <View style={{ padding: r.pad }}>
          <Header title="History" onBack={() => router.back()} />
          {history.length === 0 ? (
            <EmptyState
              glyph="🐾"
              title="Nothing saved yet"
              body="Questions you ask, cares you check off, and weigh-ins will show up here for one-tap re-use."
              actionLabel="Back to Today"
              onAction={() => router.replace('/')}
            />
          ) : (
            <>
              <View style={{ gap: spacing.sm }}>
                {history.map((entry) => {
                  const pet = applyHistory(entry);
                  return (
                    <SpringPress
                      key={entry.id}
                      onPress={() => {
                        if (pet) router.push(`/pet/${pet.id}`);
                      }}
                    >
                      <Card>
                        <Text style={styles.entryTitle}>{entry.title}</Text>
                        <Text style={styles.entryMeta}>
                          {entry.petName} ·{' '}
                          {new Date(entry.at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          ·{' '}
                          {entry.kind === 'asked'
                            ? 'Asked PetPal'
                            : entry.kind === 'checked'
                              ? 'Care done'
                              : 'Weigh-in'}
                          {pet ? ' · tap to open pet ›' : ''}
                        </Text>
                      </Card>
                    </SpringPress>
                  );
                })}
              </View>
              <View style={{ marginTop: spacing.lg }}>
                <GhostButton label="Clear history" onPress={clearHistory} />
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: palette.ground, flex: 1 },
  scroll: { paddingBottom: spacing.xxl },
  entryTitle: { ...type.bodyStrong, color: palette.ink },
  entryMeta: { ...type.body, color: palette.body, fontSize: 13, marginTop: 4 },
});
