import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      {/* white clock and battery icons at the top */}
      <StatusBar style="light" />
      {/* headerShown: false removes the grey title bar */}
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}