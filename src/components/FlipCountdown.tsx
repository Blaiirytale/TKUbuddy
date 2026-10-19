// src/components/FlipCountdown.tsx
// Flip-calendar style number: one dark tile per digit, split across the middle.
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  value: number;
  size?: number;     // tile height
  tile?: string;     // tile color
  paper?: string;    // background behind the tiles (for the split line)
};

export default function FlipCountdown({ value, size = 96, tile = '#262422', paper = '#ECE9DE' }: Props) {
  const digits = String(Math.min(value, 999)).padStart(2, '0').split('');
  const width = size * 0.8;

  return (
    <View style={styles.row}>
      {digits.map((digit, i) => (
        <View
          key={i}
          style={[styles.tile, { width, height: size, borderRadius: size * 0.12, backgroundColor: tile }]}
        >
          <Text style={[styles.digit, { fontSize: size * 0.78, lineHeight: size }]}>{digit}</Text>
          <View style={[styles.split, { top: size / 2 - 1, backgroundColor: paper }]} />
          <View style={[styles.notch, styles.notchLeft, { top: size / 2 - 4, backgroundColor: paper }]} />
          <View style={[styles.notch, styles.notchRight, { top: size / 2 - 4, backgroundColor: paper }]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  tile: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  digit: { color: '#FFFFFF', fontWeight: '900', textAlign: 'center', includeFontPadding: false },
  split: { position: 'absolute', left: 0, right: 0, height: 2 },
  notch: { position: 'absolute', width: 4, height: 8, borderRadius: 2 },
  notchLeft: { left: -1 },
  notchRight: { right: -1 },
});
