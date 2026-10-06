import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ProfileProvider } from '../context/ProfileContext';

export default function RootLayout() {
  return (
    <ProfileProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
    </ProfileProvider>
  );
}