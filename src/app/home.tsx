import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Avatar from '../components/Avatar';
import BottomBar from '../components/BottomBar';
import GeneralKnowledge from '../components/GeneralKnowledge';
import GraduationProgress from '../components/GraduationProgress';
import QuickAccess from '../components/QuickAccess';
import { Colors } from '../constants/colors';
import { useProfile } from '../context/ProfileContext';
import { fetchGECategories, GECategory } from '../data/geData';

// TEMPORARY test data. The backend teammate will replace these with database data later.
const STUDENT_ID = '411000001';
const CREDITS_DONE = 116;

export default function HomeScreen() {
  const router = useRouter();
  const { displayName } = useProfile();
  const [geCategories, setGeCategories] = useState<GECategory[]>([]);

  useEffect(() => {
    fetchGECategories(STUDENT_ID).then(setGeCategories);
  }, []);

  // decide where each Quick Access button goes
  function handleQuickAccess(id: string) {
    if (id === 'suggestions') {
      router.push('/suggestions');
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
            onPress={() => Alert.alert('Course history', 'Coming soon!')}
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
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
  greeting: { fontSize: 20, color: Colors.white },
  name: { fontSize: 32, fontWeight: 'bold', color: Colors.white },
});
