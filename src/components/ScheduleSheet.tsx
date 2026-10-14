// src/components/ScheduleSheet.tsx
// A "printed" weekly class schedule: cream paper, real clock times,
// one-color class blocks, lunch breaks, a line for "now",
// and Bud chilling in your free time.
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { ThemeColors } from '../constants/colors';
import { FontScaler, useTheme, useThemedStyles } from '../context/ThemeContext';
import { Day, DAYS, PERIODS, PlannedCourse } from '../data/plannerData';
import { shortName } from './TimetableGrid';

const HOUR_HEIGHT = 54; // height of one hour on the paper
const FIRST_HOUR = 8;
const LAST_HOUR = 17; // the paper grows if a class ends later
const TIME_COLUMN = 40;
const LUNCH = { start: 12 * 60, end: 13 * 60 };
const BUD_SIZE = 44;

// the paper keeps its own colors in every theme; class blocks use the theme color
const PAPER = '#FBF8F3';
const INK = '#2B2420';
const LINE = '#E7E1D7';
const SOFT = '#ECE7DF';
const SOFT_TEXT = '#7A7067';
const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

// Bud doodles for free time (sleeping, happy, reading)
const BUD_IMAGES = [
  require('../../assets/app-images/bud/bud_sleepy.png'),
  require('../../assets/app-images/bud/bud_happy.png'),
  require('../../assets/app-images/bud/bud_thinking.png'),
];

type Block = { course: PlannedCourse; day: Day; start: number; end: number; room?: string };
type Gap = { dayIndex: number; start: number; end: number };

const toMinutes = (hhmm: string) => {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return hours * 60 + minutes;
};
const minutesToY = (minutes: number) => ((minutes - FIRST_HOUR * 60) / 60) * HOUR_HEIGHT;

// every class meeting as a block with real start/end minutes
function buildBlocks(courses: PlannedCourse[]): Block[] {
  const blocks: Block[] = [];
  for (const course of courses) {
    for (const s of course.sessions) {
      const first = PERIODS.find((p) => p.period === s.start);
      const last = PERIODS.find((p) => p.period === s.end);
      if (first && last) {
        blocks.push({ course, day: s.day, start: toMinutes(first.start), end: toMinutes(last.end), room: course.room });
      }
    }
  }
  return blocks;
}

// lunch break shows on days that have classes but nothing between 12:00 and 13:00
function hasLunchBreak(dayBlocks: Block[]) {
  return dayBlocks.length > 0 && !dayBlocks.some((b) => b.start < LUNCH.end && b.end > LUNCH.start);
}

// the longest free stretch of one day (between classes and lunch)
function longestGap(dayIndex: number, dayBlocks: Block[], lunch: boolean, lastHour: number): Gap {
  const busy = dayBlocks.map((b) => ({ start: b.start, end: b.end }));
  if (lunch) busy.push(LUNCH);
  busy.sort((a, b) => a.start - b.start);
  let best: Gap = { dayIndex, start: 0, end: 0 };
  let cursor = FIRST_HOUR * 60;
  for (const b of [...busy, { start: lastHour * 60, end: lastHour * 60 }]) {
    if (b.start - cursor > best.end - best.start) best = { dayIndex, start: cursor, end: b.start };
    cursor = Math.max(cursor, b.end);
  }
  return best;
}

// up to 3 Buds in big free gaps, spread over different days
function pickBudSpots(gaps: Gap[]) {
  const spots: Gap[] = [];
  const bigOnes = gaps.filter((g) => g.end - g.start >= 150).sort((a, b) => (b.end - b.start) - (a.end - a.start));
  for (const gap of bigOnes) {
    if (spots.length === 3) break;
    if (spots.every((s) => Math.abs(s.dayIndex - gap.dayIndex) >= 2)) spots.push(gap);
  }
  return spots;
}

type Props = {
  courses: PlannedCourse[];
  subtitle: string;   // e.g. "115-1 · FALL 2026 · 11 CREDITS"
  ownerName: string;  // printed at the bottom of the paper
  now: Date;
  selectedDay: number; // 0 = Mon ... 4 = Fri
  onSelectDay: (index: number) => void;
  onPressCourse: (course: PlannedCourse) => void;
};

