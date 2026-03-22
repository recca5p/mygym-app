import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';

export interface Gym {
  id: number;
  name: string;
  icon: string;
  created_at: string;
}

export function useGyms() {
  const db = useSQLiteContext();
  const [gyms, setGyms] = useState<Gym[]>([]);

  const fetchGyms = useCallback(async () => {
    try {
      const result = await db.getAllAsync<Gym>('SELECT * FROM gym ORDER BY created_at ASC;');
      setGyms(result);
      return result;
    } catch (error) {
      console.error('Error fetching gyms:', error);
      return [];
    }
  }, [db]);

  const createGym = async (name: string, icon: string = '🏋️'): Promise<number | null> => {
    try {
      const result = await db.runAsync(
        'INSERT INTO gym (name, icon) VALUES (?, ?)',
        [name, icon]
      );
      const newId = result.lastInsertRowId;
      // Set as active
      await setActiveGymId(newId);
      await fetchGyms();
      return newId;
    } catch (error) {
      console.error('Error creating gym:', error);
      return null;
    }
  };

  const updateGym = async (id: number, name: string, icon: string) => {
    try {
      await db.runAsync('UPDATE gym SET name = ?, icon = ? WHERE id = ?', [name, icon, id]);
      await fetchGyms();
    } catch (error) {
      console.error('Error updating gym:', error);
    }
  };

  const deleteGym = async (id: number) => {
    try {
      await db.runAsync('DELETE FROM gym WHERE id = ?', [id]);
      await fetchGyms();
    } catch (error) {
      console.error('Error deleting gym:', error);
    }
  };

  const getActiveGymId = async (): Promise<number | null> => {
    try {
      const result = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM app_settings WHERE key = 'active_gym_id'"
      );
      return result ? parseInt(result.value, 10) : null;
    } catch {
      return null;
    }
  };

  const setActiveGymId = async (id: number) => {
    try {
      await db.runAsync(
        "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('active_gym_id', ?)",
        [id.toString()]
      );
    } catch (error) {
      console.error('Error setting active gym:', error);
    }
  };

  return {
    gyms,
    fetchGyms,
    createGym,
    updateGym,
    deleteGym,
    getActiveGymId,
    setActiveGymId,
  };
}
