import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ThemeColors } from '../constants/colors';
import { GECategory } from '../data/geData';
import { FontScaler, useTheme, useThemedStyles } from '../context/ThemeContext';

type Props = {
  category: GECategory;
  onFindCourse?: () => void;
};

export default function GECard({ category, onFindCourse }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  
  const [open, setOpen] = useState(true);
  const complete = category.creditsDone >= category.creditsRequired;

  return (
    <View style={styles.card}>
      {/* top row: icon circle, title, dropdown arrow */}
      <Pressable style={styles.top} onPress={() => setOpen(!open)}>
        <View style={styles.circle} />
        <Text style={styles.title} numberOfLines={2}>
          {category.title}
        </Text>
        <Ionicons name={open ? 'caret-down' : 'caret-forward'} size={14} color={colors.white} />
      </Pressable>

      {/* field list, in 2 columns */}
      {open && (
        <View style={styles.fields}>
          {category.fields.map((field) => (
            <View key={field.name} style={styles.field}>
              <View style={styles.statusIcon}>
                {field.status === 'done' && (
                  <Ionicons name="checkmark" size={14} color={colors.white} />
                )}
                {field.status === 'in_progress' && (
                  <Ionicons name="ellipse-outline" size={11} color={colors.white} />
                )}
              </View>
              <Text style={styles.fieldText}>{field.name}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.credits}>
        {category.creditsDone}/{category.creditsRequired} CREDITS ACQUIRED
      </Text>

      {/* finished categories show a badge instead of the button */}
      {complete ? (
        <View style={[styles.button, styles.completeBadge]}>
          <Text style={styles.buttonText}>COMPLETE ✓</Text>
        </View>
      ) : (
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          onPress={onFindCourse}
        >
          <Text style={styles.buttonText}>FIND COURSE</Text>
        </Pressable>
      )}
    </View>
  );
}

// styles are built from the current theme colors and font size
const makeStyles = (colors: ThemeColors, fs: FontScaler) => StyleSheet.create({
  card: {
    width: '48%', 
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.grey,
  },
  title: {
    flex: 1,
    color: colors.white,
    fontSize: fs(13),
    fontWeight: '600',
    textAlign: 'right',
  },
  fields: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 6,
    marginBottom: 8,
  },
  field: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 16,
    alignItems: 'center',
    marginRight: 2,
  },
  fieldText: {
    color: colors.white,
    fontSize: fs(12),
    flexShrink: 1, 
  },
  credits: {
    color: colors.white,
    fontSize: fs(9),
    fontWeight: 'bold',
    marginTop: 'auto', 
    marginBottom: 8,
  },
  button: {
    alignSelf: 'flex-end',
    backgroundColor: colors.coral,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  completeBadge: {
    backgroundColor: colors.teal,
  },
  pressed: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.white,
    fontSize: fs(9),
    fontWeight: 'bold',
  },
});
