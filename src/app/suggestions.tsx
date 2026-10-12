import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import SuggestionCard, { CATEGORY_COLORS } from '../components/SuggestionCard';
import { ThemeColors } from '../constants/colors';
import { usePlanner } from '../context/PlannerContext';
import { FontScaler, useTheme, useThemedStyles } from '../context/ThemeContext';
import { parseSchedule, PlannedCourse } from '../data/plannerData';
import {
  CATEGORY_LABELS,
  CourseSuggestion,
  fetchSuggestions,
  SuggestionCategory,
  SuggestionsResult,
} from '../data/suggestionsData';

// TEMPORARY: will come from the login later
const STUDENT_ID = '411000001';

type Filter = 'all' | SuggestionCategory;

// a suggestion, written the way the Planner stores courses
function toPlannedCourse(s: CourseSuggestion): PlannedCourse {
  return {
    id: s.code,
    code: s.code,
    name: s.name,
    credits: s.credits,
    sessions: parseSchedule(s.schedule),
    teacher: s.teacher,
    room: s.room,
    tag: CATEGORY_LABELS[s.category],
    color: CATEGORY_COLORS[s.category],
  };
}

export default function SuggestionsScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<SuggestionsResult | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  // the planner list is shared with the Planner screen
  const planner = usePlanner();

  useEffect(() => {
    fetchSuggestions(STUDENT_ID).then(setData);
  }, []);

  function toggleAdd(suggestion: CourseSuggestion) {
    const course = toPlannedCourse(suggestion);
    if (planner.isPlanned(course.id)) {
      planner.removeCourse(course.id);
    } else {
      planner.requestAdd(course); // asks first if there's a time clash or too many credits
    }
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
            <Ionicons name="chevron-back" size={28} color={colors.white} />
          </Pressable>
          <Text style={styles.headerTitle}>Course Suggestions</Text>
          <View style={{ width: 28 }} />
        </View>

        {!data ? (
          <Text style={styles.loading}>Loading suggestions...</Text>
        ) : (
          <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 110 + insets.bottom }]}>
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
              visible.map((suggestion) => {
                const course = toPlannedCourse(suggestion);
                return (
                  <SuggestionCard
                    key={suggestion.id}
                    course={suggestion}
                    added={planner.isPlanned(course.id)}
                    clashWith={planner.conflictsFor(course).map((c) => c.name)}
                    onToggleAdd={() => toggleAdd(suggestion)}
                  />
                );
              })
            )}
          </ScrollView>
        )}
      </SafeAreaView>

      {/* floating shortcut to the Planner once something is in it */}
      {planner.courses.length > 0 ? (
        <Pressable
          onPress={() => router.push('/planner')}
          style={({ pressed }) => [
            styles.plannerPill,
            { bottom: insets.bottom + 16 },
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="calendar" size={20} color={colors.white} />
          <Text style={styles.plannerPillText}>
            View planner · {planner.courses.length} course{planner.courses.length > 1 ? 's' : ''} ·{' '}
            {planner.totalCredits} cr
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.white} />
        </Pressable>
      ) : null}
    </View>
  );
}

// styles are built from the current theme colors and font size
const makeStyles = (colors: ThemeColors, fs: FontScaler) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: { color: colors.white, fontSize: fs(22), fontWeight: 'bold' },
  loading: { color: colors.white, textAlign: 'center', marginTop: 40 },
  content: { padding: 24, paddingTop: 8 },

  summary: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  summaryLabel: { color: colors.muted, fontSize: fs(14) },
  summaryNumber: { color: colors.coral, fontSize: fs(40), fontWeight: 'bold', marginTop: 2 },
  summaryUnit: { color: colors.white, fontSize: fs(18), fontWeight: '600' },
  missingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  missingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.cardLight,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  missingText: { color: colors.white, fontSize: fs(12), fontWeight: '600' },

  filters: { gap: 8, paddingBottom: 16 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: colors.card,
  },
  filterChipActive: { backgroundColor: colors.white },
  filterText: { color: colors.white, fontSize: fs(14), fontWeight: '600' },
  filterTextActive: { color: colors.card },

  empty: { color: colors.white, textAlign: 'center', marginTop: 24 },

  plannerPill: {
    position: 'absolute',
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.teal,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  plannerPillText: { color: colors.white, fontSize: fs(15), fontWeight: 'bold' },
  pressed: { opacity: 0.8 },
});
