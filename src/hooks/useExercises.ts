import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';
import type { ExerciseFormData } from '@/src/components/ExerciseModal';

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

const PAGE_SIZE = 30;

export function useExercises() {
  const db = useSQLiteContext();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const lastFilters = useRef({ search: '', muscle: '' });

  /** Build WHERE clause from filters */
  const buildWhere = (searchQuery: string, targetPart: string) => {
    let where = ' WHERE 1=1';
    const params: Record<string, string> = {};
    if (searchQuery.trim()) {
      where += ' AND name LIKE $search';
      params['$search'] = `%${searchQuery}%`;
    }
    if (targetPart.trim()) {
      where += ' AND body_part = $part';
      params['$part'] = targetPart.toLowerCase();
    }
    return { where, params };
  };

  /** Fetch first page (resets list) */
  const fetchExercises = useCallback(async (searchQuery = '', targetPart = '') => {
    try {
      setIsLoading(true);
      lastFilters.current = { search: searchQuery, muscle: targetPart };

      const { where, params } = buildWhere(searchQuery, targetPart);

      // Get total count
      const countResult = await db.getFirstAsync<{ cnt: number }>(
        `SELECT COUNT(*) as cnt FROM exercise${where}`, params
      );
      const total = countResult?.cnt ?? 0;
      setTotalCount(total);

      // Get first page
      const result = await db.getAllAsync<Exercise>(
        `SELECT * FROM exercise${where} ORDER BY name ASC LIMIT ${PAGE_SIZE};`, params
      );
      setExercises(result);
      setHasMore(result.length < total);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  /** Fetch next page (appends to list) */
  const fetchMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    try {
      setIsLoading(true);
      const { search, muscle } = lastFilters.current;
      const { where, params } = buildWhere(search, muscle);
      const offset = exercises.length;

      const result = await db.getAllAsync<Exercise>(
        `SELECT * FROM exercise${where} ORDER BY name ASC LIMIT ${PAGE_SIZE} OFFSET ${offset};`, params
      );

      if (result.length > 0) {
        setExercises(prev => [...prev, ...result]);
      }
      setHasMore(offset + result.length < totalCount);
    } catch (error) {
      console.error('Error fetching more exercises:', error);
    } finally {
      setIsLoading(false);
    }
  }, [db, exercises.length, hasMore, isLoading, totalCount]);

  /** Converts multiline text to JSON array string */
  const instructionsToJson = (text: string): string => {
    if (!text.trim()) return '[]';
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    return JSON.stringify(lines);
  };

  /** Converts JSON array string back to multiline text */
  const instructionsFromJson = (json: string): string => {
    try {
      const arr = JSON.parse(json);
      return Array.isArray(arr) ? arr.join('\n') : '';
    } catch {
      return '';
    }
  };

  const addCustomExercise = async (data: ExerciseFormData) => {
    try {
      const customId = 'custom_' + Date.now().toString();
      await db.runAsync(
        `INSERT INTO exercise (
          id, name, type, body_part, equipment, level, force, mechanic,
          primary_muscles, secondary_muscles, instructions, images, is_custom
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', 1)`,
        [
          customId,
          data.name,
          data.category,
          data.primaryMuscles[0] || '',
          data.equipment || 'body only',
          data.level || 'beginner',
          data.force || '',
          data.mechanic || '',
          JSON.stringify(data.primaryMuscles),
          JSON.stringify(data.secondaryMuscles),
          instructionsToJson(data.instructions),
        ]
      );
      await fetchExercises(lastFilters.current.search, lastFilters.current.muscle);
    } catch (error) {
      console.error('Error adding custom exercise:', error);
    }
  };

  const updateExercise = async (id: string, data: ExerciseFormData) => {
    try {
      await db.runAsync(
        `UPDATE exercise SET
          name = ?, type = ?, body_part = ?, equipment = ?,
          level = ?, force = ?, mechanic = ?,
          primary_muscles = ?, secondary_muscles = ?, instructions = ?
        WHERE id = ?`,
        [
          data.name,
          data.category,
          data.primaryMuscles[0] || '',
          data.equipment || 'body only',
          data.level || 'beginner',
          data.force || '',
          data.mechanic || '',
          JSON.stringify(data.primaryMuscles),
          JSON.stringify(data.secondaryMuscles),
          instructionsToJson(data.instructions),
          id,
        ]
      );
      await fetchExercises(lastFilters.current.search, lastFilters.current.muscle);
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
      await fetchExercises(lastFilters.current.search, lastFilters.current.muscle);
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  /** Build initial form data from an Exercise row */
  const toFormData = (ex: Exercise): ExerciseFormData => {
    let primaryArr: string[] = [];
    try { primaryArr = JSON.parse(ex.primary_muscles); } catch { /* empty */ }
    let secondaryArr: string[] = [];
    try { secondaryArr = JSON.parse(ex.secondary_muscles); } catch { /* empty */ }

    return {
      name: ex.name,
      category: ex.type,
      force: ex.force || '',
      level: ex.level || '',
      mechanic: ex.mechanic || '',
      equipment: ex.equipment || '',
      primaryMuscles: Array.isArray(primaryArr) ? primaryArr : [],
      secondaryMuscles: Array.isArray(secondaryArr) ? secondaryArr : [],
      instructions: instructionsFromJson(ex.instructions),
    };
  };

  return {
    exercises,
    totalCount,
    isLoading,
    hasMore,
    fetchExercises,
    fetchMore,
    addCustomExercise,
    updateExercise,
    deleteExercise,
    getExerciseById,
    toFormData,
  };
}
