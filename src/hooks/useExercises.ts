import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';

export interface Exercise {
  id: string;
  name: string;
  type: string;
  body_part: string;
  equipment: string;
  level: string;
  force: string;
  mechanic: string;
  primary_muscles: string;
  secondary_muscles: string;
  instructions: string;
  images: string;
  is_custom: boolean;
}

export function useExercises() {
  const db = useSQLiteContext();
  const [exercises, setExercises] = useState<Exercise[]>([]);

  const fetchExercises = useCallback(async (
    searchQuery = '',
    targetPart = '',
  ) => {
    try {
      let q = 'SELECT * FROM exercise WHERE 1=1';
      const params: Record<string, string> = {};

      if (searchQuery.trim() !== '') {
        q += ' AND name LIKE $search';
        params['$search'] = `%${searchQuery}%`;
      }
      if (targetPart.trim() !== '') {
        q += ' AND body_part = $part';
        params['$part'] = targetPart.toLowerCase();
      }

      q += ' ORDER BY name ASC LIMIT 100;';

      const result = await db.getAllAsync<Exercise>(q, params);
      setExercises(result);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  }, [db]);

  const addCustomExercise = async (name: string, type: string, bodyPart: string) => {
    try {
      const customId = 'custom_' + Date.now().toString();
      await db.runAsync(
        `INSERT INTO exercise (
          id, name, type, body_part, equipment, level, force, mechanic,
          primary_muscles, secondary_muscles, instructions, images, is_custom
        ) VALUES (?, ?, ?, ?, 'body only', 'beginner', '', '', '[]', '[]', '[]', '[]', 1)`,
        [customId, name, type, bodyPart]
      );
      await fetchExercises();
    } catch (error) {
      console.error('Error adding custom exercise:', error);
    }
  };

  const updateExercise = async (id: string, name: string, type: string, bodyPart: string) => {
    try {
      await db.runAsync(
        'UPDATE exercise SET name = ?, type = ?, body_part = ? WHERE id = ?',
        [name, type, bodyPart, id]
      );
      await fetchExercises();
    } catch (error) {
      console.error('Error updating exercise:', error);
    }
  };

  const getExerciseById = async (id: string): Promise<Exercise | null> => {
    try {
      return await db.getFirstAsync<Exercise>('SELECT * FROM exercise WHERE id = ?;', [id]);
    } catch (e) {
      return null;
    }
  };

  const deleteExercise = async (id: string) => {
    try {
      await db.runAsync('DELETE FROM exercise WHERE id = ?', [id]);
      await fetchExercises();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  return { exercises, fetchExercises, addCustomExercise, updateExercise, deleteExercise, getExerciseById };
}
