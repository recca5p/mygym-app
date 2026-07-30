import React, { useState } from 'react';
import { StyleSheet, View, Pressable, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useWorkoutSession } from '@/src/store/WorkoutContext';
import { useWorkouts } from '@/src/hooks/useWorkouts';
import { ExercisePickerModal } from '@/src/components/ExercisePickerModal';
import { ExerciseHistoryModal } from '@/src/components/ExerciseHistoryModal';
import { TimeEditModal } from '@/src/components/TimeEditModal';
import { SetRow } from '@/src/components/SetRow';
import type { Exercise } from '@/src/hooks/useExercises';

function formatTime(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function ActiveWorkoutScreen() {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  const { activeWorkout, elapsedSeconds, finishActiveWorkout, cancelActiveWorkout, refreshActiveWorkout, updateStartTime } = useWorkoutSession();
  const { addExerciseToWorkout, addSet, updateSet } = useWorkouts();

  const [pickerVisible, setPickerVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyExercise, setHistoryExercise] = useState<Exercise | null>(null);
  const [timeEditVisible, setTimeEditVisible] = useState(false);

  const bg = isDark ? '#000' : '#F2F2F7';
  const cardBg = isDark ? '#1C1C1E' : '#FFF';
  const textClr = isDark ? '#FFF' : '#000';

  if (!activeWorkout) {
    return (
      <View style={[styles.centered, { backgroundColor: bg }]}>
        <ThemedText>No active workout.</ThemedText>
        <Pressable style={styles.finishBtn} onPress={() => router.back()}>
          <ThemedText style={{ color: '#FFF' }}>Go Back</ThemedText>
        </Pressable>
      </View>
    );
  }

  const handleFinish = () => {
    Alert.alert(
      'Finish Workout',
      'Are you sure you want to finish this workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finish',
          style: 'default',
          onPress: async () => {
            await finishActiveWorkout();
            router.replace('/(tabs)/workout');
          }
        }
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Workout',
      'Are you sure you want to delete this session? This cannot be undone.',
      [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            await cancelActiveWorkout();
            router.replace('/(tabs)/workout');
          }
        }
      ]
    );
  };

  const handleAddExercise = async (exerciseId: string) => {
    if (!activeWorkout) return;
    setPickerVisible(false);
    await addExerciseToWorkout(activeWorkout.id, exerciseId);
    await refreshActiveWorkout(); // Reload state
  };

  const handleAddSet = async (workoutExerciseId: number) => {
    await addSet(workoutExerciseId);
    await refreshActiveWorkout();
  };

  const handleUpdateSet = async (setId: number, updates: any) => {
    await updateSet(setId, updates);
    await refreshActiveWorkout();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.iconBtn}>
          <Ionicons name="chevron-down" size={28} color={textClr} />
        </Pressable>

        <View style={styles.timerContainer}>
          <ThemedText style={{ color: '#8E8E93', fontSize: 13, fontWeight: '600', textTransform: 'uppercase' }}>
            {activeWorkout.name}
          </ThemedText>
          <Pressable onPress={() => setTimeEditVisible(true)}>
            <ThemedText style={styles.timerText}>{formatTime(elapsedSeconds)}</ThemedText>
          </Pressable>
        </View>

        <Pressable onPress={handleFinish} style={styles.finishBtn}>
          <ThemedText style={styles.finishBtnText}>Finish</ThemedText>
        </Pressable>
      </View>

      {/* Body */}
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40, paddingTop: 16 }}>
        {(!activeWorkout.exercises || activeWorkout.exercises.length === 0) ? (
          <View style={[styles.emptyState, { backgroundColor: cardBg }]}>
             <Ionicons name="barbell-outline" size={48} color="#8E8E93" style={{ marginBottom: 16 }} />
             <ThemedText style={{ fontSize: 18, fontWeight: '600' }}>Add Exercises</ThemedText>
             <ThemedText style={{ color: '#8E8E93', textAlign: 'center', marginTop: 8 }}>
               Start your workout by adding some exercises to your routine.
             </ThemedText>
          </View>
        ) : (
          activeWorkout.exercises.map((we, index) => (
            <View key={we.id} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                  <Pressable
                    style={{ flexDirection: 'row', alignItems: 'center' }}
                    onPress={() => {
                      if (we.exercise) {
                        setHistoryExercise(we.exercise);
                        setHistoryVisible(true);
                      }
                    }}
                  >
                    <ThemedText type="defaultSemiBold" style={{ fontSize: 18, color: '#007AFF' }}>
                      {we.exercise?.name || 'Unknown Exercise'}
                    </ThemedText>
                    <Ionicons name="time-outline" size={16} color="#007AFF" style={{ marginLeft: 6 }} />
                  </Pressable>

                  {we.exercise && (
                    <Pressable
                      style={{ marginLeft: 16 }}
                      onPress={() => router.push(`/exercise/${we.exercise!.id}` as any)}
                      hitSlop={8}
                    >
                      <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
                    </Pressable>
                  )}
                </View>
                <Ionicons name="ellipsis-horizontal" size={20} color="#8E8E93" />
              </View>

              {/* Set Table Headers */}
              <View style={styles.tableHeaderRow}>
                <ThemedText style={styles.thType}>Set</ThemedText>
                <ThemedText style={styles.thPrev}>Previous</ThemedText>
                <ThemedText style={styles.thInput}>kg</ThemedText>
                <ThemedText style={styles.thInput}>Reps</ThemedText>
                <View style={styles.thCheck} />
              </View>

              {/* Sets */}
              {we.sets?.map((s) => (
                 <SetRow
                   key={s.id}
                   set={s}
                   onUpdate={(updates) => handleUpdateSet(s.id, updates)}
                   onDelete={() => {}}
                 />
              ))}

              <Pressable style={styles.addSetBtn} onPress={() => handleAddSet(we.id)}>
                <Ionicons name="add" size={16} color="#8E8E93" />
                <ThemedText style={styles.addSetText}>Add Set</ThemedText>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomBar, { backgroundColor: bg }]}>
        <Pressable style={styles.cancelBtn} onPress={handleCancel}>
          <ThemedText style={styles.cancelBtnText}>Discard</ThemedText>
        </Pressable>

        <Pressable style={styles.addExerciseBtn} onPress={() => setPickerVisible(true)}>
          <Ionicons name="add" size={20} color="#FFF" />
          <ThemedText style={styles.addExerciseText}>Add Exercise</ThemedText>
        </Pressable>
      </View>

      <ExercisePickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={handleAddExercise}
      />

      <ExerciseHistoryModal
        visible={historyVisible}
        exercise={historyExercise}
        onClose={() => setHistoryVisible(false)}
      />

      <TimeEditModal
        visible={timeEditVisible}
        currentSeconds={elapsedSeconds}
        onSave={async (totalSec) => {
          await updateStartTime(totalSec);
          setTimeEditVisible(false);
        }}
        onClose={() => setTimeEditVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8,
    borderBottomWidth: 1, borderBottomColor: 'rgba(142,142,147,0.15)',
  },
  iconBtn: { width: 40, height: 40, justifyContent: 'center' },
  timerContainer: { alignItems: 'center' },
  timerText: { fontSize: 22, fontWeight: 'bold', fontVariant: ['tabular-nums'], marginTop: 2 },
  finishBtn: {
    backgroundColor: '#34C759', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16,
  },
  finishBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  content: { flex: 1, paddingHorizontal: 16 },
  emptyState: {
    borderRadius: 24, justifyContent: 'center', alignItems: 'center', padding: 32, marginTop: 40,
    borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(142,142,147,0.2)'
  },
  exerciseCard: { marginBottom: 32 },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  tableHeaderRow: {
    flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8,
  },
  thType: { width: 32, textAlign: 'center', color: '#8E8E93', fontSize: 13, fontWeight: '600' },
  thPrev: { flex: 1, textAlign: 'center', color: '#8E8E93', fontSize: 13, fontWeight: '600' },
  thInput: { flex: 1, textAlign: 'center', color: '#8E8E93', fontSize: 13, fontWeight: '600' },
  thCheck: { width: 32, marginLeft: 12 },
  addSetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, marginTop: 8,
  },
  addSetText: { color: '#8E8E93', fontWeight: '600', fontSize: 15, marginLeft: 6 },
  bottomBar: {
    flexDirection: 'row', padding: 16, gap: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(142,142,147,0.15)',
  },
  cancelBtn: {
    paddingVertical: 16, paddingHorizontal: 24, borderRadius: 16,
    backgroundColor: 'rgba(255,59,48,0.1)', justifyContent: 'center', alignItems: 'center'
  },
  cancelBtnText: { color: '#FF3B30', fontWeight: '600', fontSize: 16 },
  addExerciseBtn: {
    flex: 1, backgroundColor: '#007AFF', borderRadius: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  addExerciseText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});
