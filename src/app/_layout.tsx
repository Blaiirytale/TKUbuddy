import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ProfileProvider } from '../context/ProfileContext';
import { ThemeProvider } from '../context/ThemeContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ProfileProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
      </ProfileProvider>
    </ThemeProvider>
  );
}
