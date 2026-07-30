import React, { useEffect, useState } from 'react';
import { StyleSheet, View, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useWorkouts, type Workout } from '@/src/hooks/useWorkouts';
import { useGymContext } from '@/src/store/GymContext';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay();
}

function formatDuration(start: string, end: string | null) {
  if (!end) return '-';
  const s = new Date(start.replace(' ', 'T')).getTime();
  const e = new Date(end.replace(' ', 'T')).getTime();
  const diff = Math.floor((e - s) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function HistoryScreen() {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  const { getCompletedWorkouts, getWorkoutDates } = useWorkouts();
  const { activeGym } = useGymContext();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-indexed
  const [workoutDays, setWorkoutDays] = useState<Set<number>>(new Set());
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loadedQuery, setLoadedQuery] = useState<string | null>(null);

  const bg = isDark ? '#000' : '#F2F2F7';
  const cardBg = isDark ? '#1C1C1E' : '#FFF';
  const queryKey = `${activeGym?.id ?? 'all'}:${year}:${month}`;
  const loading = loadedQuery !== queryKey;

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      getWorkoutDates(activeGym?.id ?? null, year, month),
      getCompletedWorkouts(activeGym?.id ?? null, 0, 50),
    ]).then(([days, list]) => {
      if (!cancelled) {
        setWorkoutDays(days);
        setWorkouts(list);
        setLoadedQuery(queryKey);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    activeGym?.id,
    getCompletedWorkouts,
    getWorkoutDates,
    month,
    queryKey,
    year,
  ]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  // Calendar grid
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  const today = new Date();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;

  const renderCalendar = () => (
    <View style={[styles.calendarCard, { backgroundColor: cardBg }]}>
      {/* Month Nav */}
      <View style={styles.monthNav}>
        <Pressable onPress={prevMonth} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </Pressable>
        <ThemedText type="defaultSemiBold" style={{ fontSize: 17 }}>
          {MONTH_NAMES[month - 1]} {year}
        </ThemedText>
        <Pressable onPress={nextMonth} hitSlop={12}>
          <Ionicons name="chevron-forward" size={24} color="#007AFF" />
        </Pressable>
      </View>

      {/* Day Headers */}
      <View style={styles.dayHeaderRow}>
        {DAYS_OF_WEEK.map(d => (
          <ThemedText key={d} style={styles.dayHeader}>{d}</ThemedText>
        ))}
      </View>

      {/* Day Grid */}
      <View style={styles.calGrid}>
        {calendarCells.map((day, idx) => {
          const hasWorkout = day ? workoutDays.has(day) : false;
          const isToday = isCurrentMonth && day === today.getDate();

          return (
            <View key={idx} style={styles.calCell}>
              {day ? (
                <View style={[
                  styles.dayCircle,
                  hasWorkout && styles.dayCircleActive,
                  isToday && !hasWorkout && styles.dayCircleToday,
                ]}>
                  <ThemedText style={[
                    styles.dayText,
                    hasWorkout && { color: '#FFF' },
                    isToday && !hasWorkout && { color: '#007AFF', fontWeight: 'bold' },
                  ]}>
                    {day}
                  </ThemedText>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      {/* Summary */}
      <View style={styles.calSummary}>
        <ThemedText style={{ color: '#8E8E93', fontSize: 13 }}>
          {workoutDays.size} workouts in {MONTH_NAMES[month - 1]}
        </ThemedText>
      </View>
    </View>
  );

  const renderWorkoutItem = ({ item }: { item: Workout }) => (
    <Pressable
      style={[styles.workoutRow, { backgroundColor: cardBg }]}
      onPress={() =>
        router.push({
          pathname: '/workout/[id]',
          params: { id: item.id.toString() },
        })
      }
    >
      <View style={[styles.workoutIcon, { backgroundColor: 'rgba(52,199,89,0.15)' }]}>
        <Ionicons name="fitness" size={22} color="#34C759" />
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <ThemedText style={{ fontWeight: '600', fontSize: 16 }}>{item.name || 'Workout'}</ThemedText>
        <ThemedText style={{ color: '#8E8E93', fontSize: 13, marginTop: 2 }}>
          {new Date(item.start_time.replace(' ', 'T')).toLocaleDateString(undefined, {
            weekday: 'short', month: 'short', day: 'numeric'
          })}
          {' • '}
          {formatDuration(item.start_time, item.end_time)}
        </ThemedText>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <View style={styles.header}>
        <ThemedText type="title">History</ThemedText>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={item => item.id.toString()}
          renderItem={renderWorkoutItem}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderCalendar}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={48} color="#8E8E93" style={{ marginBottom: 12 }} />
              <ThemedText style={{ color: '#8E8E93', fontSize: 16 }}>No completed workouts yet.</ThemedText>
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  listContent: { paddingHorizontal: 20, paddingBottom: 80 },
  calendarCard: {
    borderRadius: 20, padding: 20, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  dayHeaderRow: { flexDirection: 'row', marginBottom: 8 },
  dayHeader: {
    flex: 1, textAlign: 'center', color: '#8E8E93', fontSize: 12, fontWeight: '600',
  },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: '14.28%', alignItems: 'center', marginBottom: 6 },
  dayCircle: {
    width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center',
  },
  dayCircleActive: { backgroundColor: '#34C759' },
  dayCircleToday: { borderWidth: 2, borderColor: '#007AFF' },
  dayText: { fontSize: 14 },
  calSummary: { marginTop: 12, alignItems: 'center' },
  workoutRow: {
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  workoutIcon: {
    width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center',
  },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
});
