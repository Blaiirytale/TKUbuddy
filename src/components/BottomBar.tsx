import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';

type Props = {
  onPlusPress?: () => void; // what happens when + is tapped
};

export default function BottomBar({ onPlusPress }: Props) {
  // insets = space for the iPhone home bar at the bottom
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + 8 }]}>
      <Pressable style={styles.icon}>
        <Ionicons name="calendar-outline" size={28} color={Colors.white} />
      </Pressable>
      <Pressable style={styles.icon}>
        <Ionicons name="search-outline" size={28} color={Colors.white} />
      </Pressable>

      {/* empty space in the middle, where the + button sits */}
      <View style={styles.icon} />

      <Pressable style={styles.icon}>
        <Ionicons name="link-outline" size={28} color={Colors.white} />
      </Pressable>
      <Pressable style={styles.icon}>
        <Ionicons name="settings-outline" size={28} color={Colors.white} />
      </Pressable>

      {/* the big teal + button, floating above the bar */}
      <Pressable style={styles.plus} onPress={onPlusPress}>
        <Ionicons name="add" size={46} color={Colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',          // icons side by side
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
    position: 'absolute',          // lets it float over the bar
    top: -34,
    alignSelf: 'center',
    width: 76,
    height: 76,
    borderRadius: 38,              // half the width = a circle
    backgroundColor: Colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',           // shadow on iPhone
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,                  // shadow on Android
  },
});