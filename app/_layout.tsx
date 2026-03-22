import { SQLiteProvider } from 'expo-sqlite';
import { View, Text, ActivityIndicator } from 'react-native';
import { GymProvider, useGymContext } from '@/src/store/GymContext';
import { initializeDatabase } from '@/src/database/dbConfig';
import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
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
  }, [isLoading, needsOnboarding, segments]);

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
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SQLiteProvider databaseName="mygyma.db" onInit={initializeDatabase}>
        <GymProvider>
          <RootNavigator />
          <StatusBar style="auto" />
        </GymProvider>
      </SQLiteProvider>
    </ThemeProvider>
  );
}
