import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useWorkouts, type Workout } from '@/src/hooks/useWorkouts';

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

const TYPE_LABELS: Record<string, string> = {
  normal: '', warmup: 'W', drop: 'D', failure: 'F'
};

export default function WorkoutDetailScreen() {
  const isDark = useColorScheme() === 'dark';
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getFullWorkout, deleteWorkout } = useWorkouts();
  const db = useSQLiteContext();

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);

  const bg = isDark ? '#000' : '#F2F2F7';
  const cardBg = isDark ? '#1C1C1E' : '#FFF';

  useEffect(() => {
    const load = async () => {
      if (id) {
        const w = await getFullWorkout(parseInt(id, 10));
        setWorkout(w);
      }
      setLoading(false);
    };
    load();
  }, [id, getFullWorkout]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!workout) {
    return (
      <View style={[styles.centered, { backgroundColor: bg }]}>
        <ThemedText>Workout not found.</ThemedText>
      </View>
    );
  }

  // Calculate total volume
  let totalVolume = 0;
  let totalSets = 0;
  workout.exercises?.forEach(we => {
    we.sets?.forEach(s => {
      if (s.is_completed && s.weight_kg && s.reps) {
        totalVolume += s.weight_kg * s.reps;
        totalSets++;
      }
    });
  });

  const handleDelete = () => {
    Alert.alert(
      'Delete Workout',
      'Are you sure you want to completely delete this workout history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
             await deleteWorkout(workout.id);
             router.back();
          }
        }
      ]
    );
  };

  const handleRename = () => {
    Alert.prompt(
      'Rename Workout',
      'Enter a new name for this workout session.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async (newName?: string) => {
            if (newName && newName.trim().length > 0) {
              await db.runAsync('UPDATE workout SET name = ? WHERE id = ?', [newName.trim(), workout.id]);
              setWorkout({ ...workout, name: newName.trim() });
            }
          }
        }
      ],
      'plain-text',
      workout.name || ''
    );
  };

  const dateStr = new Date(workout.start_time.replace(' ', 'T')).toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ width: 40 }}>
          <Ionicons name="chevron-back" size={28} color="#007AFF" />
        </Pressable>
        <ThemedText type="defaultSemiBold" style={{ fontSize: 17, flex: 1, textAlign: 'center' }}>
          Workout Detail
        </ThemedText>
        <View style={{ flexDirection: 'row', width: 40, justifyContent: 'flex-end', gap: 12 }}>
           <Pressable onPress={handleDelete} hitSlop={12}>
             <Ionicons name="trash-outline" size={22} color="#FF3B30" />
           </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: cardBg }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
            <ThemedText type="title" style={{ fontSize: 22, flex: 1, marginRight: 8 }}>
              {workout.name || 'Workout'}
            </ThemedText>
            <Pressable onPress={handleRename} hitSlop={12}>
               <Ionicons name="pencil" size={20} color="#007AFF" />
            </Pressable>
          </View>
          <ThemedText style={{ color: '#8E8E93', fontSize: 14 }}>{dateStr}</ThemedText>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={18} color="#007AFF" />
              <ThemedText style={styles.statValue}>{formatDuration(workout.start_time, workout.end_time)}</ThemedText>
              <ThemedText style={styles.statLabel}>Duration</ThemedText>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="barbell-outline" size={18} color="#FF9500" />
              <ThemedText style={styles.statValue}>{totalSets}</ThemedText>
              <ThemedText style={styles.statLabel}>Sets</ThemedText>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="trending-up-outline" size={18} color="#34C759" />
              <ThemedText style={styles.statValue}>{(totalVolume / 1000).toFixed(1)}k</ThemedText>
              <ThemedText style={styles.statLabel}>Volume (kg)</ThemedText>
            </View>
          </View>
        </View>

        {/* Exercises */}
        {workout.exercises?.map((we) => (
          <View key={we.id} style={[styles.exerciseCard, { backgroundColor: cardBg }]}>
            <ThemedText type="defaultSemiBold" style={{ fontSize: 16, color: '#007AFF', marginBottom: 12 }}>
              {we.exercise?.name || 'Unknown'}
            </ThemedText>

            {/* Set Table */}
            <View style={styles.setHeaderRow}>
              <ThemedText style={styles.setHeaderText}>Set</ThemedText>
              <ThemedText style={styles.setHeaderText}>kg</ThemedText>
              <ThemedText style={styles.setHeaderText}>Reps</ThemedText>
            </View>

            {we.sets?.map((s) => (
              <View key={s.id} style={styles.setDataRow}>
                <ThemedText style={styles.setData}>
                  {TYPE_LABELS[s.set_type] || s.set_number}
                </ThemedText>
                <ThemedText style={styles.setData}>{s.weight_kg ?? '-'}</ThemedText>
                <ThemedText style={styles.setData}>{s.reps ?? '-'}</ThemedText>
              </View>
            ))}
          </View>
        ))}

        {workout.notes && (
          <View style={[styles.exerciseCard, { backgroundColor: cardBg }]}>
            <ThemedText style={{ color: '#8E8E93', fontWeight: '600', marginBottom: 8 }}>Notes</ThemedText>
            <ThemedText>{workout.notes}</ThemedText>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(142,142,147,0.15)',
  },
  infoBanner: { borderRadius: 20, padding: 24, marginBottom: 24 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  statLabel: { color: '#8E8E93', fontSize: 12, marginTop: 2 },
  exerciseCard: { borderRadius: 16, padding: 16, marginBottom: 16 },
  setHeaderRow: { flexDirection: 'row', marginBottom: 8 },
  setHeaderText: { flex: 1, textAlign: 'center', color: '#8E8E93', fontSize: 13, fontWeight: '600' },
  setDataRow: { flexDirection: 'row', paddingVertical: 6 },
  setData: { flex: 1, textAlign: 'center', fontSize: 15 },
});
