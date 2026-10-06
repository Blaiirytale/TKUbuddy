import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';

const TKU_COURSE_URL = 'https://www.ais.tku.edu.tw/elecos_english/';

type Props = {
  onPlusPress?: () => void;
};

export default function BottomBar({ onPlusPress }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  async function openTkuSite() {
    try {
      await Linking.openURL(TKU_COURSE_URL);
    } catch {
      Alert.alert('Could not open link', 'Please check your internet connection and try again.');
    }
  }

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + 8 }]}>
      <Pressable style={styles.icon}>
        <Ionicons name="calendar-outline" size={28} color={Colors.white} />
      </Pressable>
      <Pressable style={styles.icon}>
        <Ionicons name="search-outline" size={28} color={Colors.white} />
      </Pressable>

      <View style={styles.icon} />

      <Pressable style={styles.icon} onPress={openTkuSite}>
        <Ionicons name="link-outline" size={28} color={Colors.white} />
      </Pressable>
      {/* gear icon opens Settings */}
      <Pressable style={styles.icon} onPress={() => router.push('/settings')}>
        <Ionicons name="settings-outline" size={28} color={Colors.white} />
      </Pressable>

      <Pressable style={styles.plus} onPress={onPlusPress}>
        <Ionicons name="add" size={46} color={Colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingTop: 12,
  },
  icon: {
    width: 48,
    alignItems: 'center',
  },
  plus: {
    position: 'absolute',
    top: -34,
    alignSelf: 'center',
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
});