// src/app/history.tsx
// Course History: opened by tapping the Graduation Progress card on Home.
// View-only: grades come from the school, students can't edit them.
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeColors } from '../constants/colors';
import { FontScaler, useTheme, useThemedStyles } from '../context/ThemeContext';
import {
  countsTowardCredits,
  CourseHistory,
  CourseStatus,
  fetchCourseHistory,
  HistoryCourse,
} from '../data/historyData';

const TOTAL_CREDITS = 128;

const STATUS_LABEL: Record<CourseStatus, string> = {
  passed: 'Passed',
  failed: 'Failed',
  dropped: 'Dropped',
  in_progress: 'In progress',
};

// "113-1" -> "Fall 2024", "113-2" -> "Spring 2025" (Taiwan year + 1911)
function semesterName(semester: string) {
  const [year, term] = semester.split('-').map(Number);
  const westernYear = year + 1911;
  return term === 1 ? `Fall ${westernYear}` : `Spring ${westernYear + 1}`;
}

// turns the flat list into [["114-1", [...]], ["113-2", [...]], ...], newest first
function groupBySemester(courses: HistoryCourse[]) {
  const map: Record<string, HistoryCourse[]> = {};
  courses.forEach((c) => {
    if (!map[c.semester]) map[c.semester] = [];
    map[c.semester].push(c);
  });
  return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
}

const sumCredits = (list: HistoryCourse[]) => list.reduce((sum, c) => sum + c.credits, 0);

export default function HistoryScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [history, setHistory] = useState<CourseHistory | null>(null);
  const [showScores, setShowScores] = useState(false);
  // which semesters are folded closed, e.g. { "111-1": true }
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // BACKEND TODO: pass the real logged-in student id here
    fetchCourseHistory('demo-student').then(setHistory);
  }, []);

  const courses = history?.courses ?? [];
  const passed = courses.filter(countsTowardCredits);
  const creditsDone = sumCredits(passed);
  const progress = Math.min(creditsDone / TOTAL_CREDITS, 1);
  const groups = groupBySemester(courses);

  const toggleSemester = (semester: string) =>
    setCollapsed((prev) => ({ ...prev, [semester]: !prev[semester] }));

  // Passed = teal, Failed = coral, Dropped = grey, In progress = outlined
  const badgeStyle = (status: CourseStatus) => {
    if (status === 'passed') return { backgroundColor: colors.teal, borderColor: colors.teal };
    if (status === 'failed') return { backgroundColor: colors.coral, borderColor: colors.coral };
    if (status === 'dropped') return { backgroundColor: colors.grey, borderColor: colors.grey };
    return { backgroundColor: 'transparent', borderColor: colors.white };
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* ---------- top bar ---------- */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.white} />
        </Pressable>
        <Text style={styles.title}>Course History</Text>
        <Pressable onPress={() => setShowScores((s) => !s)} hitSlop={12}>
          <Ionicons name={showScores ? 'eye' : 'eye-off'} size={22} color={colors.white} />
        </Pressable>
      </View>

      {!history ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.teal} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {/* ---------- summary card ---------- */}
          <View style={styles.summary}>
            <Text style={styles.summaryNumber}>
              {creditsDone} <Text style={styles.summaryTotal}>/ {TOTAL_CREDITS} credits</Text>
            </Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.note}>
              {passed.length} courses passed · records come from the school
            </Text>
          </View>

          {/* ---------- course list, grouped by semester ---------- */}
          {groups.map(([semester, list]) => {
            const isClosed = !!collapsed[semester];
            const passedCredits = sumCredits(list.filter(countsTowardCredits));
            const ongoingCredits = sumCredits(list.filter((c) => c.status === 'in_progress'));
            const creditText =
              passedCredits > 0 ? `${passedCredits} credits` : `${ongoingCredits} credits · in progress`;

            return (
              <View key={semester} style={styles.group}>
                <Pressable style={styles.groupHeader} onPress={() => toggleSemester(semester)}>
                  <View>
                    <Text style={styles.groupTitle}>
                      {semester} · {semesterName(semester)}
                    </Text>
                    <Text style={styles.groupSub}>
                      {creditText} · {list.length} courses
                    </Text>
                  </View>
                  <Ionicons
                    name={isClosed ? 'chevron-down' : 'chevron-up'}
                    size={20}
                    color={colors.white}
                  />
                </Pressable>

                {!isClosed &&
                  list.map((c) => {
                    const greyed = c.status === 'failed' || c.status === 'dropped';
                    const badge = badgeStyle(c.status);
                    return (
                      <View key={c.id} style={[styles.courseCard, greyed && styles.greyed]}>
                        <View style={styles.courseTop}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.courseName}>{c.name}</Text>
                            <Text style={styles.courseMeta}>
                              {c.code} · {c.credits} cr
                              {showScores && c.score !== null ? ` · Score ${c.score}` : ''}
                            </Text>
                          </View>
                          <View style={[styles.badge, badge]}>
                            <Text style={styles.badgeText}>{STATUS_LABEL[c.status]}</Text>
                          </View>
                        </View>

                        <View style={styles.tagRow}>
                          {c.autoTags.map((tag) => (
                            <View key={tag} style={styles.tag}>
                              <Text style={styles.tagText}>{tag}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    );
                  })}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors, fs: FontScaler) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    title: { color: colors.white, fontSize: fs(20), fontWeight: '700' },
    content: { padding: 16, paddingBottom: 40 },

    // summary card
    summary: { backgroundColor: colors.card, borderRadius: 16, padding: 16 },
    summaryNumber: { color: colors.white, fontSize: fs(30), fontWeight: '800' },
    summaryTotal: { color: colors.muted, fontSize: fs(15), fontWeight: '500' },
    track: {
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.cardLight,
      marginTop: 12,
      overflow: 'hidden',
    },
    fill: { height: '100%', borderRadius: 5, backgroundColor: colors.coral },
    note: { color: colors.muted, fontSize: fs(12), marginTop: 10 },

    // semester groups
    group: { marginTop: 22 },
    groupHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    groupTitle: { color: colors.white, fontSize: fs(16), fontWeight: '700' },
    groupSub: { color: colors.white, opacity: 0.85, fontSize: fs(12), marginTop: 2 },

    // course cards
    courseCard: { backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 10 },
    greyed: { opacity: 0.55 },
    courseTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    courseName: { color: colors.white, fontSize: fs(16), fontWeight: '700' },
    courseMeta: { color: colors.muted, fontSize: fs(12), marginTop: 3 },
    badge: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
    badgeText: { color: colors.white, fontSize: fs(11), fontWeight: '700' },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    tag: {
      backgroundColor: colors.cardLight,
      borderRadius: 10,
      paddingHorizontal: 9,
      paddingVertical: 3,
    },
    tagText: { color: colors.muted, fontSize: fs(11) },
  });
