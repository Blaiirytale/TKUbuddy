import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      {/* animation: 'fade' makes screens fade into each other typee shift */}
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
    </>
  );
}