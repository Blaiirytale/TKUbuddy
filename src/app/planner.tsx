import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import TimetableGrid, { courseColor } from '../components/TimetableGrid';
import { ThemeColors } from '../constants/colors';
import { usePlanner } from '../context/PlannerContext';
import { FontScaler, useTheme, useThemedStyles } from '../context/ThemeContext';
import { countsTowardCredits, fetchCourseHistory, HistoryCourse } from '../data/historyData';
import {
  CREDIT_LIMIT,
  formatSessions,
  GRADUATION_CREDITS,
  PLAN_SEMESTER,
  PlannedCourse,
  semesterName,
  sessionClock,
} from '../data/plannerData';

// TEMPORARY: will come from the login later
const STUDENT_ID = '411000001';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// in the phone's own time zone
function formatSavedTime(iso: string) {
  const d = new Date(iso);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${hours}:${minutes}`;
}

const sumCredits = (list: HistoryCourse[]) => list.reduce((sum, c) => sum + c.credits, 0);

export default function PlannerScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { courses, totalCredits, removeCourse, saveSchedule, saving, savedAt, unsaved } =
    usePlanner();

 
  const [selected, setSelected] = useState<PlannedCourse | null>(null);

  const [earned, setEarned] = useState<{ passed: number; ongoing: number } | null>(null);

  useEffect(() => {
    fetchCourseHistory(STUDENT_ID).then((history) => {
      setEarned({
        passed: sumCredits(history.courses.filter(countsTowardCredits)),
        ongoing: sumCredits(history.courses.filter((c) => c.status === 'in_progress')),
      });
    });
  }, []);

  
  const underMin = totalCredits < CREDIT_LIMIT.min;
  const overMax = totalCredits > CREDIT_LIMIT.max;
  const limitColor = overMax ? colors.coral : underMin ? colors.gold : colors.teal;
  const limitIcon = overMax ? 'alert-circle' : underMin ? 'information-circle' : 'checkmark-circle';
  const limitText = overMax
    ? `Over the limit of ${CREDIT_LIMIT.max} credits`
    : underMin
      ? `Below the minimum of ${CREDIT_LIMIT.min} credits`
      : 'Within the credit limit';
  const barWidth = Math.min(totalCredits / CREDIT_LIMIT.max, 1);

  
  const afterPlan = earned ? earned.passed + earned.ongoing + totalCredits : 0;
  const shortBy = Math.max(GRADUATION_CREDITS - afterPlan, 0);

  function confirmRemove(course: PlannedCourse) {
    Alert.alert('Remove course?', `Take ${course.name} out of your planner?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeCourse(course.id) },
    ]);
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={28} color={colors.white} />
          </Pressable>
          <Text style={styles.headerTitle}>Planner</Text>
          {/* + opens Course Suggestions to add more (Advance Search later) */}
          <Pressable onPress={() => router.push('/suggestions')} hitSlop={12}>
            <Ionicons name="add-circle-outline" size={28} color={colors.white} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom }]}>
          {/* SUMMARY: credits planned and the graduation check */}
          <View style={styles.summary}>
            <Text style={styles.semester}>
              {PLAN_SEMESTER} · {semesterName(PLAN_SEMESTER)}
            </Text>
            <View style={styles.creditsRow}>
              <Text style={styles.creditsNumber}>
                {totalCredits} <Text style={styles.creditsUnit}>credits planned</Text>
              </Text>
              <Text style={styles.limit}>
                limit {CREDIT_LIMIT.min}-{CREDIT_LIMIT.max}
              </Text>
            </View>
            <View style={styles.track}>
              <View
                style={[styles.fill, { width: `${barWidth * 100}%`, backgroundColor: limitColor }]}
              />
            </View>
            <View style={styles.statusRow}>
              <Ionicons name={limitIcon} size={16} color={limitColor} />
              <Text style={[styles.statusText, { color: limitColor }]}>{limitText}</Text>
            </View>

            {earned ? (
              <View style={styles.gradRow}>
                <Ionicons name="school-outline" size={22} color={colors.white} />
                <View style={styles.flex}>
                  <Text style={styles.gradTitle}>
                    With this plan: {afterPlan} / {GRADUATION_CREDITS}
                  </Text>
                  <Text style={styles.gradSub}>
                    {earned.passed} passed · {earned.ongoing} this semester · {totalCredits} planned
                  </Text>
                </View>
                <View
                  style={[
                    styles.gradBadge,
                    { backgroundColor: shortBy === 0 ? colors.teal : colors.coral },
                  ]}
                >
                  <Text style={styles.gradBadgeText}>
                    {shortBy === 0 ? 'On track' : `${shortBy} short`}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* EMPTY STATE */}
          {courses.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="calendar-clear-outline" size={36} color={colors.white} />
              <Text style={styles.emptyTitle}>Your planner is empty</Text>
              <Text style={styles.emptyText}>
                Add courses from Course Suggestions and they will show up on your timetable.
              </Text>
              <Pressable
                style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}
                onPress={() => router.push('/suggestions')}
              >
                <Ionicons name="bulb-outline" size={18} color={colors.white} />
                <Text style={styles.emptyButtonText}>BROWSE SUGGESTIONS</Text>
              </Pressable>
            </View>
          ) : null}

          {/* WEEKLY TIMETABLE */}
          <Text style={styles.sectionTitle}>Weekly timetable</Text>
          <TimetableGrid courses={courses} onPressCourse={setSelected} />

          {/* LIST OF PLANNED COURSES */}
          {courses.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Planned courses · {courses.length}</Text>
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
                      {course.code} · {course.credits} cr · {formatSessions(course.sessions)}
                    </Text>
                  </View>
                  <Pressable onPress={() => confirmRemove(course)} hitSlop={10}>
                    <Ionicons name="trash-outline" size={20} color={colors.muted} />
                  </Pressable>
                </Pressable>
              ))}
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>

      {/* SAVE BAR: stays at the bottom */}
      {courses.length > 0 || unsaved ? (
        <View style={[styles.saveBar, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.flex}>
            <Text style={styles.saveTitle}>{unsaved ? 'Unsaved changes' : 'Schedule saved'}</Text>
            <Text style={styles.saveSub}>
              {savedAt ? `Last saved ${formatSavedTime(savedAt)}` : 'Not saved yet'}
            </Text>
          </View>
          <Pressable
            onPress={saveSchedule}
            disabled={!unsaved || saving}
            style={({ pressed }) => [
              styles.saveButton,
              !unsaved && styles.saveButtonDone,
              pressed && styles.pressed,
            ]}
          >
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons name={unsaved ? 'save-outline' : 'checkmark'} size={18} color={colors.white} />
                <Text style={styles.saveButtonText}>{unsaved ? 'SAVE' : 'SAVED'}</Text>
              </>
            )}
          </Pressable>
        </View>
      ) : null}

      {/* COURSE DETAILS: slides up when you tap a class */}
      <Modal
        visible={selected !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.backdrop}>
          {/* tapping the dark area closes the sheet */}
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

              <Pressable
                style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
                onPress={() => {
                  removeCourse(selected.id);
                  setSelected(null);
                }}
              >
                <Ionicons name="trash-outline" size={18} color={colors.coral} />
                <Text style={styles.removeText}>REMOVE FROM PLANNER</Text>
              </Pressable>
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
    pressed: { opacity: 0.7 },

    // summary card
    summary: { backgroundColor: colors.card, borderRadius: 20, padding: 18 },
    semester: { color: colors.muted, fontSize: fs(13), fontWeight: '600' },
    creditsRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    creditsNumber: { color: colors.white, fontSize: fs(34), fontWeight: 'bold' },
    creditsUnit: { color: colors.white, fontSize: fs(15), fontWeight: '600' },
    limit: { color: colors.muted, fontSize: fs(12), marginBottom: 8 },
    track: {
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.cardLight,
      marginTop: 8,
      overflow: 'hidden',
    },
    fill: { height: '100%', borderRadius: 5 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
    statusText: { fontSize: fs(13), fontWeight: '600' },
    gradRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 14,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: colors.cardLight,
    },
    gradTitle: { color: colors.white, fontSize: fs(14), fontWeight: 'bold' },
    gradSub: { color: colors.muted, fontSize: fs(11), marginTop: 2 },
    gradBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
    gradBadgeText: { color: colors.white, fontSize: fs(11), fontWeight: 'bold' },

    // empty state
    empty: {
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 22,
      marginTop: 16,
    },
    emptyTitle: { color: colors.white, fontSize: fs(17), fontWeight: 'bold', marginTop: 8 },
    emptyText: {
      color: colors.muted,
      fontSize: fs(13),
      textAlign: 'center',
      marginTop: 4,
      lineHeight: fs(19),
    },
    emptyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      height: 40,
      paddingHorizontal: 18,
      borderRadius: 20,
      backgroundColor: colors.coral,
      marginTop: 14,
    },
    emptyButtonText: { color: colors.white, fontSize: fs(13), fontWeight: 'bold', letterSpacing: 0.5 },

    sectionTitle: {
      color: colors.white,
      fontSize: fs(18),
      fontWeight: 'bold',
      marginTop: 22,
      marginBottom: 10,
    },

    // planned course rows
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
    },
    rowColor: { width: 6, alignSelf: 'stretch', borderRadius: 3 },
    rowName: { color: colors.white, fontSize: fs(15), fontWeight: 'bold' },
    rowMeta: { color: colors.muted, fontSize: fs(12), marginTop: 3 },

    // save bar
    saveBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.card,
      paddingHorizontal: 20,
      paddingTop: 12,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
    },
    saveTitle: { color: colors.white, fontSize: fs(15), fontWeight: 'bold' },
    saveSub: { color: colors.muted, fontSize: fs(12), marginTop: 2 },
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      minWidth: 112,
      height: 44,
      paddingHorizontal: 18,
      borderRadius: 22,
      backgroundColor: colors.coral,
    },
    saveButtonDone: { backgroundColor: colors.teal },
    saveButtonText: { color: colors.white, fontSize: fs(14), fontWeight: 'bold', letterSpacing: 0.5 },

    // course details sheet
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
    removeButton: {
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
    removeText: { color: colors.coral, fontSize: fs(14), fontWeight: 'bold', letterSpacing: 0.5 },
  });
