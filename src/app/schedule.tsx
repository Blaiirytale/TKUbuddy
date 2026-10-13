
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import ScheduleSheet from '../components/ScheduleSheet';
import { courseColor } from '../components/TimetableGrid';
import { ThemeColors } from '../constants/colors';
import { useProfile } from '../context/ProfileContext';
import { FontScaler, useTheme, useThemedStyles } from '../context/ThemeContext';
import { CREDIT_LIMIT, PlannedCourse, formatSessions, semesterName, sessionClock } from '../data/plannerData';
import {
  ScheduleInfo,
  TKU_ADD_DROP_URL,
  WEEKDAYS,
  addCourseBack,
  classesOnDay,
  dropCourse,
  fetchSchedule,
  findNextClass,
  formatDateKey,
  isAddDropOpen,
} from '../data/scheduleData';

// TEMPORARY: will come from the login later
const STUDENT_ID = '411000001';

const sumCredits = (list: PlannedCourse[]) => list.reduce((sum, c) => sum + c.credits, 0);

export default function ScheduleScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { displayName } = useProfile();

  const [schedule, setSchedule] = useState<ScheduleInfo | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [selected, setSelected] = useState<PlannedCourse | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null); // course being dropped / added back
  // DEMO: long-press the add & drop banner to pretend the period is open
  const [demoOpen, setDemoOpen] = useState(false);

  const load = useCallback(() => {
    fetchSchedule(STUDENT_ID).then(setSchedule);
  }, []);

  useEffect(() => {
    load();

    const timer = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, [load]);

  if (!schedule) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator color={colors.white} />
      </View>
    );
  }

  const { courses, dropped, addDrop } = schedule;
  const open = demoOpen || isAddDropOpen(addDrop, now);
  const period = `${formatDateKey(addDrop.start)} – ${formatDateKey(addDrop.end)}`;
  const totalCredits = sumCredits(courses);


  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const live = classesOnDay(courses, now.getDay()).find(
    (slot) => slot.start <= nowMinutes && nowMinutes < slot.end
  );
  const next = findNextClass(courses, now);
  const nextWhen = !next
    ? ''
    : next.daysAhead === 0
      ? 'Today'
      : next.daysAhead === 1
        ? 'Tomorrow'
        : WEEKDAYS[next.weekday];


  function askDrop(course: PlannedCourse) {
    if (!open) {
      Alert.alert('Drop is closed', `You can only drop courses during add & drop (${period}).`);
      return;
    }
    const after = totalCredits - course.credits;
    const warning =
      after < CREDIT_LIMIT.min
        ? `\n\nYou would have ${after} credits, below the minimum of ${CREDIT_LIMIT.min}.`
        : '';
    Alert.alert(
      `Drop ${course.name}?`,
      `You will lose its ${course.credits} credits this semester.${warning}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Drop', style: 'destructive', onPress: () => change(course, 'drop') },
      ]
    );
  }

  async function change(course: PlannedCourse, action: 'drop' | 'add') {
    setBusyId(course.id);
    const result =
      action === 'drop'
        ? await dropCourse(STUDENT_ID, course.id)
        : await addCourseBack(STUDENT_ID, course.id);
    setBusyId(null);
    if (!result.ok) {
      Alert.alert('Something went wrong', result.reason);
      return;
    }
    setSelected(null);
    load();
  }

  async function openTkuSite() {
    try {
      await Linking.openURL(TKU_ADD_DROP_URL);
    } catch {
      Alert.alert('Could not open link', 'Please check your internet connection and try again.');
    }
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={28} color={colors.white} />
          </Pressable>
          <Text style={styles.headerTitle}>My Schedule</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}>
          {/* ADD & DROP BANNER (long-press = demo switch) */}
          <Pressable
            onLongPress={() => setDemoOpen((d) => !d)}
            delayLongPress={600}
            style={[styles.banner, open ? styles.bannerOpen : styles.bannerClosed]}
          >
            <View style={[styles.bannerIcon, { backgroundColor: open ? colors.teal : colors.cardLight }]}>
              <Ionicons name={open ? 'lock-open' : 'lock-closed'} size={20} color={colors.white} />
            </View>
            <View style={styles.flex}>
              <View style={styles.bannerTitleRow}>
                <Text style={styles.bannerTitle}>
                  {open ? 'Add & drop is open' : 'Add & drop is closed'}
                </Text>
                {demoOpen ? (
                  <View style={styles.demoChip}>
                    <Text style={styles.demoText}>DEMO</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.bannerText}>
                {open
                  ? `Until ${formatDateKey(addDrop.end)}. You can drop courses or add them back.`
                  : `It ran ${period}. Your courses are locked until next semester.`}
              </Text>
              {open ? (
                <Pressable onPress={openTkuSite} style={styles.bannerLink} hitSlop={8}>
                  <Text style={styles.bannerLinkText}>Open TKU add & drop</Text>
                  <Ionicons name="open-outline" size={14} color={colors.white} />
                </Pressable>
              ) : null}
            </View>
          </Pressable>

          {/* NOW / NEXT UP */}
          {live || next ? (
            <Pressable
              onPress={() => setSelected((live ?? next)!.course)}
              style={({ pressed }) => [styles.upNext, pressed && styles.pressed]}
            >
              <View style={[styles.upChip, { backgroundColor: live ? colors.coral : colors.teal }]}>
                <Text style={styles.upChipText}>{live ? 'NOW' : 'NEXT'}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.upName} numberOfLines={1}>
                  {(live ?? next)!.course.name}
                </Text>
                <Text style={styles.upMeta}>
                  {live
                    ? `until ${live.endText} · ${live.course.room ?? 'Room TBA'}`
                    : `${nextWhen} ${next!.startText} · ${next!.course.room ?? 'Room TBA'}`}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          ) : (
            <View style={styles.upNext}>
              <Text style={styles.upName}>No classes this week 🎉</Text>
            </View>
          )}

          {/* THE PAPER SCHEDULE */}
          <View style={styles.sheetGap} />
          <ScheduleSheet
            courses={courses}
            subtitle={`${schedule.semester} · ${semesterName(schedule.semester).toUpperCase()} · ${totalCredits} CREDITS`}
            ownerName={displayName}
            now={now}
            onPressCourse={setSelected}
          />

          {/* REGISTERED COURSES */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Registered courses</Text>
            <Text style={styles.sectionNote}>
              {courses.length} · {totalCredits} credits
            </Text>
          </View>
          {courses.map((course) => (
            <Pressable
              key={course.id}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              onPress={() => setSelected(course)}
            >
              <View style={[styles.rowColor, { backgroundColor: courseColor(course) }]} />
              <View style={styles.flex}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {course.name}
                </Text>
                <Text style={styles.rowMeta}>
                  {course.credits} cr · {formatSessions(course.sessions)} · {course.room ?? 'Room TBA'}
                </Text>
              </View>
              {busyId === course.id ? (
                <ActivityIndicator color={colors.white} />
              ) : open ? (
                <Pressable onPress={() => askDrop(course)} style={styles.dropButton} hitSlop={6}>
                  <Text style={styles.dropText}>DROP</Text>
                </Pressable>
              ) : (
                <Ionicons name="lock-closed" size={18} color={colors.muted} />
              )}
            </Pressable>
          ))}

          {/* DROPPED THIS SEMESTER */}
          {dropped.length > 0 ? (
            <>
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Dropped this semester</Text>
                <Text style={styles.sectionNote}>{dropped.length}</Text>
              </View>
              {dropped.map((course) => (
                <View key={course.id} style={[styles.row, styles.droppedRow]}>
                  <View style={[styles.rowColor, { backgroundColor: colors.grey }]} />
                  <View style={styles.flex}>
                    <Text style={[styles.rowName, styles.strike]} numberOfLines={1}>
                      {course.name}
                    </Text>
                    <Text style={styles.rowMeta}>
                      {course.credits} cr · {formatSessions(course.sessions)}
                    </Text>
                  </View>
                  {busyId === course.id ? (
                    <ActivityIndicator color={colors.white} />
                  ) : open ? (
                    <Pressable onPress={() => change(course, 'add')} style={styles.addBackButton} hitSlop={6}>
                      <Text style={styles.addBackText}>ADD BACK</Text>
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>

      {/* COURSE DETAILS SHEET */}
      <Modal
        visible={selected !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.backdrop}>
          <Pressable style={styles.flex} onPress={() => setSelected(null)} />
          {selected ? (
            <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetTitleRow}>
                <View style={[styles.sheetColor, { backgroundColor: courseColor(selected) }]} />
                <View style={styles.flex}>
                  <Text style={styles.sheetName}>{selected.name}</Text>
                  <Text style={styles.sheetMeta}>
                    {selected.code} · {selected.credits} credits
                    {selected.tag ? ` · ${selected.tag}` : ''}
                  </Text>
                </View>
              </View>
              {selected.sessions.map((s) => (
                <View key={`${s.day}-${s.start}`} style={styles.sheetInfo}>
                  <Ionicons name="time-outline" size={18} color={colors.muted} />
                  <Text style={styles.sheetInfoText}>
                    {s.day} · period {s.start === s.end ? s.start : `${s.start}-${s.end}`} ·{' '}
                    {sessionClock(s)}
                  </Text>
                </View>
              ))}
              {selected.teacher ? (
                <View style={styles.sheetInfo}>
                  <Ionicons name="person-outline" size={18} color={colors.muted} />
                  <Text style={styles.sheetInfoText}>{selected.teacher}</Text>
                </View>
              ) : null}
              {selected.room ? (
                <View style={styles.sheetInfo}>
                  <Ionicons name="location-outline" size={18} color={colors.muted} />
                  <Text style={styles.sheetInfoText}>Room {selected.room}</Text>
                </View>
              ) : null}

              {open ? (
                <Pressable
                  style={({ pressed }) => [styles.sheetDrop, pressed && styles.pressed]}
                  onPress={() => askDrop(selected)}
                >
                  <Ionicons name="remove-circle-outline" size={18} color={colors.coral} />
                  <Text style={styles.sheetDropText}>DROP THIS COURSE</Text>
                </Pressable>
              ) : (
                <View style={styles.lockedNote}>
                  <Ionicons name="lock-closed" size={16} color={colors.muted} />
                  <Text style={styles.lockedText}>
                    Registered. You can only drop it during add & drop ({period}).
                  </Text>
                </View>
              )}
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

// styles are built from the current theme colors and font size
const makeStyles = (colors: ThemeColors, fs: FontScaler) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    center: { alignItems: 'center', justifyContent: 'center' },
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

    // add & drop banner
    banner: { flexDirection: 'row', gap: 12, borderRadius: 18, padding: 14, borderWidth: 1.5 },
    bannerClosed: { backgroundColor: colors.card, borderColor: colors.card },
    bannerOpen: { backgroundColor: colors.card, borderColor: colors.teal },
    bannerIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    bannerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    bannerTitle: { color: colors.white, fontSize: fs(15), fontWeight: 'bold' },
    bannerText: { color: colors.muted, fontSize: fs(12), marginTop: 3, lineHeight: fs(17) },
    bannerLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
    bannerLinkText: { color: colors.white, fontSize: fs(13), fontWeight: 'bold', textDecorationLine: 'underline' },
    demoChip: { backgroundColor: colors.gold, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
    demoText: { color: '#1E1E1E', fontSize: fs(10), fontWeight: 'bold' },

    // now / next up strip
    upNext: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.card,
      borderRadius: 18,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginTop: 12,
    },
    upChip: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4 },
    upChipText: { color: colors.white, fontSize: fs(11), fontWeight: 'bold', letterSpacing: 0.8 },
    upName: { color: colors.white, fontSize: fs(15), fontWeight: 'bold' },
    upMeta: { color: colors.muted, fontSize: fs(12), marginTop: 2 },
    sheetGap: { height: 14 },

    // sections
    sectionRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginTop: 22,
      marginBottom: 10,
    },
    sectionTitle: { color: colors.white, fontSize: fs(18), fontWeight: 'bold' },
    sectionNote: { color: colors.white, opacity: 0.8, fontSize: fs(13), fontWeight: '600' },

    // course rows
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
    },
    droppedRow: { opacity: 0.7 },
    rowColor: { width: 6, alignSelf: 'stretch', borderRadius: 3 },
    rowName: { color: colors.white, fontSize: fs(15), fontWeight: 'bold' },
    strike: { textDecorationLine: 'line-through' },
    rowMeta: { color: colors.muted, fontSize: fs(12), marginTop: 3 },
    dropButton: {
      borderWidth: 1.5,
      borderColor: colors.coral,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 5,
    },
    dropText: { color: colors.coral, fontSize: fs(12), fontWeight: 'bold', letterSpacing: 0.5 },
    addBackButton: { backgroundColor: colors.teal, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
    addBackText: { color: colors.white, fontSize: fs(12), fontWeight: 'bold', letterSpacing: 0.5 },

    // details sheet
    backdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.55)' },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 20,
      paddingTop: 10,
    },
    sheetHandle: {
      alignSelf: 'center',
      width: 40,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.cardLight,
      marginBottom: 16,
    },
    sheetTitleRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    sheetColor: { width: 6, alignSelf: 'stretch', borderRadius: 3 },
    sheetName: { color: colors.white, fontSize: fs(20), fontWeight: 'bold' },
    sheetMeta: { color: colors.muted, fontSize: fs(13), marginTop: 3 },
    sheetInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
    sheetInfoText: { color: colors.white, fontSize: fs(14) },
    sheetDrop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 46,
      borderRadius: 23,
      borderWidth: 1.5,
      borderColor: colors.coral,
      marginTop: 16,
    },
    sheetDropText: { color: colors.coral, fontSize: fs(14), fontWeight: 'bold', letterSpacing: 0.5 },
    lockedNote: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.cardLight,
      borderRadius: 14,
      padding: 12,
      marginTop: 16,
    },
    lockedText: { flex: 1, color: colors.muted, fontSize: fs(13), lineHeight: fs(18) },
  });
