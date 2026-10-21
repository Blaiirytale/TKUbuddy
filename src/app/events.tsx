// src/app/events.tsx (later for event)
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MONO } from '../components/CountdownCard';
import FlipCountdown from '../components/FlipCountdown';
import { ThemeColors } from '../constants/colors';
import { FontScaler, useTheme, useThemedStyles } from '../context/ThemeContext';
import {
  CALENDAR_URL,
  CATEGORY_LABELS,
  countdown,
  dateText,
  EventCategory,
  fetchEvents,
  SchoolEvent,
  toDate,
  upcomingEvents,
} from '../data/eventsData';

export default function EventsScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    fetchEvents().then(setEvents);
    const timer = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const coming = upcomingEvents(events, now);
  const past = events
    .filter((e) => countdown(e, now).state === 'past')
    .sort((a, b) => toDate(b.start).getTime() - toDate(a.start).getTime());
  const [hero, ...rest] = coming;

  const categoryColor: Record<EventCategory, string> = {
    registration: colors.teal,
    exam: colors.coral,
    deadline: colors.gold,
    holiday: colors.link,
    semester: colors.muted,
    graduation: '#A98BD9',
  };

  const open = (event: SchoolEvent) => {
    if (event.link) router.push(event.link);
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={28} color={colors.white} />
          </Pressable>
          <Text style={styles.headerTitle}>Important Dates</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}>
          {hero ? (
            (() => {
              const c = countdown(hero, now);
              return (
                <Pressable onPress={() => open(hero)} style={styles.hero}>
                  <Text style={styles.heroBig}>COUNTDOWN</Text>
                  <Text style={styles.heroTitle}>{c.title.toUpperCase()}</Text>
                  <View style={styles.heroTiles}>
                    <FlipCountdown value={c.value} size={80} tile={colors.background} paper={colors.card} />
                  </View>
                  <Text style={styles.heroUnit}>{c.unit}</Text>
                  <Text style={styles.heroDate}>{dateText(hero)}</Text>
                  <Text style={styles.heroFoot}>TKUBUDDY · STAY TUNED</Text>
                </Pressable>
              );
            })()
          ) : (
            <View style={styles.hero}>
              <Text style={styles.heroTitle}>NOTHING COMING UP</Text>
            </View>
          )}

          {rest.length > 0 ? <Text style={styles.sectionTitle}>Coming up</Text> : null}
          {rest.map((event) => {
            const c = countdown(event, now);
            return (
              <Pressable
                key={event.id}
                onPress={() => open(event)}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              >
                <View style={styles.mini}>
                  <FlipCountdown value={c.value} size={30} tile={colors.background} paper={colors.cardLight} />
                  <Text style={styles.miniUnit}>{c.unit}</Text>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.rowTitle}>{c.title}</Text>
                  <Text style={styles.rowDate}>{dateText(event)}</Text>
                  <View style={[styles.chip, { borderColor: categoryColor[event.category] }]}>
                    <Text style={[styles.chipText, { color: categoryColor[event.category] }]}>
                      {CATEGORY_LABELS[event.category]}
                    </Text>
                  </View>
                </View>
                {event.link ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null}
              </Pressable>
            );
          })}

          {past.length > 0 ? <Text style={styles.sectionTitle}>Already passed</Text> : null}
          {past.map((event) => (
            <View key={event.id} style={[styles.row, styles.pastRow]}>
              <Ionicons name="checkmark-circle" size={22} color={colors.muted} />
              <View style={styles.flex}>
                <Text style={styles.rowTitle}>{event.title}</Text>
                <Text style={styles.rowDate}>{dateText(event)}</Text>
              </View>
            </View>
          ))}
          <Pressable onPress={() => Linking.openURL(CALENDAR_URL)} style={styles.source} hitSlop={8}>
            <Text style={styles.sourceText}>Dates from TKU's 2026~2027 academic calendar</Text>
            <Ionicons name="open-outline" size={13} color={colors.white} />
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const makeStyles = (colors: ThemeColors, fs: FontScaler) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    safe: { flex: 1 },
    flex: { flex: 1 },
    pressed: { opacity: 0.75 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    headerTitle: { color: colors.white, fontSize: fs(22), fontWeight: 'bold' },
    content: { paddingHorizontal: 16, paddingTop: 4 },

    hero: { backgroundColor: colors.card, borderRadius: 22, paddingVertical: 20, paddingHorizontal: 16, alignItems: 'center' },
    heroBig: { color: colors.white, fontSize: fs(26), fontWeight: '900', letterSpacing: -1 },
    heroTitle: { color: colors.white, fontSize: fs(15), fontWeight: '800', textAlign: 'center', marginTop: 2 },
    heroTiles: { marginTop: 14 },
    heroUnit: { color: colors.white, fontSize: fs(16), fontWeight: '900', marginTop: 8 },
    heroDate: { color: colors.muted, fontSize: fs(13), fontWeight: '600', marginTop: 2 },
    heroFoot: { color: colors.muted, fontFamily: MONO, fontSize: fs(9), letterSpacing: 1.5, marginTop: 12 },

    sectionTitle: { color: colors.white, fontSize: fs(18), fontWeight: 'bold', marginTop: 24, marginBottom: 10 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 14,
      marginBottom: 10,
    },
    pastRow: { opacity: 0.6 },
    source: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 18 },
    sourceText: { color: colors.white, opacity: 0.8, fontSize: fs(12), textDecorationLine: 'underline' },
    mini: { backgroundColor: colors.cardLight, borderRadius: 12, paddingVertical: 7, paddingHorizontal: 7, alignItems: 'center' },
    miniUnit: { color: colors.white, fontSize: fs(9), fontWeight: '900', marginTop: 4 },
    rowTitle: { color: colors.white, fontSize: fs(15), fontWeight: 'bold' },
    rowDate: { color: colors.muted, fontSize: fs(12), marginTop: 2 },
    chip: { alignSelf: 'flex-start', borderWidth: 1.2, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginTop: 6 },
    chipText: { fontSize: fs(11), fontWeight: '700' },
  });
