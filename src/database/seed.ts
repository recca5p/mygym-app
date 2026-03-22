import * as SQLite from 'expo-sqlite';
import exercisesData from './exercises.json';

export async function seedDatabase(db: SQLite.SQLiteDatabase) {
  const result = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM exercise;`);
  
  if (result && result.count === 0) {
    console.log(`Seeding Deep ExerciseDB data (${exercisesData.length} items)...`);
    
    await db.withTransactionAsync(async () => {
      const stmt = await db.prepareAsync(
        `INSERT INTO exercise (
          id, name, type, body_part, equipment, level, force, mechanic, 
          primary_muscles, secondary_muscles, instructions, images, is_custom
        ) VALUES (
          $id, $name, $type, $body_part, $equipment, $level, $force, $mechanic,
          $primary_muscles, $secondary_muscles, $instructions, $images, 0
        )`
      );
      try {
        for (const ex of exercisesData as any[]) {
          await stmt.executeAsync({
            $id: ex.id || ex.name.replace(/\s+/g, '_').toLowerCase(),
            $name: ex.name,
            $type: ex.category || 'strength',
            $body_part: (ex.primaryMuscles && ex.primaryMuscles[0]) || 'Full Body',
            $equipment: ex.equipment || 'none',
            $level: ex.level || 'beginner',
            $force: ex.force || '',
            $mechanic: ex.mechanic || '',
            $primary_muscles: JSON.stringify(ex.primaryMuscles || []),
            $secondary_muscles: JSON.stringify(ex.secondaryMuscles || []),
            $instructions: JSON.stringify(ex.instructions || []),
            $images: JSON.stringify((ex.images || []).map((imgP: string) => 
               `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${imgP}`
            ))
          });
        }
      } finally {
        await stmt.finalizeAsync();
      }
    });
    console.log('Deep Seeding completed!');
  } else {
    console.log('Database already seeded!');
  }
}
