export const createTablesQuery = `
  CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT
  );

  CREATE TABLE IF NOT EXISTS gym (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '🏋️',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY DEFAULT 1,
      name TEXT,
      target_calories INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS exercise (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      body_part TEXT,
      equipment TEXT,
      level TEXT,
      force TEXT,
      mechanic TEXT,
      primary_muscles TEXT,
      secondary_muscles TEXT,
      instructions TEXT,
      images TEXT,
      is_custom BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS workout (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gym_id INTEGER,
      template_id INTEGER,
      name TEXT,
      status TEXT DEFAULT 'completed',
      start_time DATETIME NOT NULL,
      end_time DATETIME,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (gym_id) REFERENCES gym(id) ON DELETE SET NULL,
      FOREIGN KEY (template_id) REFERENCES workout(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS workout_exercise (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_id INTEGER NOT NULL,
      exercise_id TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      notes TEXT,
      FOREIGN KEY (workout_id) REFERENCES workout(id) ON DELETE CASCADE,
      FOREIGN KEY (exercise_id) REFERENCES exercise(id)
  );

  CREATE TABLE IF NOT EXISTS workout_set (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_exercise_id INTEGER NOT NULL,
      set_number INTEGER NOT NULL,
      weight_kg REAL,
      reps INTEGER,
      duration_seconds INTEGER,
      distance_km REAL,
      set_type TEXT DEFAULT 'normal',
      is_completed BOOLEAN DEFAULT 0,
      FOREIGN KEY (workout_exercise_id) REFERENCES workout_exercise(id) ON DELETE CASCADE
  );
`;

export const createIndexesQuery = `
  CREATE INDEX IF NOT EXISTS idx_exercise_name
    ON exercise(name);
  CREATE INDEX IF NOT EXISTS idx_workout_gym_status_start
    ON workout(gym_id, status, start_time DESC);
  CREATE INDEX IF NOT EXISTS idx_workout_exercise_workout
    ON workout_exercise(workout_id, sort_order);
  CREATE INDEX IF NOT EXISTS idx_workout_set_exercise
    ON workout_set(workout_exercise_id, set_number);
`;
