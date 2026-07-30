import { SQLiteProvider } from 'expo-sqlite';
import { ActivityIndicator, View } from 'react-native';
import { GymProvider, useGymContext } from '@/src/store/GymContext';
import { WorkoutProvider } from '@/src/store/WorkoutContext';
import { initializeDatabase } from '@/src/database/dbConfig';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Extracted inner component to use GymContext hooks
function RootNavigator() {
  const { isLoading, needsOnboarding } = useGymContext();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inOnboarding = segments[0] === 'onboarding';

    if (needsOnboarding && !inOnboarding) {
      router.replace('/onboarding');
    } else if (!needsOnboarding && inOnboarding) {
      router.replace('/(tabs)');
    }
  }, [isLoading, needsOnboarding, router, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="exercise/[id]" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SQLiteProvider databaseName="mygyma.db" onInit={initializeDatabase}>
        <GymProvider>
          <WorkoutProvider>
            <RootNavigator />
            <StatusBar style="auto" />
          </WorkoutProvider>
        </GymProvider>
      </SQLiteProvider>
    </ThemeProvider>
  );
}
