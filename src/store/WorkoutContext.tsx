import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { useWorkouts, type Workout } from '@/src/hooks/useWorkouts';
import { useGymContext } from '@/src/store/GymContext';

interface WorkoutContextType {
  activeWorkout: Workout | null;
  elapsedSeconds: number;
  startNewWorkout: (name?: string) => Promise<boolean>;
  finishActiveWorkout: () => Promise<void>;
  cancelActiveWorkout: () => Promise<void>;
  refreshActiveWorkout: (forcedId?: number) => Promise<void>;
  updateStartTime: (newElapsedSeconds: number) => Promise<void>;
  isRestoring: boolean;
}

const WorkoutContext = createContext<WorkoutContextType>({
  activeWorkout: null,
  elapsedSeconds: 0,
  startNewWorkout: async () => false,
  finishActiveWorkout: async () => {},
  cancelActiveWorkout: async () => {},
  refreshActiveWorkout: async (_forcedId?: number) => {},
  updateStartTime: async () => {},
  isRestoring: true,
});

export function useWorkoutSession() {
  return useContext(WorkoutContext);
}

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const { activeGym } = useGymContext();
  const { getFullWorkout, startEmptyWorkout, finishWorkout, deleteWorkout } = useWorkouts();

  const [activeWorkoutId, setActiveWorkoutId] = useState<number | null>(null);
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [timerTick, setTimerTick] = useState(Date.now);
  const [isRestoring, setIsRestoring] = useState(true);

  // Read active workout ID from DB on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await db.getFirstAsync<{ value: string }>(
          "SELECT value FROM app_settings WHERE key = 'active_workout_id'"
        );
        if (res && res.value) {
          const id = parseInt(res.value, 10);
          const workout = await getFullWorkout(id);
          if (workout && workout.status === 'in_progress') {
            setActiveWorkoutId(id);
            setActiveWorkout(workout);
          } else {
            // Cleanup stale setting
            await db.runAsync("DELETE FROM app_settings WHERE key = 'active_workout_id'");
          }
        }
      } catch (err) {
        console.error('Failed to restore active workout:', err);
      } finally {
        setIsRestoring(false);
      }
    };
    restoreSession();
  }, [db, getFullWorkout]);

  // Save active workout ID to DB when it changes
  useEffect(() => {
    const persistSession = async () => {
      if (isRestoring) return;
      try {
        if (activeWorkoutId) {
          await db.runAsync(
            "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('active_workout_id', ?)",
            [activeWorkoutId.toString()]
          );
        } else {
          await db.runAsync("DELETE FROM app_settings WHERE key = 'active_workout_id'");
        }
      } catch (err) {
        console.error('Failed to persist active workout id:', err);
      }
    };
    persistSession();
  }, [activeWorkoutId, db, isRestoring]);

  useEffect(() => {
    if (!activeWorkout?.start_time) {
      return;
    }

    const interval = setInterval(() => {
      setTimerTick(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [activeWorkout?.start_time]);

  const elapsedSeconds = activeWorkout?.start_time
    ? Math.max(
        0,
        Math.floor(
          (timerTick - new Date(activeWorkout.start_time.replace(' ', 'T')).getTime()) /
            1000,
        ),
      )
    : 0;

  const refreshActiveWorkout = useCallback(async (forcedId?: number) => {
    const idToUse = forcedId || activeWorkoutId;
    if (!idToUse) return;
    const workout = await getFullWorkout(idToUse);
    setActiveWorkout(workout);
  }, [activeWorkoutId, getFullWorkout]);

  const startNewWorkout = async (name?: string): Promise<boolean> => {
    if (activeWorkoutId) return false; // Already running one
    const id = await startEmptyWorkout(activeGym?.id ?? null, name);
    if (id) {
      setActiveWorkoutId(id);
      await refreshActiveWorkout(id); // Pass explicitly to avoid stale closure
      return true;
    }
    return false;
  };

  const finishActiveWorkout = async () => {
    if (!activeWorkoutId) return;
    await finishWorkout(activeWorkoutId);
    setActiveWorkoutId(null);
    setActiveWorkout(null);
  };

  const cancelActiveWorkout = async () => {
    if (!activeWorkoutId) return;
    await deleteWorkout(activeWorkoutId);
    setActiveWorkoutId(null);
    setActiveWorkout(null);
  };

  const updateStartTime = async (newElapsedSeconds: number) => {
    if (!activeWorkoutId) return;
    try {
      // Back-calculate start_time = now - newElapsedSeconds
      const newStart = new Date(Date.now() - newElapsedSeconds * 1000);
      const y = newStart.getFullYear();
      const mo = String(newStart.getMonth() + 1).padStart(2, '0');
      const d = String(newStart.getDate()).padStart(2, '0');
      const h = String(newStart.getHours()).padStart(2, '0');
      const mi = String(newStart.getMinutes()).padStart(2, '0');
      const s = String(newStart.getSeconds()).padStart(2, '0');
      const formatted = `${y}-${mo}-${d} ${h}:${mi}:${s}`;

      await db.runAsync('UPDATE workout SET start_time = ? WHERE id = ?', [formatted, activeWorkoutId]);
      await refreshActiveWorkout(activeWorkoutId);
    } catch (err) {
      console.error('Failed to update start time:', err);
    }
  };

  return (
    <WorkoutContext.Provider value={{
      activeWorkout,
      elapsedSeconds,
      startNewWorkout,
      finishActiveWorkout,
      cancelActiveWorkout,
      refreshActiveWorkout,
      updateStartTime,
      isRestoring,
    }}>
      {children}
    </WorkoutContext.Provider>
  );
}
