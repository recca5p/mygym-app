import React, { useState, useEffect } from 'react';
import { Modal, View, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSQLiteContext } from 'expo-sqlite';
import type { Exercise } from '@/src/hooks/useExercises';

interface Props {
  visible: boolean;
  exercise: Exercise | null;
  onClose: () => void;
}

interface HistorySession {
  workout_id: number;
  workout_name: string;
  start_time: string;
  sets: {
    set_number: number;
    weight_kg: number | null;
    reps: number | null;
    set_type: string;
  }[];
}

interface HistoryRow {
  workout_id: number;
  workout_name: string;
  start_time: string;
  set_number: number;
  weight_kg: number | null;
  reps: number | null;
  set_type: string;
}

export function ExerciseHistoryModal({ visible, exercise, onClose }: Props) {
  const isDark = useColorScheme() === 'dark';
  const db = useSQLiteContext();
  const [history, setHistory] = useState<HistorySession[]>([]);
  const [loading, setLoading] = useState(true);

  const bg = isDark ? '#1C1C1E' : '#FFFFFF';
  const cardBg = isDark ? '#2C2C2E' : '#F2F2F7';

  useEffect(() => {
    if (!visible || !exercise) return;

    const loadHistory = async () => {
      setLoading(true);
      try {
        const rows = await db.getAllAsync<HistoryRow>(
          `SELECT
             w.id as workout_id, w.name as workout_name, w.start_time,
             ws.set_number, ws.weight_kg, ws.reps, ws.set_type
           FROM workout w
           JOIN workout_exercise we ON we.workout_id = w.id
           JOIN workout_set ws ON ws.workout_exercise_id = we.id
           WHERE we.exercise_id = ? AND w.status = 'completed' AND ws.is_completed = 1
           ORDER BY w.start_time DESC, ws.set_number ASC;`,
          [exercise.id]
        );

        // Group by workout
        const sessionsMap = new Map<number, HistorySession>();
        for (const r of rows) {
          if (!sessionsMap.has(r.workout_id)) {
            sessionsMap.set(r.workout_id, {
              workout_id: r.workout_id,
              workout_name: r.workout_name,
              start_time: r.start_time,
              sets: []
            });
          }
          sessionsMap.get(r.workout_id)?.sets.push({
            set_number: r.set_number,
            weight_kg: r.weight_kg,
            reps: r.reps,
            set_type: r.set_type
          });
        }

        setHistory(Array.from(sessionsMap.values()));
      } catch (err) {
        console.error('Failed to load exercise history', err);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [visible, exercise, db]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr.replace(' ', 'T'));
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderSession = ({ item }: { item: HistorySession }) => (
    <View style={[styles.sessionCard, { backgroundColor: cardBg }]}>
      <View style={styles.sessionHeader}>
        <ThemedText style={{ fontWeight: '600', fontSize: 16 }}>{formatDate(item.start_time)}</ThemedText>
        <ThemedText style={{ color: '#8E8E93', fontSize: 13 }}>{item.workout_name}</ThemedText>
      </View>

      <View style={styles.sessionBody}>
        {item.sets.map((s, idx) => {
           let typePrefix = '';
           if (s.set_type === 'warmup') typePrefix = 'W';
           if (s.set_type === 'drop') typePrefix = 'D';
           if (s.set_type === 'failure') typePrefix = 'F';

           return (
             <View key={idx} style={styles.setRow}>
               <ThemedText style={{ width: 30, color: '#8E8E93', fontWeight: 'bold' }}>
                 {typePrefix || s.set_number}
               </ThemedText>
               <ThemedText style={{ flex: 1 }}>{s.weight_kg ?? '-'} kg</ThemedText>
               <ThemedText style={{ flex: 1 }}>{s.reps ?? '-'} reps</ThemedText>
             </View>
           );
        })}
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: bg }]}>
        <View style={styles.header}>
          <ThemedText type="defaultSemiBold" style={{ fontSize: 17 }}>History</ThemedText>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
            <Ionicons name="close-circle" size={28} color="#8E8E93" />
          </Pressable>
        </View>

        <View style={styles.titleArea}>
          <ThemedText type="title" style={{ fontSize: 22 }}>{exercise?.name}</ThemedText>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : history.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="time-outline" size={48} color="#8E8E93" style={{ marginBottom: 16 }} />
            <ThemedText style={{ color: '#8E8E93', fontSize: 16 }}>No past records found.</ThemedText>
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={item => item.workout_id.toString()}
            renderItem={renderSession}
            contentContainerStyle={styles.list}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16, paddingVertical: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: 'rgba(142,142,147,0.15)',
  },
  closeBtn: { position: 'absolute', right: 16 },
  titleArea: { padding: 20 },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sessionCard: { borderRadius: 16, padding: 16, marginBottom: 16 },
  sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sessionBody: {},
  setRow: { flexDirection: 'row', paddingVertical: 4 },
});
