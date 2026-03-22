import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

export interface Gym {
  id: number;
  name: string;
  icon: string;
  created_at: string;
}

interface GymContextType {
  activeGym: Gym | null;
  gyms: Gym[];
  isLoading: boolean;
  needsOnboarding: boolean;
  switchGym: (id: number) => Promise<void>;
  createGym: (name: string, icon?: string) => Promise<number | null>;
  updateGym: (id: number, name: string, icon: string) => Promise<void>;
  deleteGym: (id: number) => Promise<void>;
  refreshGyms: () => Promise<void>;
}

const GymContext = createContext<GymContextType>({
  activeGym: null,
  gyms: [],
  isLoading: true,
  needsOnboarding: false,
  switchGym: async () => {},
  createGym: async () => null,
  updateGym: async () => {},
  deleteGym: async () => {},
  refreshGyms: async () => {},
});

export function useGymContext() {
  return useContext(GymContext);
}

export function GymProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [activeGym, setActiveGym] = useState<Gym | null>(null);
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

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

  const getActiveGymId = useCallback(async (): Promise<number | null> => {
    try {
      const result = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM app_settings WHERE key = 'active_gym_id'"
      );
      return result ? parseInt(result.value, 10) : null;
    } catch {
      return null;
    }
  }, [db]);

  const setActiveGymId = useCallback(async (id: number) => {
    try {
      await db.runAsync(
        "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('active_gym_id', ?)",
        [id.toString()]
      );
    } catch (error) {
      console.error('Error setting active gym:', error);
    }
  }, [db]);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      const allGyms = await fetchGyms();

      if (allGyms.length === 0) {
        // No gyms exist — need onboarding
        setNeedsOnboarding(true);
        setIsLoading(false);
        return;
      }

      // Find last active gym
      const activeId = await getActiveGymId();
      const found = allGyms.find(g => g.id === activeId);

      if (found) {
        setActiveGym(found);
      } else {
        // Fallback to first gym
        setActiveGym(allGyms[0]);
        await setActiveGymId(allGyms[0].id);
      }

      setIsLoading(false);
    };

    init();
  }, [db]);

  const switchGym = async (id: number) => {
    const gym = gyms.find(g => g.id === id);
    if (gym) {
      setActiveGym(gym);
      await setActiveGymId(id);
    }
  };

  const createGym = async (name: string, icon: string = '🏋️'): Promise<number | null> => {
    try {
      const result = await db.runAsync('INSERT INTO gym (name, icon) VALUES (?, ?)', [name, icon]);
      const newId = result.lastInsertRowId;
      await setActiveGymId(newId);

      const allGyms = await fetchGyms();
      const newGym = allGyms.find(g => g.id === newId);
      if (newGym) setActiveGym(newGym);

      setNeedsOnboarding(false);
      return newId;
    } catch (error) {
      console.error('Error creating gym:', error);
      return null;
    }
  };

  const updateGym = async (id: number, name: string, icon: string) => {
    try {
      await db.runAsync('UPDATE gym SET name = ?, icon = ? WHERE id = ?', [name, icon, id]);
      const allGyms = await fetchGyms();
      if (activeGym?.id === id) {
        const updated = allGyms.find(g => g.id === id);
        if (updated) setActiveGym(updated);
      }
    } catch (error) {
      console.error('Error updating gym:', error);
    }
  };

  const deleteGym = async (id: number) => {
    try {
      await db.runAsync('DELETE FROM gym WHERE id = ?', [id]);
      const allGyms = await fetchGyms();

      if (activeGym?.id === id && allGyms.length > 0) {
        setActiveGym(allGyms[0]);
        await setActiveGymId(allGyms[0].id);
      } else if (allGyms.length === 0) {
        setActiveGym(null);
        setNeedsOnboarding(true);
      }
    } catch (error) {
      console.error('Error deleting gym:', error);
    }
  };

  const refreshGyms = async () => {
    await fetchGyms();
  };

  return (
    <GymContext.Provider value={{
      activeGym,
      gyms,
      isLoading,
      needsOnboarding,
      switchGym,
      createGym,
      updateGym,
      deleteGym,
      refreshGyms,
    }}>
      {children}
    </GymContext.Provider>
  );
}