export default function ScheduleSheet({
  courses,
  subtitle,
  ownerName,
  now,
  selectedDay,
  onSelectDay,
  onPressCourse,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const accent = colors.background; // class blocks and times use the theme's main color

  const blocks = buildBlocks(courses);
  const lastHour = Math.max(LAST_HOUR, ...blocks.map((b) => Math.ceil(b.end / 60)));
  const hours = Array.from({ length: lastHour - FIRST_HOUR + 1 }, (_, i) => FIRST_HOUR + i);
  const gridHeight = (lastHour - FIRST_HOUR) * HOUR_HEIGHT;

  const byDay = DAYS.map((day) => blocks.filter((b) => b.day === day));
  const lunchDays = byDay.map(hasLunchBreak);
  const budSpots = pickBudSpots(byDay.map((list, i) => longestGap(i, list, lunchDays[i], lastHour)));

  const todayIndex = now.getDay() - 1; // Mon = 0 ... Fri = 4 (weekend = -1 or 5)
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const showNowLine =
    todayIndex >= 0 && todayIndex < DAYS.length && nowMinutes >= FIRST_HOUR * 60 && nowMinutes <= lastHour * 60;

  return (
    <View style={styles.paper}>
      <Text style={styles.title}>class schedule</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {/* tap a day to pick it; the coral dot marks today */}
      <View style={styles.dayRow}>
        <View style={{ width: TIME_COLUMN }} />
        {DAYS.map((day, i) => (
          <Pressable key={day} style={styles.dayCell} onPress={() => onSelectDay(i)} hitSlop={6}>
            <Text
              style={[
                styles.dayText,
                { color: accent },
                i === selectedDay && [styles.activePill, { backgroundColor: accent }],
              ]}
            >
              {day.toUpperCase()}
            </Text>
            <View
              style={[styles.todayMark, { backgroundColor: i === todayIndex ? colors.coral : 'transparent' }]}
            />
          </Pressable>
        ))}
      </View>
      <View style={[styles.topRule, { backgroundColor: accent }]} />

      <View style={[styles.body, { height: gridHeight + 8 }]}>
        {/* hour labels */}
        <View style={{ width: TIME_COLUMN }}>
          {hours.map((h) => (
            <Text key={h} style={[styles.hourText, { color: accent, top: (h - FIRST_HOUR) * HOUR_HEIGHT - 7 }]}>
              {h}:00
            </Text>
          ))}
        </View>

        <View style={styles.flex}>
          {/* hour lines */}
          {hours.map((h) => (
            <View key={h} style={[styles.hourLine, { top: (h - FIRST_HOUR) * HOUR_HEIGHT }]} />
          ))}

          <View style={styles.columns}>
            {DAYS.map((day, dayIndex) => (
              <View key={day} style={[styles.dayColumn, dayIndex === selectedDay && styles.selectedColumn]}>
                {lunchDays[dayIndex] ? (
                  <View
                    style={[
                      styles.lunch,
                      { top: minutesToY(LUNCH.start) + 8, height: HOUR_HEIGHT - 16 },
                    ]}
                  >
                    <Text style={styles.lunchText}>LUNCH</Text>
                  </View>
                ) : null}

                {budSpots
                  .filter((spot) => spot.dayIndex === dayIndex)
                  .map((spot) => {
                    const middle = minutesToY((spot.start + spot.end) / 2);
                    return (
                      <View key={`bud-${dayIndex}`} style={[styles.budSpot, { top: middle - BUD_SIZE / 2 }]}>
                        <Image source={BUD_IMAGES[budSpots.indexOf(spot) % BUD_IMAGES.length]} style={styles.budImage} />
                        <View style={styles.budShadow} />
                      </View>
                    );
                  })}

                {byDay[dayIndex].map((b) => {
                  const height = minutesToY(b.end) - minutesToY(b.start);
                  return (
                    <Pressable
                      key={`${b.course.id}-${b.start}`}
                      onPress={() => onPressCourse(b.course)}
                      style={({ pressed }) => [
                        styles.block,
                        { top: minutesToY(b.start) + 1, height: height - 2, backgroundColor: accent },
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.blockName} numberOfLines={height > 70 ? 4 : 2}>
                        {(b.course.shortName ?? shortName(b.course.name)).toUpperCase()}
                      </Text>
                      {height > 50 && b.room ? <Text style={styles.blockRoom}>{b.room}</Text> : null}
                    </Pressable>
                  );
                })}

                {showNowLine && dayIndex === todayIndex ? (
                  <View style={[styles.nowLine, { top: minutesToY(nowMinutes) - 1, backgroundColor: colors.coral }]}>
                    <View style={[styles.nowDot, { backgroundColor: colors.coral }]} />
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        </View>
      </View>

      <Text style={[styles.footer, { color: accent }]}>{ownerName.toUpperCase()} · TAMKANG UNIVERSITY</Text>
    </View>
  );
}

// styles are built from the current theme colors and font size
const makeStyles = (colors: ThemeColors, fs: FontScaler) =>
  StyleSheet.create({
    flex: { flex: 1 },
    pressed: { opacity: 0.75 },
    paper: { backgroundColor: PAPER, borderRadius: 24, paddingHorizontal: 14, paddingTop: 22, paddingBottom: 18 },
    title: {
      color: INK,
      fontSize: fs(34),
      fontWeight: '500',
      letterSpacing: -1.5,
      textAlign: 'center',
    },
    subtitle: {
      color: SOFT_TEXT,
      fontFamily: MONO,
      fontSize: fs(11),
      letterSpacing: 1,
      textAlign: 'center',
      marginTop: 4,
      marginBottom: 18,
    },
    dayRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    dayCell: { flex: 1, alignItems: 'center' },
    dayText: {
      fontFamily: MONO,
      fontSize: fs(11),
      fontWeight: '600',
      letterSpacing: 1,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 9,
      overflow: 'hidden',
    },
    activePill: { color: '#FFFFFF' },
    todayMark: { width: 5, height: 5, borderRadius: 3, marginTop: 4 },
    topRule: { height: 2, borderRadius: 1, marginBottom: 2 },
    body: { flexDirection: 'row', marginTop: 8 },
    hourText: {
      position: 'absolute',
      left: 0,
      fontFamily: MONO,
      fontSize: Math.min(fs(10), 11),
      fontWeight: '600',
    },
    hourLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: LINE },
    columns: { flex: 1, flexDirection: 'row' },
    dayColumn: { flex: 1 },
    selectedColumn: { backgroundColor: 'rgba(43, 36, 32, 0.045)', borderRadius: 8 },
    block: {
      position: 'absolute',
      left: 2.5,
      right: 2.5,
      borderRadius: 6,
      paddingHorizontal: 3,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    blockName: {
      color: '#FFFFFF',
      fontSize: Math.min(fs(8), 9),
      lineHeight: Math.min(fs(10), 11),
      fontWeight: '600',
      textAlign: 'center',
    },
    blockRoom: { color: '#FFFFFF', opacity: 0.85, fontSize: Math.min(fs(8), 9), marginTop: 4 },
    lunch: {
      position: 'absolute',
      left: 4,
      right: 4,
      borderRadius: 8,
      backgroundColor: SOFT,
      alignItems: 'center',
      justifyContent: 'center',
    },
    lunchText: { color: SOFT_TEXT, fontSize: Math.min(fs(9), 10), fontWeight: '600', letterSpacing: 0.5 },
    budSpot: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
    budImage: { width: BUD_SIZE, height: BUD_SIZE, zIndex: 1 },
    budShadow: { width: 40, height: 9, borderRadius: 20, backgroundColor: SOFT, marginTop: -6 },
    nowLine: { position: 'absolute', left: 0, right: 0, height: 2 },
    nowDot: { position: 'absolute', left: -3, top: -3, width: 8, height: 8, borderRadius: 4 },
    footer: {
      fontFamily: MONO,
      fontSize: fs(11),
      fontWeight: '600',
      letterSpacing: 1.5,
      textAlign: 'center',
      marginTop: 16,
    },
  });
