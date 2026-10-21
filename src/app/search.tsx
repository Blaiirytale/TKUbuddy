// src/app/search.tsx

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ReactNode, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeColors } from '../constants/colors';
import { usePlanner } from '../context/PlannerContext';
import { useProfile } from '../context/ProfileContext';
import { FontScaler, useTheme, useThemedStyles } from '../context/ThemeContext';
import { formatSessions, PLAN_SEMESTER, PlannedCourse } from '../data/plannerData';
import {
  DEFAULT_FILTERS,
  isFull,
  Language,
  Level,
  Offering,
  searchCourses,
  SearchDay,
  SearchFilters,
  SEMESTERS,
  TimeOfDay,
  UNITS,
} from '../data/searchData';

const LANGUAGES: Language[] = ['Chinese', 'English', 'Others'];
const DAYS: SearchDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIMES: TimeOfDay[] = ['Morning', 'Noon', 'Afternoon', 'Night'];
const LEVELS: Level[] = ['Undergraduate', 'Graduate'];

type Tab = 'semester' | 'language' | 'day' | 'time' | 'unit' | 'seats';
const TABS: { id: Tab; label: string }[] = [
  { id: 'semester', label: 'Semester' },
  { id: 'language', label: 'Language' },
  { id: 'day', label: 'Day' },
  { id: 'time', label: 'Time' },
  { id: 'unit', label: 'Unit' },
  { id: 'seats', label: 'Seats' },
];

