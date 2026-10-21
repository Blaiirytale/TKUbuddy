// src/components/CountdownCard.tsx

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { ThemeColors } from '../constants/colors';
import { FontScaler, useTheme, useThemedStyles } from '../context/ThemeContext';
import {
  CATEGORY_LABELS,
  countdown,
  dateText,
  fetchEvents,
  SchoolEvent,
  upcomingEvents,
} from '../data/eventsData';
import FlipCountdown from './FlipCountdown';

export const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

export default function CountdownCard() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    fetchEvents().then(setEvents);
    const timer = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const next = upcomingEvents(events, now)[0];
  if (!next) return null;
  const c = countdown(next, now);

  return (
    <Pressable
      onPress={() => router.push('/events')}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.flex}>
        <Text style={styles.label}>
          {c.state === 'ongoing' ? 'HAPPENING NOW' : 'NEXT UP'} · {CATEGORY_LABELS[next.category].toUpperCase()}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {c.title}
        </Text>
        <Text style={styles.date}>{dateText(next)}</Text>
        <View style={styles.footer}>
          <Text style={styles.footerText}>All important dates</Text>
          <Ionicons name="chevron-forward" size={13} color={colors.muted} />
        </View>
      </View>
      <View style={styles.right}>
        <FlipCountdown value={c.value} size={50} tile={colors.background} paper={colors.card} />
        <Text style={styles.unit}>{c.unit}</Text>
      </View>
    </Pressable>
  );
}

const makeStyles = (colors: ThemeColors, fs: FontScaler) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 16,
      marginBottom: 24,
    },
    pressed: { opacity: 0.85 },
    flex: { flex: 1 },
    label: { color: colors.muted, fontFamily: MONO, fontSize: fs(9), letterSpacing: 1 },
    title: { color: colors.white, fontSize: fs(17), fontWeight: '900', marginTop: 4 },
    date: { color: colors.muted, fontSize: fs(12), fontWeight: '600', marginTop: 2 },
    footer: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 8 },
    footerText: { color: colors.muted, fontSize: fs(11), fontWeight: '700', textDecorationLine: 'underline' },
    right: { alignItems: 'center' },
    unit: { color: colors.white, fontSize: fs(11), fontWeight: '900', letterSpacing: 0.5, marginTop: 5 },
  });
