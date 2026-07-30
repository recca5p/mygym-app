import { useSQLiteContext, type SQLiteBindValue } from 'expo-sqlite';
import { useCallback } from 'react';
import type { Exercise } from './useExercises';

export interface WorkoutSet {
  id: number;
  workout_exercise_id: number;
  set_number: number;
  weight_kg: number | null;
  reps: number | null;
  duration_seconds: number | null;
  distance_km: number | null;
  set_type: 'normal' | 'warmup' | 'drop' | 'failure';
  is_completed: boolean;
}

export interface WorkoutExercise {
  id: number;
  workout_id: number;
  exercise_id: string;
  sort_order: number;
  notes: string | null;
  exercise?: Exercise; // Joined property
  sets?: WorkoutSet[]; // Joined property
}

export interface Workout {
  id: number;
  gym_id: number | null;
  template_id: number | null;
  name: string | null;
  status: 'in_progress' | 'completed' | 'template';
  start_time: string;
  end_time: string | null;
  notes: string | null;
  created_at: string;
  exercises?: WorkoutExercise[]; // Joined property
}

export interface WorkoutSummary {
  totalWorkouts: number;
  workoutsThisWeek: number;
  recentWorkouts: Workout[];
}

interface WorkoutExerciseRow extends WorkoutExercise {
  ex_name: string;
  ex_body_part: string;
  ex_images: string;
}

const SET_UPDATE_COLUMNS = [
  'set_number',
  'weight_kg',
  'reps',
  'duration_seconds',
  'distance_km',
  'set_type',
  'is_completed',
] as const satisfies readonly (keyof WorkoutSet)[];

function toLocalSqliteTimestamp(date: Date) {
  const parts = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ];
  return `${parts.join('-')} 00:00:00`;
}

