import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { Image, ImageSourcePropType, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/colors';

type IconName = ComponentProps<typeof Ionicons>['name'];

type QuickItem = {
  id: string;
  label: string;
  icon?: IconName;               
  image?: ImageSourcePropType;   
};

// the four buttons; change labels or icons here plz
const ITEMS: QuickItem[] = [
  { id: 'search', label: 'Advance\nSearch', icon: 'search-outline' },
  { id: 'missing', label: 'Missing\nCredits', icon: 'alert-circle-outline' },
  { id: 'suggestions', label: 'Course\nSuggestions', icon: 'bulb-outline' },
  { id: 'planner', label: 'Planner', icon: 'calendar-outline' },
];

type Props = {
  onPressItem?: (id: string) => void; 
};

export default function QuickAccess({ onPressItem }: Props) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Quick Access</Text>

      <View style={styles.row}>
        {/* .map() makes one button for each item in the list */}
        {ITEMS.map((item) => (
          <Pressable
            key={item.id}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
            onPress={() => onPressItem?.(item.id)}
          >
            <View style={styles.square}>
              {item.image ? (
                <Image source={item.image} style={styles.image} />
              ) : (
                <Ionicons name={item.icon ?? 'help-outline'} size={32} color={Colors.white} />
              )}
            </View>
            <Text style={styles.label}>{item.label.toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  heading: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  item: {
    width: 78,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  square: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  label: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 6,
  },
});