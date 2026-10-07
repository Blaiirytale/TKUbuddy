import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SuggestionCard, { CATEGORY_COLORS } from '../components/SuggestionCard';
import { Colors } from '../constants/colors';
import {
  CATEGORY_LABELS,
  fetchSuggestions,
  SuggestionCategory,
  SuggestionsResult,
} from '../data/suggestionsData';

// TEMPORARY: will come from the login later
const STUDENT_ID = '411000001';

type Filter = 'all' | SuggestionCategory;

export default function SuggestionsScreen() {
  const router = useRouter();
  const [data, setData] = useState<SuggestionsResult | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  // BACKEND TODO: the Planner will own this list later
  const [addedIds, setAddedIds] = useState<string[]>([]);

  useEffect(() => {
    fetchSuggestions(STUDENT_ID).then(setData);
  }, []);

  function toggleAdd(id: string, hasConflict: boolean) {
    if (addedIds.includes(id)) {
      setAddedIds(addedIds.filter((x) => x !== id)); // remove it
      return;
    }
    if (hasConflict) {
      Alert.alert(
        'Time conflict',
        'This course overlaps a class already in your schedule. Add it anyway?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add anyway', onPress: () => setAddedIds([...addedIds, id]) },
        ]
      );
      return;
    }
    setAddedIds([...addedIds, id]);
  }

  // only categories that still need credits get a filter chip
  const filters: Filter[] = data
    ? ['all', ...data.missing.filter((m) => m.missing > 0).map((m) => m.category)]
    : ['all'];

  const totalMissing = data ? data.missing.reduce((sum, m) => sum + m.missing, 0) : 0;
  const visible = data
    ? data.suggestions.filter((s) => filter === 'all' || s.category === filter)
    : [];

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={28} color={Colors.white} />
          </Pressable>
          <Text style={styles.headerTitle}>Course Suggestions</Text>
          <View style={{ width: 28 }} />
        </View>

        {!data ? (
          <Text style={styles.loading}>Loading suggestions...</Text>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            {/* SUMMARY: what's still missing */}
            <View style={styles.summary}>
              <Text style={styles.summaryLabel}>You still need</Text>
              <Text style={styles.summaryNumber}>
                {totalMissing} <Text style={styles.summaryUnit}>credits</Text>
              </Text>
              <View style={styles.missingRow}>
                {data.missing
                  .filter((m) => m.missing > 0)
                  .map((m) => (
                    <View key={m.category} style={styles.missingChip}>
                      <View
                        style={[styles.dot, { backgroundColor: CATEGORY_COLORS[m.category] }]}
                      />
                      <Text style={styles.missingText}>
                        {CATEGORY_LABELS[m.category]} · {m.missing}
                      </Text>
                    </View>
                  ))}
              </View>
            </View>

            {/* FILTER CHIPS */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filters}
            >
              {filters.map((f) => {
                const active = filter === f;
                return (
                  <Pressable
                    key={f}
                    onPress={() => setFilter(f)}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                  >
                    <Text style={[styles.filterText, active && styles.filterTextActive]}>
                      {f === 'all' ? 'All' : CATEGORY_LABELS[f]}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* COURSE LIST */}
            {visible.length === 0 ? (
              <Text style={styles.empty}>No suggestions in this category right now.</Text>
            ) : (
              visible.map((course) => (
                <SuggestionCard
                  key={course.id}
                  course={course}
                  added={addedIds.includes(course.id)}
                  onToggleAdd={() => toggleAdd(course.id, course.hasConflict)}
                />
              ))
            )}

            {addedIds.length > 0 && (
              <Text style={styles.addedNote}>
                {addedIds.length} course{addedIds.length > 1 ? 's' : ''} added to your planner
              </Text>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: { color: Colors.white, fontSize: 22, fontWeight: 'bold' },
  loading: { color: Colors.white, textAlign: 'center', marginTop: 40 },
  content: { padding: 24, paddingTop: 8, paddingBottom: 48 },

  summary: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  summaryLabel: { color: Colors.muted, fontSize: 14 },
  summaryNumber: { color: Colors.coral, fontSize: 40, fontWeight: 'bold', marginTop: 2 },
  summaryUnit: { color: Colors.white, fontSize: 18, fontWeight: '600' },
  missingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  missingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.cardLight,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  missingText: { color: Colors.white, fontSize: 12, fontWeight: '600' },

  filters: { gap: 8, paddingBottom: 16 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: Colors.card,
  },
  filterChipActive: { backgroundColor: Colors.white },
  filterText: { color: Colors.white, fontSize: 14, fontWeight: '600' },
  filterTextActive: { color: Colors.card },

  empty: { color: Colors.white, textAlign: 'center', marginTop: 24 },
  addedNote: {
    color: Colors.white,
    opacity: 0.8,
    textAlign: 'center',
    marginTop: 8,
    fontSize: 13,
  },
});
