/**
 * Merges V1 (873 exercises) + V2 ExerciseDB (1324 exercises) into one enriched dataset.
 * - V2 exercises get V1 properties (force, mechanic, level, images) when matched by name.
 * - Unmatched V2 exercises get inferred properties.
 * - V1-only exercises (not in V2) are appended so nothing is lost.
 * - Output uses V1 structure: id, name, force, level, mechanic, equipment, primaryMuscles,
 *   secondaryMuscles, instructions, category, images
 */

const fs = require('fs');
const path = require('path');

const v1 = require('../src/database/exercises.json');
const v2 = require('../src/database/exercises_raw_v2.json');

// --- Normalization & lookup ---
function norm(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const v1Map = {};
for (const ex of v1) {
  v1Map[norm(ex.name)] = ex;
}

// --- Inference helpers ---
function inferForce(target, bodyPart) {
  const pull = ['lats', 'biceps', 'abs', 'hamstrings', 'rhomboids', 'traps', 'upper back', 'spine', 'forearms', 'abdominals'];
  const push = ['pectorals', 'triceps', 'delts', 'quads', 'glutes', 'shoulders', 'calves', 'chest'];
  const t = (target || '').toLowerCase();
  const b = (bodyPart || '').toLowerCase();
  if (pull.some(p => t.includes(p) || b.includes(p))) return 'pull';
  if (push.some(p => t.includes(p) || b.includes(p))) return 'push';
  return 'static';
}

function inferMechanic(equipment, target) {
  const compound = ['barbell', 'leverage machine', 'smith machine', 'sled machine', 'body weight'];
  const isolation = ['cable', 'band', 'roller'];
  const e = (equipment || '').toLowerCase();
  if (compound.some(c => e.includes(c))) return 'compound';
  if (isolation.some(i => e.includes(i))) return 'isolation';
  const compoundTargets = ['quads', 'glutes', 'lats', 'pectorals', 'hamstrings'];
  if (compoundTargets.some(t => (target || '').includes(t))) return 'compound';
  return 'isolation';
}

const targetToMuscle = {
  'abs': 'abdominals', 'adductors': 'adductors', 'biceps': 'biceps',
  'calves': 'calves', 'cardiovascular system': 'cardiovascular system',
  'delts': 'shoulders', 'forearms': 'forearms', 'glutes': 'glutes',
  'hamstrings': 'hamstrings', 'lats': 'lats', 'levator scapulae': 'neck',
  'pectorals': 'chest', 'quads': 'quadriceps', 'serratus anterior': 'chest',
  'spine': 'lower back', 'traps': 'traps', 'triceps': 'triceps',
  'upper back': 'middle back',
};

const bodyPartToMuscle = {
  'back': 'back', 'cardio': 'cardiovascular system', 'chest': 'chest',
  'lower arms': 'forearms', 'lower legs': 'calves', 'neck': 'neck',
  'shoulders': 'shoulders', 'upper arms': 'biceps', 'upper legs': 'quadriceps',
  'waist': 'abdominals',
};

function makeImagePath(name) {
  const slug = name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
  return [`${slug}/0.jpg`, `${slug}/1.jpg`];
}

function makeId(name) {
  return name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
}

// --- Step 1: Convert all V2 exercises, enriching with V1 where possible ---
const usedV1Keys = new Set();
const merged = [];

for (const ex of v2) {
  const key = norm(ex.name);
  const v1Match = v1Map[key];
  if (v1Match) usedV1Keys.add(key);

  merged.push({
    id: v1Match ? (v1Match.id || makeId(ex.name)) : makeId(ex.name),
    name: ex.name,
    force: v1Match?.force || inferForce(ex.target, ex.bodyPart),
    level: v1Match?.level || ex.difficulty || 'beginner',
    mechanic: v1Match?.mechanic || inferMechanic(ex.equipment, ex.target),
    equipment: ex.equipment || v1Match?.equipment || 'body only',
    primaryMuscles: (v1Match?.primaryMuscles?.length > 0)
      ? v1Match.primaryMuscles
      : [targetToMuscle[ex.target] || bodyPartToMuscle[ex.bodyPart] || ex.bodyPart],
    secondaryMuscles: ex.secondaryMuscles || v1Match?.secondaryMuscles || [],
    instructions: ex.instructions || v1Match?.instructions || [],
    category: v1Match?.category || ex.category || 'strength',
    images: v1Match?.images || makeImagePath(ex.name),
  });
}

// --- Step 2: Append V1-only exercises that aren't in V2 ---
let appendedCount = 0;
for (const ex of v1) {
  const key = norm(ex.name);
  if (!usedV1Keys.has(key)) {
    merged.push({
      id: ex.id || makeId(ex.name),
      name: ex.name,
      force: ex.force || 'static',
      level: ex.level || 'beginner',
      mechanic: ex.mechanic || 'compound',
      equipment: ex.equipment || 'body only',
      primaryMuscles: ex.primaryMuscles || [],
      secondaryMuscles: ex.secondaryMuscles || [],
      instructions: ex.instructions || [],
      category: ex.category || 'strength',
      images: ex.images || makeImagePath(ex.name),
    });
    appendedCount++;
  }
}

// --- Stats ---
console.log(`V1: ${v1.length} | V2: ${v2.length}`);
console.log(`Matched by name: ${usedV1Keys.size}`);
console.log(`V2-only (inferred): ${v2.length - usedV1Keys.size}`);
console.log(`V1-only (appended): ${appendedCount}`);
console.log(`Total merged: ${merged.length}`);

// Verify structure
const keys = ['id', 'name', 'force', 'level', 'mechanic', 'equipment', 'primaryMuscles', 'secondaryMuscles', 'instructions', 'category', 'images'];
let bad = 0;
for (const ex of merged) {
  for (const k of keys) {
    if (!(k in ex)) { console.error(`Missing "${k}" in "${ex.name}"`); bad++; }
  }
}
if (bad === 0) console.log('✅ All exercises have all required keys!');

// Sample outputs
console.log('\n--- Matched sample ---');
console.log(JSON.stringify(merged.find(e => usedV1Keys.has(norm(e.name))), null, 2));
console.log('\n--- V2-only sample ---');
console.log(JSON.stringify(merged.find(e => !usedV1Keys.has(norm(e.name)) && merged.indexOf(e) < v2.length), null, 2));
console.log('\n--- V1-only appended sample ---');
console.log(JSON.stringify(merged[merged.length - 1], null, 2));

// Write
const outPath = path.join(process.cwd(), 'src/database/exercises_v2.json');
fs.writeFileSync(outPath, JSON.stringify(merged, null, 2), 'utf-8');
console.log(`\n✅ Saved ${merged.length} exercises to exercises_v2.json`);
