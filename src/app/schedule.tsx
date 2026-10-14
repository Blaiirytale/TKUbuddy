// src/app/schedule.tsx
// My Schedule: the courses you are registered in THIS semester.
// It's locked: you can only drop a course (or add a dropped one back)
// during the add & drop period. The Planner is for trying out NEXT semester.
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { CREDIT_LIMIT, DAYS, PlannedCourse, formatSessions, semesterName, sessionClock } from '../data/plannerData';
import {
  DAY_NAMES,
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
  schoolWeek,
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
  // opens on today (Monday on weekends); tap another day to look at it
  const [selectedDay, setSelectedDay] = useState(() => {
    const day = new Date().getDay();
    return day >= 1 && day <= 5 ? day - 1 : 0;
  });

  const load = useCallback(() => {
    fetchSchedule(STUDENT_ID).then(setSchedule);
  }, []);

  useEffect(() => {
    load();
    // keep "Now" and "Next" up to date while the screen is open
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

  // ---------- the chosen day ----------
  const week = schoolWeek(now);
  const todayIndex = now.getDay() - 1;
  const isToday = selectedDay === todayIndex;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const daySlots = classesOnDay(courses, selectedDay + 1);
  const upcomingIndex = isToday ? daySlots.findIndex((slot) => slot.start > nowMinutes) : -1;
  const liveToday = isToday && daySlots.some((slot) => slot.start <= nowMinutes && nowMinutes < slot.end);
  const next = findNextClass(courses, now);
  const showNextUp = isToday && upcomingIndex === -1 && !liveToday && next !== null;
  const nextWhen = !next
    ? ''
    : next.daysAhead === 0
      ? 'Today'
      : next.daysAhead === 1
        ? 'Tomorrow'
        : WEEKDAYS[next.weekday];

  // ---------- drop / add back ----------
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

          {/* DAY VIEW */}
          <View style={styles.dayCard}>
            <View style={styles.tabs}>
              {DAYS.map((day, i) => {
                const active = i === selectedDay;
                return (
                  <Pressable
                    key={day}
                    onPress={() => setSelectedDay(i)}
                    style={[styles.tab, active && { backgroundColor: colors.teal }]}
                  >
                    <Text style={[styles.tabDay, active && styles.tabTextActive]}>{day.toUpperCase()}</Text>
                    <Text style={[styles.tabDate, active && styles.tabTextActive]}>{week[i].getDate()}</Text>
                    <View
                      style={[
                        styles.todayDot,
                        {
                          backgroundColor:
                            i === todayIndex ? (active ? colors.white : colors.coral) : 'transparent',
                        },
                      ]}
                    />
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>{isToday ? 'Today' : DAY_NAMES[selectedDay + 1]}</Text>
              <Text style={styles.dayCount}>
                {daySlots.length === 0
                  ? 'free day'
                  : `${daySlots.length} class${daySlots.length > 1 ? 'es' : ''}`}
              </Text>
            </View>

            {daySlots.length === 0 ? (
              <View style={styles.freeDay}>
                <Image source={require('../../assets/app-images/bud/bud_sleepy.png')} style={styles.freeBud} />
                <Text style={styles.freeText}>No classes on {DAY_NAMES[selectedDay + 1]} 🎉</Text>
              </View>
            ) : (
              daySlots.map((slot, i) => {
                const done = isToday && slot.end <= nowMinutes;
                const live = isToday && slot.start <= nowMinutes && nowMinutes < slot.end;
                const label = live ? 'NOW' : i === upcomingIndex ? 'NEXT' : done ? 'DONE' : '';
                return (
                  <Pressable
                    key={`${slot.course.id}-${slot.start}`}
                    onPress={() => setSelected(slot.course)}
                    style={({ pressed }) => [styles.classRow, done && styles.faded, pressed && styles.pressed]}
                  >
                    <View style={styles.timeCol}>
                      <Text style={styles.timeStart}>{slot.startText}</Text>
                      <Text style={styles.timeEnd}>{slot.endText}</Text>
                    </View>
                    <View style={[styles.classBar, { backgroundColor: courseColor(slot.course) }]} />
                    <View style={styles.flex}>
                      <Text style={styles.className} numberOfLines={1}>
                        {slot.course.name}
                      </Text>
                      <Text style={styles.classMeta} numberOfLines={1}>
                        {slot.course.room ?? 'Room TBA'}
                        {slot.course.teacher ? ` · ${slot.course.teacher}` : ''}
                      </Text>
                    </View>
                    {label ? (
                      <View
                        style={[
                          styles.chip,
                          {
                            backgroundColor:
                              label === 'NOW' ? colors.coral : label === 'NEXT' ? colors.teal : colors.cardLight,
                          },
                        ]}
                      >
                        <Text style={styles.chipText}>{label}</Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })
            )}

            {showNextUp && next ? (
              <Pressable onPress={() => setSelected(next.course)} style={styles.nextRow}>
                <Ionicons name="arrow-forward-circle" size={18} color={colors.gold} />
                <Text style={styles.nextText} numberOfLines={1}>
                  Next up · {next.course.name} · {nextWhen} {next.startText}
                </Text>
              </Pressable>
            ) : null}
          </View>

          {/* THE PAPER SCHEDULE */}
          <View style={styles.sheetGap} />
          <ScheduleSheet
            courses={courses}
            subtitle={`${schedule.semester} · ${semesterName(schedule.semester).toUpperCase()} · ${totalCredits} CREDITS`}
            ownerName={displayName}
            now={now}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
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

    // day view
    dayCard: { backgroundColor: colors.card, borderRadius: 20, padding: 14, marginTop: 12 },
    tabs: { flexDirection: 'row', gap: 6 },
    tab: {
      flex: 1,
      alignItems: 'center',
      paddingTop: 8,
      paddingBottom: 6,
      borderRadius: 14,
      backgroundColor: colors.cardLight,
    },
    tabDay: { color: colors.muted, fontSize: fs(11), fontWeight: 'bold', letterSpacing: 0.5 },
    tabDate: { color: colors.white, fontSize: fs(17), fontWeight: 'bold', marginTop: 2 },
    tabTextActive: { color: colors.white },
    todayDot: { width: 5, height: 5, borderRadius: 3, marginTop: 3 },
    dayHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginTop: 14,
      marginBottom: 2,
    },
    dayTitle: { color: colors.white, fontSize: fs(19), fontWeight: 'bold' },
    dayCount: { color: colors.muted, fontSize: fs(13), fontWeight: '600' },
    classRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
    timeCol: { width: 46 },
    timeStart: { color: colors.white, fontSize: fs(14), fontWeight: 'bold' },
    timeEnd: { color: colors.muted, fontSize: fs(12), marginTop: 1 },
    classBar: { width: 4, alignSelf: 'stretch', borderRadius: 2 },
    className: { color: colors.white, fontSize: fs(15), fontWeight: 'bold' },
    classMeta: { color: colors.muted, fontSize: fs(12), marginTop: 2 },
    chip: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3 },
    chipText: { color: colors.white, fontSize: fs(11), fontWeight: 'bold', letterSpacing: 0.5 },
    faded: { opacity: 0.5 },
    freeDay: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
    freeBud: { width: 48, height: 48 },
    freeText: { flex: 1, color: colors.white, fontSize: fs(14) },
    nextRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.cardLight,
    },
    nextText: { flex: 1, color: colors.white, fontSize: fs(13), fontWeight: '600' },
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
