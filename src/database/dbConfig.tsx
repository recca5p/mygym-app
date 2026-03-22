import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import { createTablesQuery } from './schema';
import { seedDatabase } from './seed';

export async function initializeDatabase(db: SQLiteDatabase) {
  try {
    console.log('Initializing database tables...');
    await db.execAsync(createTablesQuery);
    
    // Seed the database with our comprehensive exercise list
    await seedDatabase(db);
    
    console.log('Database initialized and ready!');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}
