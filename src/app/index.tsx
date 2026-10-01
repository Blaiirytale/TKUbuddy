import { Ionicons } from '@expo/vector-icons';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomBar from '../components/BottomBar';
import GraduationProgress from '../components/GraduationProgress';
import QuickAccess from '../components/QuickAccess';
import { Colors } from '../constants/colors';

// TEMPORARY test data. The backend teammate pls replace later XO
const STUDENT_NAME = 'Pramesti';
const CREDITS_DONE = 116;

export default function HomeScreen() {
  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* HEADER: logo, greeting, profile picture */}
          <View style={styles.header}>
            <Image
              source={require('../../assets/app-images/tku_logo.png')}
              style={styles.logo}
            />
            <View style={styles.headerText}>
              <Text style={styles.greeting}>Good Morning!</Text>
              <Text style={styles.name}>{STUDENT_NAME}</Text>
            </View>
            {/* placeholder profile picture */}
            <Ionicons name="person-circle" size={56} color={Colors.white} />
          </View>

          <GraduationProgress
            done={CREDITS_DONE}
            total={128}
            onPress={() => Alert.alert('Course history', 'Coming soon!')}
          />

          <QuickAccess onPressItem={(id) => Alert.alert('Coming soon', `You tapped: ${id}`)} />

          <Text style={styles.placeholder}>General Knowledge cards coming next...</Text>
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
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  headerText: {
    flex: 1,
  },
  greeting: { fontSize: 20, color: Colors.white },
  name: { fontSize: 32, fontWeight: 'bold', color: Colors.white },
  placeholder: { color: Colors.muted, fontSize: 14 },
});