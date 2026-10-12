import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ProfileProvider } from '../context/ProfileContext';
import { ThemeProvider } from '../context/ThemeContext';
import { PlannerProvider } from '../context/PlannerContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ProfileProvider>
        <StatusBar style="light" />
        <PlannerProvider>
          <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
        </PlannerProvider>
      </ProfileProvider>
    </ThemeProvider>
  );
}
