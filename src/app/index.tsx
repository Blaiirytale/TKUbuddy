import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomBar from '../components/BottomBar';
import GraduationProgress from '../components/GraduationProgress';
import { Colors } from '../constants/colors';

export default function HomeScreen() {
  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.greeting}>Good Morning!</Text>
          <Text style={styles.name}>Pramesti</Text>

          <GraduationProgress
            done={116}
            total={128}
            onPress={() => Alert.alert('Course history', 'Coming soon!')}
          />

          <Text style={styles.placeholder}>
            Quick Access and GE cards coming next...
          </Text>
        </ScrollView>
      </SafeAreaView>

      <BottomBar onPlusPress={() => Alert.alert('AiBud', 'Chat coming soon!')} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safe: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 60,
  },
  greeting: {
    fontSize: 22,
    color: Colors.white,
  },
  name: {
    fontSize: 34,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 24,
  },
  placeholder: {
    color: Colors.muted,
    fontSize: 14,
  },
});