function toggle<T>(list: T[], item: T) {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

function toPlannedCourse(o: Offering): PlannedCourse {
  return {
    id: o.code,
    code: o.code,
    name: o.nameEn,
    credits: o.credits,
    sessions: o.sessions,
    teacher: o.teacher,
    room: o.room,
    tag: o.department,
  };
}

export default function SearchScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const planner = usePlanner();
  const { language } = useProfile();

  // the Course Catalogue opens this screen with ?q=COURSECODE
  const params = useLocalSearchParams();
  const q = typeof params.q === 'string' ? params.q : undefined;
  const [filters, setFilters] = useState<SearchFilters>({ ...DEFAULT_FILTERS, keyword: q ?? '' });
  const [results, setResults] = useState<Offering[]>([]);
  const [draft, setDraft] = useState(q ?? '');
  const [tab, setTab] = useState<Tab>('semester');

  useEffect(() => {
    searchCourses(filters).then(setResults);
  }, [filters]);

  const set = (change: Partial<SearchFilters>) => setFilters((f) => ({ ...f, ...change }));
  const departments = UNITS.find((u) => u.college === filters.college)?.departments ?? [];
  const runSearch = () => set({ keyword: draft });

  // what's switched on, shown as small chips you can tap to remove
  const semesterLabel = SEMESTERS.find((x) => x.id === filters.semester)?.label ?? filters.semester;
  const active: { key: string; label: string; remove: () => void }[] = [
    ...filters.languages.map((l) => ({ key: l, label: l, remove: () => set({ languages: toggle(filters.languages, l) }) })),
    ...filters.days.map((d) => ({ key: d, label: d, remove: () => set({ days: toggle(filters.days, d) }) })),
    ...filters.times.map((t) => ({ key: t, label: t, remove: () => set({ times: toggle(filters.times, t) }) })),
    ...(filters.level !== DEFAULT_FILTERS.level
      ? [{ key: 'level', label: filters.level, remove: () => set({ level: DEFAULT_FILTERS.level }) }]
      : []),
    ...(filters.college
      ? [{ key: 'college', label: filters.department ?? filters.college, remove: () => set({ college: null, department: null }) }]
      : []),
    ...(filters.showFull ? [{ key: 'full', label: 'Incl. full', remove: () => set({ showFull: false }) }] : []),
  ];
  const tabHasValue: Record<Tab, boolean> = {
    semester: false,
    language: filters.languages.length > 0,
    day: filters.days.length > 0,
    time: filters.times.length > 0,
    unit: !!filters.college || filters.level !== DEFAULT_FILTERS.level,
    seats: filters.showFull || !filters.showAvailable,
  };
  const canPlan = filters.semester === PLAN_SEMESTER;

  function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
    return (
      <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
        <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
      </Pressable>
    );
  }

  function FilterRow({ title, children }: { title: string; children: ReactNode }) {
    return (
      <View style={styles.filterRow}>
        <Text style={styles.filterTitle}>{title}</Text>
        <View style={styles.chipWrap}>{children}</View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={28} color={colors.white} />
          </Pressable>
          <Text style={styles.headerTitle}>Advance Search</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}
        >
          {/* search bar + button */}
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                onSubmitEditing={runSearch}
                placeholder={filters.keywordMode === 'name' ? 'Course name' : 'Course, code or teacher'}
                placeholderTextColor="#9A9A9A"
                style={styles.searchInput}
                returnKeyType="search"
              />
              {draft ? (
                <Pressable
                  onPress={() => {
                    setDraft('');
                    set({ keyword: '' });
                  }}
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={18} color="#9A9A9A" />
                </Pressable>
              ) : null}
            </View>
            <Pressable onPress={runSearch} style={({ pressed }) => [styles.searchButton, pressed && styles.pressed]}>
              <Ionicons name="search" size={22} color={colors.white} />
            </Pressable>
          </View>

          <View style={styles.modeRow}>
            <Text style={styles.modeLabel}>Search in</Text>
            {(['full', 'name'] as const).map((mode) => (
              <Pressable
                key={mode}
                onPress={() => set({ keywordMode: mode })}
                style={[styles.modeItem, filters.keywordMode === mode && styles.modeItemActive]}
              >
                <Text style={[styles.modeText, filters.keywordMode === mode && styles.modeTextActive]}>
                  {mode === 'full' ? 'Full text' : 'Course name'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* filter menu: one group at a time */}
          <View style={styles.pillBar}>
              {TABS.map((t) => {
                const on = tab === t.id;
                return (
                  <Pressable key={t.id} onPress={() => setTab(t.id)} style={[styles.pill, on && styles.pillActive]}>
                    <Text style={[styles.pillText, on && styles.pillTextActive]}>{t.label}</Text>
                    {tabHasValue[t.id] ? <View style={[styles.pillDot, on && styles.pillDotActive]} /> : null}
                  </Pressable>
                );
              })}
          </View>

          <View style={styles.panel}>
            {tab === 'semester' ? (
              <FilterRow title="School year / semester">
                {SEMESTERS.map((sem) => (
                  <Chip key={sem.id} label={`${sem.label} (${sem.id})`} active={filters.semester === sem.id} onPress={() => set({ semester: sem.id })} />
                ))}
              </FilterRow>
            ) : null}
            {tab === 'language' ? (
              <FilterRow title="Lecture language">
                {LANGUAGES.map((l) => (
                  <Chip key={l} label={l} active={filters.languages.includes(l)} onPress={() => set({ languages: toggle(filters.languages, l) })} />
                ))}
              </FilterRow>
            ) : null}
            {tab === 'day' ? (
              <FilterRow title="Day">
                {DAYS.map((d) => (
                  <Chip key={d} label={d} active={filters.days.includes(d)} onPress={() => set({ days: toggle(filters.days, d) })} />
                ))}
              </FilterRow>
            ) : null}
            {tab === 'time' ? (
              <FilterRow title="Time of day">
                {TIMES.map((t) => (
                  <Chip key={t} label={t} active={filters.times.includes(t)} onPress={() => set({ times: toggle(filters.times, t) })} />
                ))}
              </FilterRow>
            ) : null}
            {tab === 'unit' ? (
              <>
                <FilterRow title="Level">
                  {LEVELS.map((l) => (
                    <Chip key={l} label={l} active={filters.level === l} onPress={() => set({ level: l })} />
                  ))}
                </FilterRow>
                <FilterRow title="College">
                  <Chip label="All" active={!filters.college} onPress={() => set({ college: null, department: null })} />
                  {UNITS.map((u) => (
                    <Chip key={u.college} label={u.college} active={filters.college === u.college} onPress={() => set({ college: u.college, department: null })} />
                  ))}
                </FilterRow>
                {departments.length > 1 ? (
                  <FilterRow title="Department">
                    <Chip label="All" active={!filters.department} onPress={() => set({ department: null })} />
                    {departments.map((d) => (
                      <Chip key={d} label={d} active={filters.department === d} onPress={() => set({ department: d })} />
                    ))}
                  </FilterRow>
                ) : null}
              </>
            ) : null}
            {tab === 'seats' ? (
              <FilterRow title="Seats">
                <Chip label="Still available" active={filters.showAvailable} onPress={() => set({ showAvailable: !filters.showAvailable })} />
                <Chip label="Full" active={filters.showFull} onPress={() => set({ showFull: !filters.showFull })} />
              </FilterRow>
            ) : null}
          </View>

          {/* what's on */}
          <View style={styles.activeRow}>
            <View style={styles.activeChip}>
              <Text style={styles.activeText}>{semesterLabel}</Text>
            </View>
            {filters.keyword ? (
              <Pressable
                onPress={() => {
                  setDraft('');
                  set({ keyword: '' });
                }}
                style={styles.activeChip}
              >
                <Text style={styles.activeText}>"{filters.keyword}"</Text>
                <Ionicons name="close" size={13} color={colors.white} />
              </Pressable>
            ) : null}
            {active.map((a) => (
              <Pressable key={a.key} onPress={a.remove} style={styles.activeChip}>
                <Text style={styles.activeText}>{a.label}</Text>
                <Ionicons name="close" size={13} color={colors.white} />
              </Pressable>
            ))}
            {active.length > 0 ? (
              <Pressable
                onPress={() => setFilters({ ...DEFAULT_FILTERS, keyword: filters.keyword, semester: filters.semester })}
                hitSlop={8}
              >
                <Text style={styles.clearAll}>Clear all</Text>
              </Pressable>
            ) : null}
          </View>

          {/* results */}
          <Text style={styles.resultCount}>
            {results.length} course{results.length === 1 ? '' : 's'}
          </Text>

          {results.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={30} color={colors.muted} />
              <Text style={styles.emptyText}>No courses match. Try removing a filter.</Text>
            </View>
          ) : (
            results.map((o) => {
              const full = isFull(o);
              const left = o.seats - o.registered;
              const course = toPlannedCourse(o);
              const added = planner.isPlanned(course.id);
              const clashes = added ? [] : planner.conflictsFor(course).map((c) => c.name);
              return (
                <View key={`${o.code}-${o.semester}`} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={styles.langBadge}>
                      <Text style={styles.langText}>{o.language.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.credits}>{o.credits} credits</Text>
                  </View>
                  <Text style={styles.name}>{language === 'zh' ? o.nameZh : o.nameEn}</Text>
                  <Text style={styles.sub}>
                    {language === 'zh' ? o.nameEn : o.nameZh} · {o.code}
                  </Text>
                  <Text style={styles.dept}>{o.department}</Text>

                  <View style={styles.infoRow}>
                    <View style={styles.info}>
                      <Ionicons name="time-outline" size={14} color={colors.muted} />
                      <Text style={styles.infoText}>{formatSessions(o.sessions)}</Text>
                    </View>
                    <View style={styles.info}>
                      <Ionicons name="person-outline" size={14} color={colors.muted} />
                      <Text style={styles.infoText}>{o.teacher}</Text>
                    </View>
                    <View style={styles.info}>
                      <Ionicons name="location-outline" size={14} color={colors.muted} />
                      <Text style={styles.infoText}>{o.room}</Text>
                    </View>
                  </View>

                  <View style={styles.seatRow}>
                    <View style={styles.seatTrack}>
                      <View
                        style={[
                          styles.seatFill,
                          {
                            width: `${Math.min(o.registered / o.seats, 1) * 100}%`,
                            backgroundColor: full ? colors.coral : colors.teal,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.seatText, { color: full ? colors.coral : colors.white }]}>
                      {full ? `Full · ${o.registered}/${o.seats}` : `${left} seats left · ${o.registered}/${o.seats}`}
                    </Text>
                  </View>

                  {clashes.length > 0 ? (
                    <View style={styles.clash}>
                      <Ionicons name="warning-outline" size={15} color={colors.coral} />
                      <Text style={styles.clashText}>Same time as {clashes.join(' and ')} in your planner</Text>
                    </View>
                  ) : null}

                  {canPlan ? (
                    <Pressable
                      disabled={full && !added}
                      onPress={() => (added ? planner.removeCourse(course.id) : planner.requestAdd(course))}
                      style={({ pressed }) => [
                        styles.button,
                        added && styles.buttonAdded,
                        full && !added && styles.buttonFull,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Ionicons name={added ? 'checkmark' : full ? 'close' : 'add'} size={18} color={colors.white} />
                      <Text style={styles.buttonText}>
                        {added ? 'ADDED TO PLANNER' : full ? 'NO SEATS LEFT' : 'ADD TO PLANNER'}
                      </Text>
                    </Pressable>
                  ) : (
                    <Text style={styles.currentNote}>This semester · changes go through add & drop</Text>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const makeStyles = (colors: ThemeColors, fs: FontScaler) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    safe: { flex: 1 },
    flex: { flex: 1 },
    pressed: { opacity: 0.7 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    headerTitle: { color: colors.white, fontSize: fs(22), fontWeight: 'bold' },
    content: { paddingHorizontal: 16, paddingTop: 4 },

    searchRow: { flexDirection: 'row', gap: 8 },
    searchBox: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      height: 48,
      borderRadius: 14,
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 14,
    },
    searchInput: { flex: 1, fontSize: fs(15), color: '#222222' },
    searchButton: {
      width: 56,
      height: 48,
      borderRadius: 14,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
    modeLabel: { color: colors.white, opacity: 0.8, fontSize: fs(12), fontWeight: '600', marginRight: 2 },
    modeItem: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: colors.white },
    modeItemActive: { backgroundColor: colors.white },
    modeText: { color: colors.white, fontSize: fs(12), fontWeight: '600' },
    modeTextActive: { color: colors.card },

    pillBar: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 4,
      marginTop: 14,
      borderWidth: 1.5,
      borderColor: colors.cardLight,
    },
    pill: {
      flexGrow: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      paddingHorizontal: 7,
      paddingVertical: 9,
      borderRadius: 20,
    },
    pillActive: { backgroundColor: colors.white },
    pillText: { color: colors.white, fontSize: Math.min(fs(12), 13), fontWeight: '600' },
    pillTextActive: { color: colors.card },
    pillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.coral },
    pillDotActive: { backgroundColor: colors.coral },

    panel: { backgroundColor: colors.card, borderRadius: 18, paddingHorizontal: 14, paddingBottom: 14, marginTop: 10 },
    filterRow: { marginTop: 14 },
    filterTitle: { color: colors.muted, fontSize: fs(12), fontWeight: '600', marginBottom: 8 },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
    chip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 15, backgroundColor: colors.cardLight },
    chipActive: { backgroundColor: colors.teal },
    chipText: { color: colors.white, fontSize: fs(13), fontWeight: '600' },
    chipTextActive: { color: colors.white },

    activeRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 12 },
    activeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(0,0,0,0.25)',
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    activeText: { color: colors.white, fontSize: fs(12), fontWeight: '600' },
    clearAll: { color: colors.white, fontSize: fs(12), fontWeight: '600', textDecorationLine: 'underline', marginLeft: 4 },

    resultCount: { color: colors.white, fontSize: fs(18), fontWeight: 'bold', marginTop: 16, marginBottom: 10 },
    empty: { alignItems: 'center', gap: 8, backgroundColor: colors.card, borderRadius: 18, padding: 24 },
    emptyText: { color: colors.muted, fontSize: fs(14), textAlign: 'center' },

    card: { backgroundColor: colors.card, borderRadius: 18, padding: 16, marginBottom: 14 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    langBadge: { backgroundColor: colors.cardLight, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3 },
    langText: { color: colors.gold, fontSize: fs(10), fontWeight: 'bold', letterSpacing: 0.5 },
    credits: { color: colors.muted, fontSize: fs(12), fontWeight: '600' },
    name: { color: colors.white, fontSize: fs(17), fontWeight: 'bold' },
    sub: { color: colors.muted, fontSize: fs(13), marginTop: 2 },
    dept: { color: colors.muted, fontSize: fs(12), marginTop: 2 },
    infoRow: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 6, marginTop: 10 },
    info: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    infoText: { color: colors.muted, fontSize: fs(13) },
    seatRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
    seatTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.cardLight, overflow: 'hidden' },
    seatFill: { height: '100%', borderRadius: 3 },
    seatText: { fontSize: fs(12), fontWeight: '600' },
    clash: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
    clashText: { flex: 1, color: colors.coral, fontSize: fs(12), fontWeight: '600' },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.coral,
      marginTop: 14,
    },
    buttonAdded: { backgroundColor: colors.teal },
    buttonFull: { backgroundColor: colors.grey },
    buttonText: { color: colors.white, fontSize: fs(13), fontWeight: 'bold', letterSpacing: 0.5 },
    currentNote: { color: colors.muted, fontSize: fs(12), marginTop: 12 },
  });
