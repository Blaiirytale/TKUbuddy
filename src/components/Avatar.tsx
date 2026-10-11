import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { useProfile } from '../context/ProfileContext';
import { useTheme } from '../context/ThemeContext';

type Props = {
  size?: number;
};

export default function Avatar({ size = 56 }: Props) {
  const { photoUri } = useProfile();
  const { colors } = useTheme();

  if (photoUri) {
    return (
      <Image
        source={{ uri: photoUri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  return <Ionicons name="person-circle" size={size} color={colors.white} />;
}
