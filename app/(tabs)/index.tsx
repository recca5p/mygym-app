import { StyleSheet, View, Pressable, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useGymContext } from '@/src/store/GymContext';
import { useWorkoutSession } from '@/src/store/WorkoutContext';
import { GymSwitcher } from '@/src/components/GymSwitcher';
import {
  useWorkouts,
  type Workout,
  type WorkoutSummary,
} from '@/src/hooks/useWorkouts';

function formatDuration(workout: Workout) {
  if (!workout.end_time) {
    return 'In progress';
  }

  const start = new Date(workout.start_time.replace(' ', 'T')).getTime();
  const end = new Date(workout.end_time.replace(' ', 'T')).getTime();
  const minutes = Math.max(0, Math.floor((end - start) / 60_000));
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours > 0 ? `${hours}h ${remainder}m` : `${minutes}m`;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { activeGym } = useGymContext();
  const { startNewWorkout, activeWorkout } = useWorkoutSession();
  const { getWorkoutSummary } = useWorkouts();
  const [switcherVisible, setSwitcherVisible] = useState(false);
  const [summary, setSummary] = useState<WorkoutSummary | null>(null);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    let cancelled = false;

    void getWorkoutSummary(activeGym?.id ?? null).then((result) => {
      if (!cancelled) {
        setSummary(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [activeGym?.id, activeWorkout?.id, getWorkoutSummary]);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  
  const themeStyles = {
    cardBackground: isDark ? '#1C1C1E' : '#FFFFFF',
    textSecondary: isDark ? '#8E8E93' : '#6B7280',
    accentColor: '#007AFF',
    successColor: '#34C759',
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F2F2F7' }]}>
      {/* Header Section */}
      <View style={styles.header}>
        <View>
          <ThemedText type="subtitle" style={{ color: themeStyles.textSecondary }}>{today}</ThemedText>
          <Pressable onPress={() => setSwitcherVisible(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <ThemedText type="title">{activeGym?.name || 'MyGym'}</ThemedText>
            <Ionicons name="chevron-down" size={20} color={themeStyles.textSecondary} style={{ marginTop: 4 }} />
          </Pressable>
        </View>
        <Pressable style={styles.profileButton} onPress={() => setSwitcherVisible(true)}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: themeStyles.cardBackground, justifyContent: 'center', alignItems: 'center' }}>
            <ThemedText style={{ fontSize: 24 }}>{activeGym?.icon || '🏋️'}</ThemedText>
          </View>
        </Pressable>
      </View>

      {/* Workout Summary */}
      <View style={styles.metricsContainer}>
        <View style={[styles.metricCard, { backgroundColor: themeStyles.cardBackground }]}>
          <View style={styles.metricHeader}>
            <Ionicons name="calendar" size={20} color="#FF9500" />
            <ThemedText type="defaultSemiBold">This week</ThemedText>
          </View>
          <ThemedText type="title" style={styles.metricValue}>
            {summary?.workoutsThisWeek ?? '—'}
          </ThemedText>
          <ThemedText style={{ color: themeStyles.textSecondary, fontSize: 13 }}>
            Completed workouts
          </ThemedText>
        </View>

        <View style={[styles.metricCard, { backgroundColor: themeStyles.cardBackground }]}>
          <View style={styles.metricHeader}>
            <Ionicons name="barbell" size={20} color={themeStyles.accentColor} />
            <ThemedText type="defaultSemiBold">All time</ThemedText>
          </View>
          <ThemedText type="title" style={styles.metricValue}>
            {summary?.totalWorkouts ?? '—'}
          </ThemedText>
          <ThemedText style={{ color: themeStyles.textSecondary, fontSize: 13 }}>
            Total workouts
          </ThemedText>
        </View>
      </View>

      {/* Quick Action */}
      <Pressable
        style={styles.primaryActionBtn}
        onPress={async () => {
          if (activeWorkout) {
            router.push('/workout/active');
          } else {
            const success = await startNewWorkout();
            if (success) router.push('/workout/active');
          }
        }}
      >
        <Ionicons name={activeWorkout ? "play" : "add-circle"} size={24} color="#FFFFFF" />
        <ThemedText style={styles.primaryActionText}>
          {activeWorkout ? 'Resume Workout' : 'Start Empty Workout'}
        </ThemedText>
      </Pressable>

      {/* Recent Activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle">Recent Activity</ThemedText>
          <Pressable onPress={() => router.push('/history')}>
            <ThemedText style={{ color: themeStyles.accentColor, fontWeight: '600' }}>
              See All
            </ThemedText>
          </Pressable>
        </View>

        {summary?.recentWorkouts.length ? (
          summary.recentWorkouts.map((workout) => (
            <Pressable
              key={workout.id}
              style={[styles.activityCard, { backgroundColor: themeStyles.cardBackground }]}
              onPress={() =>
                router.push({
                  pathname: '/workout/[id]',
                  params: { id: workout.id.toString() },
                })
              }
            >
              <View style={[styles.activityIcon, { backgroundColor: 'rgba(52, 199, 89, 0.15)' }]}>
                <Ionicons name="fitness" size={24} color={themeStyles.successColor} />
              </View>
              <View style={styles.activityDetails}>
                <ThemedText type="defaultSemiBold">
                  {workout.name || 'Workout'}
                </ThemedText>
                <ThemedText
                  style={{
                    color: themeStyles.textSecondary,
                    fontSize: 14,
                    marginTop: 2,
                  }}
                >
                  {new Date(workout.start_time.replace(' ', 'T')).toLocaleDateString(
                    undefined,
                    { month: 'short', day: 'numeric' },
                  )}
                  {' • '}
                  {formatDuration(workout)}
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={themeStyles.textSecondary} />
            </Pressable>
          ))
        ) : (
          <View style={[styles.emptyActivity, { backgroundColor: themeStyles.cardBackground }]}>
            <Ionicons name="time-outline" size={32} color={themeStyles.textSecondary} />
            <ThemedText style={{ color: themeStyles.textSecondary }}>
              Complete a workout to see it here.
            </ThemedText>
          </View>
        )}
      </View>

      <GymSwitcher 
        visible={switcherVisible} 
        onClose={() => setSwitcherVisible(false)} 
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 80, // Giving extra room for iOS notch
    paddingBottom: 24,
  },
  profileButton: {
    padding: 4,
  },
  metricsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 32,
  },
  metricCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  metricValue: {
    fontSize: 32,
    lineHeight: 36,
    marginBottom: 4,
  },
  primaryActionBtn: {
    backgroundColor: '#007AFF',
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
    marginBottom: 40,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  activityIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  activityDetails: {
    flex: 1,
  },
  emptyActivity: {
    alignItems: 'center',
    borderRadius: 16,
    gap: 10,
    padding: 24,
  },
});
