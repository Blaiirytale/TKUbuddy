// src/app/catalogue.tsx
// Course Catalogue: every course at TKU, grouped by department.
// Advance Search is for finding classes in a semester; this is for browsing.
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeColors } from '../constants/colors';
import { useProfile } from '../context/ProfileContext';
import { FontScaler, useTheme, useThemedStyles } from '../context/ThemeContext';
import { CatalogueCourse, fetchCatalogue } from '../data/catalogueData';

const COLLEGES = [
  { id: null, label: 'All' },
  { id: 'Engineering', label: 'Engineering' },
  { id: 'Social Sciences', label: 'Social Sci.' },
  { id: 'Liberal Arts', label: 'Liberal Arts' },
  { id: 'General Education', label: 'GE' },
];

export default function CatalogueScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useProfile();

  const [all, setAll] = useState<CatalogueCourse[]>([]);
  const [query, setQuery] = useState('');
  const [college, setCollege] = useState<string | null>(null);
  const [selected, setSelected] = useState<CatalogueCourse | null>(null);

  useEffect(() => {
    fetchCatalogue().then(setAll);
  }, []);

  const word = query.trim().toLowerCase();
  const shown = all.filter(
    (c) =>
      (!college || c.college === college) &&
      (!word || `${c.nameEn} ${c.nameZh} ${c.code}`.toLowerCase().includes(word))
  );

  // group by department, keeping the catalogue order
  const groups: { department: string; courses: CatalogueCourse[] }[] = [];
  for (const course of shown) {
    const group = groups.find((g) => g.department === course.department);
    if (group) group.courses.push(course);
    else groups.push({ department: course.department, courses: [course] });
  }

  const byCode = (code: string) => all.find((c) => c.code === code);
  const mainName = (c: CatalogueCourse) => (language === 'zh' ? c.nameZh : c.nameEn);
  const otherName = (c: CatalogueCourse) => (language === 'zh' ? c.nameEn : c.nameZh);
  const neededFor = selected ? all.filter((c) => c.prerequisites.includes(selected.code)) : [];

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={28} color={colors.white} />
          </Pressable>
          <Text style={styles.headerTitle}>Course Catalogue</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.top}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#8B8B8B" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search all courses"
              placeholderTextColor="#9A9A9A"
              style={styles.searchInput}
            />
            {query ? (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color="#9A9A9A" />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.pillBar}>
            {COLLEGES.map((item) => {
              const on = college === item.id;
              return (
                <Pressable key={item.label} onPress={() => setCollege(item.id)} style={[styles.pill, on && styles.pillActive]}>
                  <Text style={[styles.pillText, on && styles.pillTextActive]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}
        >
          <Text style={styles.count}>
            {shown.length} course{shown.length === 1 ? '' : 's'}
          </Text>

          {groups.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="book-outline" size={30} color={colors.muted} />
              <Text style={styles.emptyText}>No course called "{query}".</Text>
            </View>
          ) : (
            groups.map((g) => (
              <View key={g.department} style={styles.group}>
                <View style={styles.groupHead}>
                  <Text style={styles.groupTitle}>{g.department}</Text>
                  <Text style={styles.groupCount}>{g.courses.length}</Text>
                </View>
                <View style={styles.list}>
                  {g.courses.map((course, i) => (
                    <Pressable
                      key={course.code}
                      onPress={() => setSelected(course)}
                      style={({ pressed }) => [styles.row, i > 0 && styles.rowBorder, pressed && styles.pressed]}
                    >
                      <View style={styles.flex}>
                        <Text style={styles.rowName} numberOfLines={1}>
                          {mainName(course)}
                        </Text>
                        <Text style={styles.rowSub} numberOfLines={1}>
                          {otherName(course)} · {course.code}
                        </Text>
                      </View>
                      <Text style={styles.rowCredits}>{course.credits} cr</Text>
                      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                    </Pressable>
                  ))}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>

      <Modal visible={selected !== null} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.backdrop}>
          <Pressable style={styles.flex} onPress={() => setSelected(null)} />
          {selected ? (
            <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetName}>{mainName(selected)}</Text>
              <Text style={styles.sheetSub}>{otherName(selected)}</Text>
              <View style={styles.tagRow}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{selected.code}</Text>
                </View>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{selected.credits} credits</Text>
                </View>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{selected.department}</Text>
                </View>
              </View>
              <Text style={styles.description}>{selected.description}</Text>

              <Text style={styles.sheetLabel}>Take first</Text>
              {selected.prerequisites.length === 0 ? (
                <Text style={styles.none}>Nothing, anyone can take it</Text>
              ) : (
                <View style={styles.tagRow}>
                  {selected.prerequisites.map((code) => {
                    const pre = byCode(code);
                    return (
                      <Pressable key={code} onPress={() => pre && setSelected(pre)} style={styles.linkChip}>
                        <Text style={styles.linkText}>{pre ? mainName(pre) : code}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {neededFor.length > 0 ? (
                <>
                  <Text style={styles.sheetLabel}>Opens up</Text>
                  <View style={styles.tagRow}>
                    {neededFor.map((next) => (
                      <Pressable key={next.code} onPress={() => setSelected(next)} style={styles.linkChip}>
                        <Text style={styles.linkText}>{mainName(next)}</Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : null}

              <Pressable
                onPress={() => {
                  const code = selected.code;
                  setSelected(null);
                  router.push({ pathname: '/search', params: { q: code } });
                }}
                style={({ pressed }) => [styles.findButton, pressed && styles.pressed]}
              >
                <Ionicons name="search" size={18} color={colors.white} />
                <Text style={styles.findText}>FIND CLASSES</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (colors: ThemeColors, fs: FontScaler) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
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
    top: { paddingHorizontal: 16, paddingBottom: 6 },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      height: 46,
      borderRadius: 14,
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 14,
    },
    searchInput: { flex: 1, fontSize: fs(15), color: '#222222' },
    pillBar: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 4,
      marginTop: 12,
      borderWidth: 1.5,
      borderColor: colors.cardLight,
    },
    pill: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 6, paddingVertical: 8, borderRadius: 20 },
    pillActive: { backgroundColor: colors.white },
    pillText: { color: colors.white, fontSize: Math.min(fs(12), 13), fontWeight: '600' },
    pillTextActive: { color: colors.card },

    content: { paddingHorizontal: 16, paddingTop: 6 },
    count: { color: colors.white, opacity: 0.85, fontSize: fs(13), fontWeight: '600', marginBottom: 4 },
    group: { marginTop: 14 },
    groupHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 },
    groupTitle: { color: colors.white, fontSize: fs(17), fontWeight: 'bold' },
    groupCount: { color: colors.white, opacity: 0.8, fontSize: fs(13), fontWeight: '600' },
    list: { backgroundColor: colors.card, borderRadius: 16, paddingHorizontal: 14 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
    rowBorder: { borderTopWidth: 1, borderTopColor: colors.cardLight },
    rowName: { color: colors.white, fontSize: fs(15), fontWeight: 'bold' },
    rowSub: { color: colors.muted, fontSize: fs(12), marginTop: 2 },
    rowCredits: { color: colors.white, fontSize: fs(13), fontWeight: '600' },
    empty: { alignItems: 'center', gap: 8, backgroundColor: colors.card, borderRadius: 18, padding: 24, marginTop: 10 },
    emptyText: { color: colors.muted, fontSize: fs(14), textAlign: 'center' },

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
    sheetName: { color: colors.white, fontSize: fs(21), fontWeight: 'bold' },
    sheetSub: { color: colors.muted, fontSize: fs(14), marginTop: 3 },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    tag: { backgroundColor: colors.cardLight, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
    tagText: { color: colors.white, fontSize: fs(12), fontWeight: '600' },
    description: { color: colors.white, fontSize: fs(14), lineHeight: fs(20), marginTop: 14 },
    sheetLabel: { color: colors.muted, fontSize: fs(12), fontWeight: 'bold', letterSpacing: 0.5, marginTop: 18 },
    none: { color: colors.white, fontSize: fs(13), marginTop: 6 },
    linkChip: { borderWidth: 1.5, borderColor: colors.teal, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
    linkText: { color: colors.white, fontSize: fs(12), fontWeight: '600' },
    findButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 46,
      borderRadius: 23,
      backgroundColor: colors.coral,
      marginTop: 22,
    },
    findText: { color: colors.white, fontSize: fs(14), fontWeight: 'bold', letterSpacing: 0.5 },
  });
