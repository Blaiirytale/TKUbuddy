import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ThemeColors } from '../constants/colors';
import { CATEGORY_LABELS, CourseSuggestion, SuggestionCategory } from '../data/suggestionsData';
import { FontScaler, useTheme, useThemedStyles } from '../context/ThemeContext';


export const CATEGORY_COLORS: Record<SuggestionCategory, string> = {
  humanities: '#F25B5D',
  social: '#E9B949',
  science: '#35AECF',
  required: '#A98BD9',
};

type Props = {
  course: CourseSuggestion;
  added: boolean;
  onToggleAdd: () => void;
};

export default function SuggestionCard({ course, added, onToggleAdd }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const color = CATEGORY_COLORS[course.category];

  return (
    <View style={styles.card}>
      {/* top row: category badge and credits */}
      <View style={styles.topRow}>
        <View style={[styles.badge, { backgroundColor: color + '33' }]}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={[styles.badgeText, { color }]}>
            {CATEGORY_LABELS[course.category].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.credits}>{course.credits} credits</Text>
      </View>

      <Text style={styles.name}>{course.name}</Text>
      <Text style={styles.code}>
        {course.code} · {course.field}
      </Text>

      {/* time and teacher */}
      <View style={styles.infoRow}>
        <View style={styles.info}>
          <Ionicons name="time-outline" size={14} color={colors.muted} />
          <Text style={styles.infoText}>{course.schedule}</Text>
        </View>
        <View style={styles.info}>
          <Ionicons name="person-outline" size={14} color={colors.muted} />
          <Text style={styles.infoText}>{course.teacher}</Text>
        </View>
      </View>

      {/* why it's suggested */}
      <View style={styles.reason}>
        <Ionicons name="bulb-outline" size={15} color={colors.gold} />
        <Text style={styles.reasonText}>{course.reason}</Text>
      </View>

      {course.hasConflict && (
        <View style={styles.conflict}>
          <Ionicons name="warning-outline" size={15} color={colors.coral} />
          <Text style={styles.conflictText}>Time conflict with your schedule</Text>
        </View>
      )}

      {/* add / added button */}
      <Pressable
        onPress={onToggleAdd}
        style={({ pressed }) => [
          styles.button,
          added ? styles.buttonAdded : null,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons name={added ? 'checkmark' : 'add'} size={18} color={colors.white} />
        <Text style={styles.buttonText}>{added ? 'ADDED TO PLANNER' : 'ADD TO PLANNER'}</Text>
      </Pressable>
    </View>
  );
}

// styles are built from the current theme colors and font size
const makeStyles = (colors: ThemeColors, fs: FontScaler) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  badgeText: { fontSize: fs(10), fontWeight: 'bold', letterSpacing: 0.5 },
  credits: { color: colors.muted, fontSize: fs(12), fontWeight: '600' },
  name: { color: colors.white, fontSize: fs(17), fontWeight: 'bold' },
  code: { color: colors.muted, fontSize: fs(13), marginTop: 2 },
  infoRow: { flexDirection: 'row', gap: 16, marginTop: 10 },
  info: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { color: colors.muted, fontSize: fs(13) },
  reason: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: colors.cardLight,
  },
  reasonText: { flex: 1, color: colors.white, fontSize: fs(13) },
  conflict: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  conflictText: { color: colors.coral, fontSize: fs(12), fontWeight: '600' },
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
  buttonText: { color: colors.white, fontSize: fs(13), fontWeight: 'bold', letterSpacing: 0.5 },
  pressed: { opacity: 0.7 },
});
