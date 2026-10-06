import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { Colors } from '../constants/colors';
import { useProfile } from '../context/ProfileContext';

type Props = {
  size?: number;
};

export default function Avatar({ size = 56 }: Props) {
  const { photoUri } = useProfile();

  if (photoUri) {
    return (
      <Image
        source={{ uri: photoUri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  return <Ionicons name="person-circle" size={size} color={Colors.white} />;
}
