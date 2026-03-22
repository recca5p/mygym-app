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
      name TEXT,
      start_time DATETIME NOT NULL,
      end_time DATETIME,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (gym_id) REFERENCES gym(id) ON DELETE SET NULL
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
      is_warmup BOOLEAN DEFAULT 0,
      is_completed BOOLEAN DEFAULT 0,
      FOREIGN KEY (workout_exercise_id) REFERENCES workout_exercise(id) ON DELETE CASCADE
  );
`;