export function useWorkouts() {
  const db = useSQLiteContext();

  const getFullWorkout = useCallback(async (workoutId: number): Promise<Workout | null> => {
    try {
      const workout = await db.getFirstAsync<Workout>('SELECT * FROM workout WHERE id = ?;', [workoutId]);
      if (!workout) return null;

      const exerciseRows = await db.getAllAsync<WorkoutExerciseRow>(
        `SELECT we.*, e.name as ex_name, e.body_part as ex_body_part, e.images as ex_images
         FROM workout_exercise we
         JOIN exercise e ON we.exercise_id = e.id
         WHERE we.workout_id = ?
         ORDER BY we.sort_order ASC;`,
        [workoutId]
      );

      const setsByExercise = new Map<number, WorkoutSet[]>();
      if (exerciseRows.length > 0) {
        const placeholders = exerciseRows.map(() => '?').join(', ');
        const sets = await db.getAllAsync<WorkoutSet>(
          `SELECT * FROM workout_set
           WHERE workout_exercise_id IN (${placeholders})
           ORDER BY workout_exercise_id ASC, set_number ASC;`,
          exerciseRows.map(({ id }) => id),
        );

        for (const set of sets) {
          const normalizedSet = {
            ...set,
            is_completed: Boolean(set.is_completed),
          };
          const current = setsByExercise.get(set.workout_exercise_id) ?? [];
          current.push(normalizedSet);
          setsByExercise.set(set.workout_exercise_id, current);
        }
      }

      const exercises = exerciseRows.map((row): WorkoutExercise => {
        const { ex_name, ex_body_part, ex_images, ...workoutExercise } = row;
        return {
          ...workoutExercise,
          exercise: {
            id: row.exercise_id,
            name: ex_name,
            body_part: ex_body_part,
            images: ex_images,
            type: '',
            equipment: '',
            level: '',
            force: '',
            mechanic: '',
            primary_muscles: '',
            secondary_muscles: '',
            instructions: '',
            is_custom: false,
          },
          sets: setsByExercise.get(row.id) ?? [],
        };
      });

      return { ...workout, exercises };
    } catch (error) {
      console.error('Error getting full workout:', error);
      return null;
    }
  }, [db]);

  const startEmptyWorkout = useCallback(async (gymId: number | null, name?: string): Promise<number | null> => {
    try {
      // Default name based on time of day
      const hour = new Date().getHours();
      const defaultName = hour < 12 ? 'Morning Workout' : hour < 17 ? 'Afternoon Workout' : 'Evening Workout';

      const result = await db.runAsync(
        `INSERT INTO workout (gym_id, name, status, start_time)
         VALUES (?, ?, 'in_progress', datetime('now', 'localtime'))`,
        [gymId, name || defaultName]
      );
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error starting workout:', error);
      return null;
    }
  }, [db]);

  const finishWorkout = useCallback(async (workoutId: number): Promise<void> => {
    try {
      await db.runAsync(
        `UPDATE workout SET status = 'completed', end_time = datetime('now', 'localtime') WHERE id = ?`,
        [workoutId]
      );
    } catch (error) {
      console.error('Error finishing workout:', error);
    }
  }, [db]);

  const deleteWorkout = useCallback(async (workoutId: number): Promise<void> => {
    try {
      await db.runAsync('DELETE FROM workout WHERE id = ?', [workoutId]);
    } catch (error) {
      console.error('Error deleting workout:', error);
    }
  }, [db]);

  const addExerciseToWorkout = useCallback(async (workoutId: number, exerciseId: string): Promise<number | null> => {
    try {
      let newWorkoutExerciseId: number | null = null;
      await db.withTransactionAsync(async () => {
        const orderRes = await db.getFirstAsync<{ max_order: number | null }>(
          'SELECT MAX(sort_order) as max_order FROM workout_exercise WHERE workout_id = ?',
          [workoutId]
        );
        const sortOrder = (orderRes?.max_order ?? 0) + 1;

        const result = await db.runAsync(
          'INSERT INTO workout_exercise (workout_id, exercise_id, sort_order) VALUES (?, ?, ?)',
          [workoutId, exerciseId, sortOrder]
        );
        newWorkoutExerciseId = result.lastInsertRowId;

        await db.runAsync(
          'INSERT INTO workout_set (workout_exercise_id, set_number, set_type) VALUES (?, 1, ?)',
          [newWorkoutExerciseId, 'normal']
        );
      });

      return newWorkoutExerciseId;
    } catch (error) {
      console.error('Error adding exercise to workout:', error);
      return null;
    }
  }, [db]);

  const addSet = useCallback(async (workoutExerciseId: number): Promise<void> => {
    try {
      const countRes = await db.getFirstAsync<{ cnt: number }>(
        'SELECT COUNT(*) as cnt FROM workout_set WHERE workout_exercise_id = ?',
        [workoutExerciseId]
      );
      const setNum = (countRes?.cnt ?? 0) + 1;

      const prevRes = await db.getFirstAsync<{
        weight_kg: number | null;
        reps: number | null;
        set_type: WorkoutSet['set_type'];
      }>(
        'SELECT weight_kg, reps, set_type FROM workout_set WHERE workout_exercise_id = ? AND set_number = ?',
        [workoutExerciseId, setNum - 1]
      );

      await db.runAsync(
        'INSERT INTO workout_set (workout_exercise_id, set_number, weight_kg, reps, set_type) VALUES (?, ?, ?, ?, ?)',
        [
          workoutExerciseId,
          setNum,
          prevRes?.weight_kg ?? null,
          prevRes?.reps ?? null,
          prevRes?.set_type ?? 'normal',
        ]
      );
    } catch (error) {
      console.error('Error adding set:', error);
    }
  }, [db]);

  const updateSet = useCallback(async (setId: number, updates: Partial<WorkoutSet>): Promise<void> => {
    try {
      const entries = SET_UPDATE_COLUMNS.flatMap((column) => {
        const value = updates[column];
        return value === undefined ? [] : [[column, value] as const];
      });
      if (entries.length === 0) return;

      const sets = entries.map(([column]) => `${column} = ?`).join(', ');
      const values: SQLiteBindValue[] = entries.map(([, value]) =>
        typeof value === 'boolean' ? (value ? 1 : 0) : value,
      );
      values.push(setId);

      await db.runAsync(`UPDATE workout_set SET ${sets} WHERE id = ?`, values);
    } catch (error) {
      console.error('Error updating set:', error);
    }
  }, [db]);

  const removeSet = useCallback(async (setId: number): Promise<void> => {
    try {
      await db.withTransactionAsync(async () => {
        const target = await db.getFirstAsync<{ workout_exercise_id: number }>(
          'SELECT workout_exercise_id FROM workout_set WHERE id = ?',
          [setId],
        );
        await db.runAsync('DELETE FROM workout_set WHERE id = ?', [setId]);

        if (target) {
          const remaining = await db.getAllAsync<{ id: number }>(
            'SELECT id FROM workout_set WHERE workout_exercise_id = ? ORDER BY set_number ASC',
            [target.workout_exercise_id],
          );
          for (const [index, set] of remaining.entries()) {
            await db.runAsync(
              'UPDATE workout_set SET set_number = ? WHERE id = ?',
              [index + 1, set.id],
            );
          }
        }
      });
    } catch (error) {
      console.error('Error removing set:', error);
    }
  }, [db]);

  const getTemplates = useCallback(async (gymId: number | null, search: string = ''): Promise<Workout[]> => {
    try {
      let query = "SELECT * FROM workout WHERE status = 'template'";
      const params: SQLiteBindValue[] = [];
      if (gymId) {
        query += ' AND gym_id = ?';
        params.push(gymId);
      }
      if (search.trim()) {
        query += ' AND name LIKE ?';
        params.push(`%${search.trim()}%`);
      }
      query += ' ORDER BY created_at DESC';
      return await db.getAllAsync<Workout>(query, params);
    } catch (error) {
      console.error('Error fetching templates:', error);
      return [];
    }
  }, [db]);

  const createTemplate = useCallback(async (
    gymId: number | null, name: string, exerciseIds: string[]
  ): Promise<number | null> => {
    try {
      let templateId: number | null = null;
      await db.withTransactionAsync(async () => {
        const result = await db.runAsync(
          `INSERT INTO workout (gym_id, name, status, start_time)
           VALUES (?, ?, 'template', datetime('now', 'localtime'))`,
          [gymId, name]
        );
        templateId = result.lastInsertRowId;

        for (const [index, exerciseId] of exerciseIds.entries()) {
          await db.runAsync(
            'INSERT INTO workout_exercise (workout_id, exercise_id, sort_order) VALUES (?, ?, ?)',
            [templateId, exerciseId, index + 1]
          );
        }
      });

      return templateId;
    } catch (error) {
      console.error('Error creating template:', error);
      return null;
    }
  }, [db]);

  const deleteTemplate = useCallback(async (templateId: number): Promise<void> => {
    try {
      await db.runAsync('DELETE FROM workout WHERE id = ? AND status = "template"', [templateId]);
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  }, [db]);

  const startWorkoutFromTemplate = useCallback(async (
    templateId: number, gymId: number | null
  ): Promise<number | null> => {
    try {
      const template = await getFullWorkout(templateId);
      if (!template) return null;

      let newWorkoutId: number | null = null;
      await db.withTransactionAsync(async () => {
        const result = await db.runAsync(
          `INSERT INTO workout (gym_id, template_id, name, status, start_time)
           VALUES (?, ?, ?, 'in_progress', datetime('now', 'localtime'))`,
          [gymId, templateId, template.name]
        );
        newWorkoutId = result.lastInsertRowId;

        for (const workoutExercise of template.exercises ?? []) {
          const workoutExerciseResult = await db.runAsync(
            'INSERT INTO workout_exercise (workout_id, exercise_id, sort_order) VALUES (?, ?, ?)',
            [newWorkoutId, workoutExercise.exercise_id, workoutExercise.sort_order]
          );
          await db.runAsync(
            'INSERT INTO workout_set (workout_exercise_id, set_number, set_type) VALUES (?, 1, ?)',
            [workoutExerciseResult.lastInsertRowId, 'normal']
          );
        }
      });

      return newWorkoutId;
    } catch (error) {
      console.error('Error starting workout from template:', error);
      return null;
    }
  }, [db, getFullWorkout]);

  const getCompletedWorkouts = useCallback(async (
    gymId: number | null, page: number = 0, limit: number = 20
  ): Promise<Workout[]> => {
    try {
      let query = "SELECT * FROM workout WHERE status = 'completed'";
      const params: SQLiteBindValue[] = [];
      if (gymId) {
        query += ' AND gym_id = ?';
        params.push(gymId);
      }
      query += ' ORDER BY start_time DESC LIMIT ? OFFSET ?';
      params.push(limit, page * limit);
      return await db.getAllAsync<Workout>(query, params);
    } catch (error) {
      console.error('Error fetching completed workouts:', error);
      return [];
    }
  }, [db]);

  const getWorkoutDates = useCallback(async (
    gymId: number | null, year: number, month: number
  ): Promise<Set<number>> => {
    try {
      const monthStr = String(month).padStart(2, '0');
      let query = `SELECT DISTINCT CAST(strftime('%d', start_time) AS INTEGER) as day
                   FROM workout WHERE status = 'completed'
                   AND strftime('%Y', start_time) = ? AND strftime('%m', start_time) = ?`;
      const params: SQLiteBindValue[] = [year.toString(), monthStr];
      if (gymId) {
        query += ' AND gym_id = ?';
        params.push(gymId);
      }
      const rows = await db.getAllAsync<{ day: number }>(query, params);
      return new Set(rows.map(r => r.day));
    } catch (error) {
      console.error('Error fetching workout dates:', error);
      return new Set();
    }
  }, [db]);

  const getWorkoutSummary = useCallback(
    async (gymId: number | null): Promise<WorkoutSummary> => {
      try {
        const startOfWeek = new Date();
        const daysSinceMonday = (startOfWeek.getDay() + 6) % 7;
        startOfWeek.setDate(startOfWeek.getDate() - daysSinceMonday);

        let gymFilter = '';
        const statsParams: SQLiteBindValue[] = [
          toLocalSqliteTimestamp(startOfWeek),
        ];
        const recentParams: SQLiteBindValue[] = [];

        if (gymId !== null) {
          gymFilter = ' AND gym_id = ?';
          statsParams.push(gymId);
          recentParams.push(gymId);
        }

        const [stats, recentWorkouts] = await Promise.all([
          db.getFirstAsync<{
            total_workouts: number;
            workouts_this_week: number;
          }>(
            `SELECT
               COUNT(*) AS total_workouts,
               COALESCE(SUM(CASE WHEN start_time >= ? THEN 1 ELSE 0 END), 0)
                 AS workouts_this_week
             FROM workout
             WHERE status = 'completed'${gymFilter};`,
            statsParams,
          ),
          db.getAllAsync<Workout>(
            `SELECT *
             FROM workout
             WHERE status = 'completed'${gymFilter}
             ORDER BY start_time DESC
             LIMIT 3;`,
            recentParams,
          ),
        ]);

        return {
          totalWorkouts: stats?.total_workouts ?? 0,
          workoutsThisWeek: stats?.workouts_this_week ?? 0,
          recentWorkouts,
        };
      } catch (error) {
        console.error('Error fetching workout summary:', error);
        return {
          totalWorkouts: 0,
          workoutsThisWeek: 0,
          recentWorkouts: [],
        };
      }
    },
    [db],
  );

  return {
    getFullWorkout,
    startEmptyWorkout,
    finishWorkout,
    deleteWorkout,
    addExerciseToWorkout,
    addSet,
    updateSet,
    removeSet,
    // Templates
    getTemplates,
    createTemplate,
    deleteTemplate,
    startWorkoutFromTemplate,
    // History
    getCompletedWorkouts,
    getWorkoutDates,
    getWorkoutSummary,
  };
}
