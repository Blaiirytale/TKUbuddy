import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Avatar from '../components/Avatar';
import BottomBar from '../components/BottomBar';
import GeneralKnowledge from '../components/GeneralKnowledge';
import GraduationProgress from '../components/GraduationProgress';
import QuickAccess from '../components/QuickAccess';
import { ThemeColors } from '../constants/colors';
import { useProfile } from '../context/ProfileContext';
import { FontScaler, useThemedStyles } from '../context/ThemeContext';
import { GECategory, fetchGECategories } from '../data/geData';

// TEMPORARY test data. The backend teammate will replace these with database data later.
const CREDITS_DONE = 116;

export default function HomeScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { displayName, student} = useProfile();
  const [geCategories, setGeCategories] = useState<GECategory[]>([]);

  useEffect(() => {
    if (!student?.student_id) return;

    fetchGECategories(student.student_id).then(setGeCategories);
  }, [student?.student_id]);

  // decide where each Quick Access button goes
  function handleQuickAccess(id: string) {
    if (id === 'suggestions') {
      router.push('/suggestions');
    } else if (id === 'planner') {
      router.push('/planner');
    } else {
      Alert.alert('Coming soon', `You tapped: ${id}`);
    }
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* HEADER */}
          <View style={styles.header}>
            <Image
              source={require('../../assets/app-images/tku_logo.png')}
              style={styles.logo}
            />
            <View style={styles.headerText}>
              <Text style={styles.greeting}>Good Morning!</Text>
              <Text style={styles.name} numberOfLines={1}>
                {displayName}
              </Text>
            </View>
            <Avatar size={56} />
          </View>

          <GraduationProgress
            done={CREDITS_DONE}
            total={128}
            onPress={() => router.push('/history')}
          />

          <QuickAccess onPressItem={handleQuickAccess} />

          <GeneralKnowledge
            categories={geCategories}
            onSeeAll={() => Alert.alert('See All', 'Coming soon!')}
            onFindCourse={(id) => Alert.alert('Find course', `Search courses in: ${id}`)}
          />
        </ScrollView>
      </SafeAreaView>

      <BottomBar onPlusPress={() => Alert.alert('AiBud', 'Chat coming soon!')} />
    </View>
  );
}

// styles are built from the current theme colors and font size
const makeStyles = (colors: ThemeColors, fs: FontScaler) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  content: { padding: 24, paddingBottom: 60 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  logo: {
    width: 76,
    height: 76,
    resizeMode: 'contain',
  },
  headerText: { flex: 1 },
  greeting: { fontSize: fs(20), color: colors.white },
  name: { fontSize: fs(32), fontWeight: 'bold', color: colors.white },
});
