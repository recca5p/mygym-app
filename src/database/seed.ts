import type { SQLiteDatabase } from 'expo-sqlite';
import exercisesData from './exercises.json';
import exercisesV2Data from './exercises_v2.json';

interface ExerciseSeed {
  id?: string;
  name: string;
  category?: string;
  equipment?: string;
  level?: string;
  force?: string;
  mechanic?: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  instructions?: string[];
  images?: string[];
}

export async function seedDatabase(db: SQLiteDatabase) {
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM exercise;',
  );

  if (result && result.count === 0) {
    const dataToSeed = (
      exercisesV2Data.length > 0 ? exercisesV2Data : exercisesData
    ) as ExerciseSeed[];

    console.log(`Seeding ${dataToSeed.length} exercises...`);

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
        for (const ex of dataToSeed) {
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
    console.log('Seeding completed!');
  } else {
    console.log('Database already seeded!');
  }
}
