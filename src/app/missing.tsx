// src/app/missing.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeColors } from '../constants/colors';
import { useProfile } from '../context/ProfileContext';
import { FontScaler, useTheme, useThemedStyles } from '../context/ThemeContext';
import {
  fetchMissingCredits,
  LackingCourse,
  MissingCredits,
  nextChance,
  nextSemester,
  TKU_SSO_URL,
  yearSemesterText,
} from '../data/missingData';
import { CURRENT_SEMESTER, fetchSchedule } from '../data/scheduleData';

// TEMPORARY: will come from the login later
const STUDENT_ID = '411000001';

export default function MissingCreditsScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useProfile();

  const [data, setData] = useState<MissingCredits | null>(null);
  const [takingNow, setTakingNow] = useState<string[]>([]);
  const [openNote, setOpenNote] = useState<number | null>(null);

  useEffect(() => {
    fetchMissingCredits(STUDENT_ID).then(setData);
    fetchSchedule(STUDENT_ID).then((s) => setTakingNow(s.courses.map((c) => c.code)));
  }, []);

  if (!data) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator color={colors.white} />
      </View>
    );
  }

  const { required, earned } = data;
  const lackTotal = Math.max(required.total - earned.total, 0);
  const otherRequired = required.total - required.compulsory - required.deptSelective;
  const otherEarned = earned.total - earned.compulsory - earned.deptSelective;
  const nextSem = nextSemester(CURRENT_SEMESTER);
  const lackingCredits = data.lackingCompulsory.reduce((sum, c) => sum + c.credits, 0);

  const tiles = [
    { label: 'Compulsory', earned: earned.compulsory, required: required.compulsory },
    { label: 'Dept. selective', earned: earned.deptSelective, required: required.deptSelective },
    { label: 'Other credits', earned: otherEarned, required: otherRequired },
  ];

  function statusOf(course: LackingCourse) {
    if (takingNow.includes(course.code)) {
      return {
        kind: 'taking',
        icon: 'hourglass-outline' as const,
        color: colors.teal,
        text: 'Taking it now · counts once your grade is in',
      };
    }
    const chance = nextChance(course, CURRENT_SEMESTER);
    if (chance === nextSem) {
      return {
        kind: 'next',
        icon: 'calendar-outline' as const,
        color: colors.gold,
        text: `Offered next semester (${nextSem})`,
      };
    }
    return {
      kind: 'later',
      icon: 'alert-circle-outline' as const,
      color: colors.coral,
      text: `Not offered in ${nextSem} · next chance ${chance}`,
    };
  }

  async function openTku() {
    try {
      await Linking.openURL(TKU_SSO_URL);
    } catch {
      Alert.alert('Could not open link', 'Please check your internet connection and try again.');
    }
  }

  const notes = [
    {
      title: 'Minor and double major credits',
      body: 'Credits from a minor or double major are taken out of your graduation credits, and this list may not show that yet. Check those courses yourself.',
    },
    {
      title: "Why is a course I'm taking on the list?",
      body: "Courses you're taking this semester stay on the list until your grades are in.",
    },
    {
      title: 'Where does this come from?',
      body: `TKU's graduation credit check, last updated ${data.updated}. The official page also has the full FAQ.`,
      link: true,
    },
  ];

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={28} color={colors.white} />
          </Pressable>
          <Text style={styles.headerTitle}>Missing Credits</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}>
          {/* how far from graduation */}
          <View style={styles.hero}>
            {lackTotal > 0 ? (
              <>
                <Text style={styles.heroLabel}>You still need</Text>
                <Text style={styles.heroNumber}>
                  {lackTotal} <Text style={styles.heroUnit}>credits to graduate</Text>
                </Text>
              </>
            ) : (
              <Text style={styles.heroDone}>You have enough credits to graduate 🎓</Text>
            )}
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  { width: `${Math.min(earned.total / required.total, 1) * 100}%`, backgroundColor: colors.coral },
                ]}
              />
            </View>
            <View style={styles.heroFoot}>
              <Text style={styles.heroFootText}>
                {earned.total} / {required.total} credits
              </Text>
              <Text style={styles.heroFootText}>Updated {data.updated}</Text>
            </View>
          </View>

          {/* the three kinds of credits */}
          <View style={styles.tiles}>
            {tiles.map((t) => {
              const left = Math.max(t.required - t.earned, 0);
              const tint = left > 0 ? colors.coral : colors.teal;
              return (
                <View key={t.label} style={styles.tile}>
                  <Text style={styles.tileLabel}>{t.label}</Text>
                  <Text style={[styles.tileValue, { color: tint }]}>{left > 0 ? `${left} left` : 'Done'}</Text>
                  <View style={styles.miniTrack}>
                    <View
                      style={[
                        styles.miniFill,
                        { width: `${Math.min(t.earned / t.required, 1) * 100}%`, backgroundColor: tint },
                      ]}
                    />
                  </View>
                  <Text style={styles.tileCount}>
                    {t.earned} / {t.required}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* compulsory courses still missing */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Compulsory courses left</Text>
            <Text style={styles.sectionNote}>
              {data.lackingCompulsory.length} · {lackingCredits} credits
            </Text>
          </View>

          {data.lackingCompulsory.length === 0 ? (
            <View style={styles.allDone}>
              <Ionicons name="checkmark-circle" size={22} color={colors.teal} />
              <Text style={styles.allDoneText}>No compulsory courses left 🎉</Text>
            </View>
          ) : (
            data.lackingCompulsory.map((course) => {
              const status = statusOf(course);
              const main = language === 'zh' ? course.nameZh : course.nameEn;
              const sub = language === 'zh' ? course.nameEn : course.nameZh;
              return (
                <View key={course.code} style={styles.courseCard}>
                  <View style={styles.courseTop}>
                    <View style={styles.flex}>
                      <Text style={styles.courseName}>{main}</Text>
                      <Text style={styles.courseSub}>{sub}</Text>
                    </View>
                    <View style={styles.creditBadge}>
                      <Text style={styles.creditNumber}>{course.credits}</Text>
                      <Text style={styles.creditUnit}>{course.credits > 1 ? 'credits' : 'credit'}</Text>
                    </View>
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="school-outline" size={14} color={colors.muted} />
                    <Text style={styles.metaText}>
                      {yearSemesterText(course)} · {course.code}
                    </Text>
                  </View>
                  <View style={[styles.status, { borderColor: status.color }]}>
                    <Ionicons name={status.icon} size={16} color={status.color} />
                    <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
                  </View>
                  {status.kind === 'next' ? (
                    <Pressable onPress={() => router.push('/planner')} style={styles.planLink} hitSlop={6}>
                      <Text style={styles.planLinkText}>Plan {nextSem} in the Planner</Text>
                      <Ionicons name="chevron-forward" size={14} color={colors.white} />
                    </Pressable>
                  ) : null}
                </View>
              );
            })
          )}

          {/* notes from the TKU page */}
          <Text style={[styles.sectionTitle, styles.notesTitle]}>Good to know</Text>
          <View style={styles.notes}>
            {notes.map((note, i) => {
              const open = openNote === i;
              return (
                <View key={note.title} style={[styles.note, i > 0 && styles.noteBorder]}>
                  <Pressable onPress={() => setOpenNote(open ? null : i)} style={styles.noteHead}>
                    <Text style={styles.noteTitle}>{note.title}</Text>
                    <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
                  </Pressable>
                  {open ? (
                    <>
                      <Text style={styles.noteBody}>{note.body}</Text>
                      {note.link ? (
                        <Pressable onPress={openTku} style={styles.tkuLink} hitSlop={6}>
                          <Text style={styles.tkuLinkText}>Open the TKU page</Text>
                          <Ionicons name="open-outline" size={14} color={colors.white} />
                        </Pressable>
                      ) : null}
                    </>
                  ) : null}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const makeStyles = (colors: ThemeColors, fs: FontScaler) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    center: { alignItems: 'center', justifyContent: 'center' },
    safe: { flex: 1 },
    flex: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    headerTitle: { color: colors.white, fontSize: fs(22), fontWeight: 'bold' },
    content: { paddingHorizontal: 16, paddingTop: 4 },

    hero: { backgroundColor: colors.card, borderRadius: 20, padding: 18 },
    heroLabel: { color: colors.muted, fontSize: fs(14) },
    heroNumber: { color: colors.coral, fontSize: fs(44), fontWeight: 'bold', marginTop: 2 },
    heroUnit: { color: colors.white, fontSize: fs(17), fontWeight: '600' },
    heroDone: { color: colors.white, fontSize: fs(20), fontWeight: 'bold' },
    track: { height: 10, borderRadius: 5, backgroundColor: colors.cardLight, marginTop: 12, overflow: 'hidden' },
    fill: { height: '100%', borderRadius: 5 },
    heroFoot: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    heroFootText: { color: colors.muted, fontSize: fs(12), fontWeight: '600' },

    tiles: { flexDirection: 'row', gap: 8, marginTop: 10 },
    tile: { flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 12 },
    tileLabel: { color: colors.muted, fontSize: fs(11), fontWeight: '600' },
    tileValue: { fontSize: fs(18), fontWeight: 'bold', marginTop: 4 },
    miniTrack: { height: 5, borderRadius: 3, backgroundColor: colors.cardLight, marginTop: 8, overflow: 'hidden' },
    miniFill: { height: '100%', borderRadius: 3 },
    tileCount: { color: colors.white, fontSize: fs(12), fontWeight: '600', marginTop: 6 },

    sectionRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginTop: 22,
      marginBottom: 10,
    },
    sectionTitle: { color: colors.white, fontSize: fs(18), fontWeight: 'bold' },
    sectionNote: { color: colors.white, opacity: 0.8, fontSize: fs(13), fontWeight: '600' },

    courseCard: { backgroundColor: colors.card, borderRadius: 18, padding: 16, marginBottom: 12 },
    courseTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    courseName: { color: colors.white, fontSize: fs(16), fontWeight: 'bold' },
    courseSub: { color: colors.muted, fontSize: fs(13), marginTop: 3 },
    creditBadge: {
      alignItems: 'center',
      backgroundColor: colors.cardLight,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 6,
      minWidth: 54,
    },
    creditNumber: { color: colors.white, fontSize: fs(18), fontWeight: 'bold' },
    creditUnit: { color: colors.muted, fontSize: fs(10), fontWeight: '600' },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
    metaText: { color: colors.muted, fontSize: fs(12) },
    status: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1.5,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginTop: 12,
    },
    statusText: { flex: 1, fontSize: fs(13), fontWeight: '600' },
    planLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
    planLinkText: { color: colors.white, fontSize: fs(13), fontWeight: 'bold', textDecorationLine: 'underline' },

    allDone: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
    },
    allDoneText: { color: colors.white, fontSize: fs(15), fontWeight: '600' },

    notesTitle: { marginTop: 14, marginBottom: 10 },
    notes: { backgroundColor: colors.card, borderRadius: 18, paddingHorizontal: 16 },
    note: { paddingVertical: 14 },
    noteBorder: { borderTopWidth: 1, borderTopColor: colors.cardLight },
    noteHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    noteTitle: { flex: 1, color: colors.white, fontSize: fs(14), fontWeight: '600' },
    noteBody: { color: colors.muted, fontSize: fs(13), lineHeight: fs(19), marginTop: 8 },
    tkuLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
    tkuLinkText: { color: colors.white, fontSize: fs(13), fontWeight: 'bold', textDecorationLine: 'underline' },
  });
