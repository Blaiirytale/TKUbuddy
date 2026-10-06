import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/colors';
import { GECategory } from '../data/geData';
import GECard from './GECard';

type Props = {
  categories: GECategory[];
  onSeeAll?: () => void;
  onFindCourse?: (categoryId: string) => void;
};

export default function GeneralKnowledge({ categories, onSeeAll, onFindCourse }: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>GENERAL KNOWLEDGE</Text>
        <Pressable onPress={onSeeAll}>
          <Text style={styles.seeAll}>See All</Text>
        </Pressable>
      </View>
      <View style={styles.divider} />

      {categories.length === 0 ? (
        <Text style={styles.loading}>Loading...</Text>
      ) : (
        <View style={styles.grid}>
          {categories.map((c) => (
            <GECard key={c.id} category={c} onFindCourse={() => onFindCourse?.(c.id)} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heading: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: 'bold',
  },
  seeAll: {
    color: Colors.gold,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  divider: {
    height: 1.5,
    backgroundColor: Colors.card,
    marginTop: 6,
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  loading: {
    color: Colors.muted,
  },
});