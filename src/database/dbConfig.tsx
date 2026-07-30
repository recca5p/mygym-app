import type { SQLiteDatabase } from 'expo-sqlite';
import { createIndexesQuery, createTablesQuery } from './schema';
import { seedDatabase } from './seed';

const DATABASE_VERSION = 2;

interface TableColumn {
  name: string;
}

async function getColumnNames(db: SQLiteDatabase, table: string) {
  const columns = await db.getAllAsync<TableColumn>(`PRAGMA table_info(${table})`);
  return new Set(columns.map(({ name }) => name));
}

async function migrateLegacySchema(db: SQLiteDatabase) {
  const workoutColumns = await getColumnNames(db, 'workout');
  const workoutSetColumns = await getColumnNames(db, 'workout_set');

  await db.withTransactionAsync(async () => {
    if (!workoutColumns.has('template_id')) {
      await db.execAsync(
        'ALTER TABLE workout ADD COLUMN template_id INTEGER REFERENCES workout(id) ON DELETE SET NULL;',
      );
    }

    if (!workoutColumns.has('status')) {
      await db.execAsync(
        "ALTER TABLE workout ADD COLUMN status TEXT NOT NULL DEFAULT 'completed';",
      );
    }

    if (!workoutSetColumns.has('set_type')) {
      await db.execAsync(
        "ALTER TABLE workout_set ADD COLUMN set_type TEXT NOT NULL DEFAULT 'normal';",
      );

      if (workoutSetColumns.has('is_warmup')) {
        await db.execAsync(
          "UPDATE workout_set SET set_type = 'warmup' WHERE is_warmup = 1;",
        );
      }
    }

    await db.execAsync(createIndexesQuery);
    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
  });
}

export async function initializeDatabase(db: SQLiteDatabase) {
  try {
    console.log('Initializing database tables...');
    await db.execAsync('PRAGMA journal_mode = WAL;');
    await db.execAsync('PRAGMA foreign_keys = ON;');
    await db.execAsync(createTablesQuery);
    await migrateLegacySchema(db);

    await seedDatabase(db);

    console.log('Database initialized and ready!');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}
