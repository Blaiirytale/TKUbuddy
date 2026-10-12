// src/components/TimetableGrid.tsx
// The weekly timetable: Mon-Fri across the top, TKU periods down the side,
// and each planned class drawn as a colored block you can tap.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ThemeColors } from '../constants/colors';
import { FontScaler, useThemedStyles } from '../context/ThemeContext';
import { DAYS, PERIODS, PlannedCourse } from '../data/plannerData';

const ROW_HEIGHT = 46; // height of one period
const FIRST_PERIOD = 1;
const DEFAULT_LAST_PERIOD = 9; // 16:10-17:00; the grid grows if a class is later

// block colors for courses that don't bring their own color
const BLOCK_COLORS = ['#E5585A', '#2A9BB8', '#8B6FD6', '#3E9E6A', '#D9822B', '#C9568F', '#4F7CC9'];

// the same course code always gets the same color
export function courseColor(course: PlannedCourse) {
  if (course.color) return course.color;
  let hash = 0;
  for (const letter of course.code) hash = (hash * 31 + letter.charCodeAt(0)) % 997;
  return BLOCK_COLORS[hash % BLOCK_COLORS.length];
}

// A block is only about 50 points wide, so long words would break in the
// middle ("Introducti-on"). The timetable shows short forms instead;
// the list and the details sheet still show the full name.
// (If the school data has its own short names, put them in course.shortName.)
const SHORT_PHRASES: [string, string][] = [
  ['Artificial Intelligence', 'AI'],
  ['Human-Computer Interaction', 'HCI'],
  ['Object-Oriented', 'OO'],
  ['Machine Learning', 'ML'],
];
const SHORT_WORDS: Record<string, string> = {
  Introduction: 'Intro',
  Programming: 'Prog.',
  Language: 'Lang.',
  Languages: 'Lang.',
  Sustainability: 'Sustain.',
  Psychology: 'Psych.',
  Philosophy: 'Philos.',
  Environmental: 'Env.',
  Engineering: 'Eng.',
  Communication: 'Comm.',
  Management: 'Mgmt.',
  Information: 'Info.',
  Technology: 'Tech.',
  International: 'Intl.',
  Mathematics: 'Math',
  Statistics: 'Stats',
  Probability: 'Prob.',
  Algorithms: 'Algo.',
  Structures: 'Struct.',
  Literature: 'Lit.',
  Accounting: 'Acct.',
  Organization: 'Org.',
  Fundamentals: 'Fund.',
  Interaction: 'Interact.',
  Development: 'Dev.',
  Applications: 'Apps',
};

export function shortName(name: string) {
  let text = name;
  for (const [long, short] of SHORT_PHRASES) text = text.split(long).join(short);
  const shorten = (word: string) =>
    SHORT_WORDS[word] ?? (word.length > 9 ? word.slice(0, 7) + '.' : word);
  return text
    .split(' ')
    .map((word) => word.split('-').map(shorten).join('-'))
    .join(' ');
}

// dark text on light blocks (like yellow), white text on dark blocks
export function textColorOn(hex: string) {
  const n = parseInt(hex.replace('#', '').slice(0, 6), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return brightness > 0.6 ? '#1E1E1E' : '#FFFFFF';
}

type Props = {
  courses: PlannedCourse[];
  onPressCourse: (course: PlannedCourse) => void;
};

export default function TimetableGrid({ courses, onPressCourse }: Props) {
  const styles = useThemedStyles(makeStyles);

  // periods 1-9, or more when a planned class ends later in the evening
  const latestEnd = Math.max(
    DEFAULT_LAST_PERIOD,
    ...courses.flatMap((c) => c.sessions.map((s) => s.end))
  );
  const rows = PERIODS.filter((p) => p.period >= FIRST_PERIOD && p.period <= latestEnd);

  return (
    <View style={styles.grid}>
      {/* day names */}
      <View style={styles.headerRow}>
        <View style={styles.timeColumn} />
        {DAYS.map((day) => (
          <Text key={day} style={styles.dayName}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.body}>
        {/* period numbers with their start time */}
        <View style={styles.timeColumn}>
          {rows.map((p) => (
            <View key={p.period} style={styles.timeCell}>
              <Text style={styles.periodNumber}>{p.period}</Text>
              <Text style={styles.periodTime}>{p.start}</Text>
            </View>
          ))}
        </View>

        {/* one column per day; class blocks are placed on top of the lines */}
        {DAYS.map((day) => (
          <View key={day} style={styles.dayColumn}>
            {rows.map((p) => (
              <View key={p.period} style={styles.cell} />
            ))}

            {courses.flatMap((course) =>
              course.sessions
                .filter((s) => s.day === day && s.start >= FIRST_PERIOD)
                .map((s) => {
                  const color = courseColor(course);
                  const textColor = textColorOn(color);
                  const length = s.end - s.start + 1; // how many periods long
                  return (
                    <Pressable
                      key={`${course.id}-${s.day}-${s.start}`}
                      onPress={() => onPressCourse(course)}
                      style={({ pressed }) => [
                        styles.block,
                        {
                          top: (s.start - FIRST_PERIOD) * ROW_HEIGHT + 2,
                          height: length * ROW_HEIGHT - 4,
                          backgroundColor: color,
                        },
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text
                        style={[styles.blockName, { color: textColor }]}
                        numberOfLines={length > 1 ? 3 : 2}
                      >
                        {course.shortName ?? shortName(course.name)}
                      </Text>
                      {length > 1 && course.room ? (
                        <Text style={[styles.blockRoom, { color: textColor }]} numberOfLines={1}>
                          {course.room}
                        </Text>
                      ) : null}
                    </Pressable>
                  );
                })
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

// styles are built from the current theme colors and font size
const makeStyles = (colors: ThemeColors, fs: FontScaler) =>
  StyleSheet.create({
    grid: { backgroundColor: colors.card, borderRadius: 16, padding: 6, paddingTop: 12 },
    headerRow: { flexDirection: 'row', marginBottom: 6 },
    timeColumn: { width: 32 },
    dayName: {
      flex: 1,
      textAlign: 'center',
      color: colors.white,
      fontSize: fs(12),
      fontWeight: 'bold',
    },
    body: { flexDirection: 'row' },
    timeCell: {
      height: ROW_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
      borderTopWidth: 1,
      borderTopColor: colors.cardLight,
    },
    periodNumber: { color: colors.white, fontSize: fs(12), fontWeight: 'bold' },
    periodTime: { color: colors.muted, fontSize: fs(9) },
    dayColumn: { flex: 1, borderLeftWidth: 1, borderLeftColor: colors.cardLight },
    cell: { height: ROW_HEIGHT, borderTopWidth: 1, borderTopColor: colors.cardLight },
    block: {
      position: 'absolute',
      left: 1.5,
      right: 1.5,
      borderRadius: 8,
      paddingHorizontal: 3,
      paddingVertical: 4,
      overflow: 'hidden',
    },
    // capped so the narrow blocks still fit their words on the Large font size
    blockName: {
      fontSize: Math.min(fs(9), 10),
      lineHeight: Math.min(fs(11), 12),
      fontWeight: 'bold',
      letterSpacing: -0.2,
    },
    blockRoom: { fontSize: Math.min(fs(8), 9), marginTop: 2, opacity: 0.9 },
    pressed: { opacity: 0.75 },
  });
