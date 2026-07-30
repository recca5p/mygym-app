const fs = require('fs');
const path = require('path');

const rapidApiKey = process.env.RAPIDAPI_KEY;

async function crawlDB() {
  if (!rapidApiKey) {
    throw new Error(
      'RAPIDAPI_KEY is required. Run: RAPIDAPI_KEY=your_key node scripts/fetchData.js',
    );
  }

  console.log('Fetching exercise data from ExerciseDB via RapidAPI...');

  let allExercises = [];
  let offset = 0;
  const limit = 10;
  let keepGoing = true;

  while (keepGoing) {
    const url = `https://exercisedb.p.rapidapi.com/exercises?limit=${limit}&offset=${offset}`;
    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
      }
    };

    try {
      console.log(`Fetching offset ${offset}...`);
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        keepGoing = false;
        break;
      }

      allExercises = allExercises.concat(data);
      console.log(`Got ${data.length} items. Total so far: ${allExercises.length}`);

      if (data.length < limit) {
        keepGoing = false; // reached the end
      } else {
        offset += limit;
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (error) {
      throw new Error(`Crawling failed at offset ${offset}`, { cause: error });
    }
  }

  console.log(`✅ Successfully fetched ${allExercises.length} exercises in total!`);

  const outPath = path.join(process.cwd(), 'src/database/exercises_raw_v2.json');
  fs.writeFileSync(outPath, JSON.stringify(allExercises, null, 2), 'utf-8');

  console.log(`✅ Saved data to ${outPath}`);
}

crawlDB().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
