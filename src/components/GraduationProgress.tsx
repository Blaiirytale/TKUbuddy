import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ThemeColors } from '../constants/colors';
import { FontScaler, useThemedStyles } from '../context/ThemeContext';

type Props = {
  done: number;
  total: number;
  onPress?: () => void;
};

export default function GraduationProgress({ done, total, onPress }: Props) {
  const styles = useThemedStyles(makeStyles);
  const remaining = Math.max(total - done, 0);
  const percent = Math.min((done / total) * 100, 100);
  const finished = done >= total;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.title}>Graduation Progress</Text>
      <View style={styles.underline} />

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
        <View style={styles.barTextBox}>
          <Text style={styles.barText}>
            {done}/{total} credits
          </Text>
        </View>
      </View>

      <Text style={styles.remaining}>
        {finished
          ? `Graduation credits complete! (+${done - total} extra)`
          : `${remaining} credits remaining`}
      </Text>

      <View style={styles.bottomRow}>
        <Text style={styles.keepGoing}>{finished ? 'well done!' : 'keep going!'}</Text>
        <Text style={styles.mascot}>🐱</Text>
      </View>
    </Pressable>
  );
}
//style here fellaaz
// styles are built from the current theme colors and font size
const makeStyles = (colors: ThemeColors, fs: FontScaler) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  title: {
    color: colors.white,
    fontSize: fs(18),
    fontWeight: 'bold',
  },
  underline: {
    height: 1.5,
    width: 170,
    backgroundColor: colors.muted,
    marginTop: 6,
    marginBottom: 16,
  },
  track: {
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.coral,
    borderRadius: 22,
  },
  barTextBox: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: fs(16),
  },
  remaining: {
    color: colors.white,
    fontSize: fs(14),
    fontWeight: '600',
    marginTop: 10,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  keepGoing: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: fs(14),
  },
  mascot: {
    fontSize: fs(56),
  },
});
