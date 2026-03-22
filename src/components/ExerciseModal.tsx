import React, { useState, useEffect } from 'react';
import { Modal, View, TextInput, StyleSheet, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

// Exact options from ExerciseDB JSON
const CATEGORIES = ['strength', 'stretching', 'plyometrics', 'cardio', 'strongman', 'powerlifting', 'olympic weightlifting'];
const FORCE_OPTIONS = ['pull', 'push', 'static'];
const LEVEL_OPTIONS = ['beginner', 'intermediate', 'expert'];
const MECHANIC_OPTIONS = ['compound', 'isolation'];
const EQUIPMENT_OPTIONS = ['body only', 'machine', 'dumbbell', 'barbell', 'cable', 'kettlebells', 'bands', 'medicine ball', 'exercise ball', 'e-z curl bar', 'foam roll', 'other'];
const MUSCLES = [
  'abdominals', 'abductors', 'adductors', 'biceps', 'calves',
  'chest', 'forearms', 'glutes', 'hamstrings', 'lats',
  'lower back', 'middle back', 'neck', 'quadriceps',
  'shoulders', 'traps', 'triceps',
];

export interface ExerciseFormData {
  name: string;
  category: string;
  force: string;
  level: string;
  mechanic: string;
  equipment: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string;
}

interface ExerciseModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: ExerciseFormData) => void;
  initialData?: Partial<ExerciseFormData>;
  mode?: 'create' | 'edit';
}

function SectionLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <View style={styles.labelRow}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      {required ? (
        <ThemedText style={styles.required}>Required</ThemedText>
      ) : (
        <ThemedText style={styles.optional}>Optional</ThemedText>
      )}
    </View>
  );
}

function SinglePicker({ options, value, onChange, color }: {
  options: string[]; value: string; onChange: (v: string) => void; color?: string;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map(o => {
        const active = value === o;
        return (
          <Pressable
            key={o}
            style={[styles.chip, active && { backgroundColor: color || '#007AFF' }]}
            onPress={() => onChange(active ? '' : o)}
          >
            <ThemedText style={[styles.chipText, active && styles.chipTextActive]}>{o}</ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

function MultiPicker({ options, values, onChange, color }: {
  options: string[]; values: string[]; onChange: (v: string[]) => void; color?: string;
}) {
  const toggle = (item: string) => {
    if (values.includes(item)) {
      onChange(values.filter(v => v !== item));
    } else {
      onChange([...values, item]);
    }
  };
  return (
    <View style={styles.chipRow}>
      {options.map(o => {
        const active = values.includes(o);
        return (
          <Pressable
            key={o}
            style={[styles.chip, active && { backgroundColor: color || '#007AFF' }]}
            onPress={() => toggle(o)}
          >
            <ThemedText style={[styles.chipText, active && styles.chipTextActive]}>{o}</ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ExerciseModal({
  visible,
  onClose,
  onSave,
  initialData,
  mode = 'create',
}: ExerciseModalProps) {
  const isDark = (useColorScheme() ?? 'light') === 'dark';

  const [name, setName] = useState('');
  const [category, setCategory] = useState('strength');
  const [force, setForce] = useState('');
  const [level, setLevel] = useState('');
  const [mechanic, setMechanic] = useState('');
  const [equipment, setEquipment] = useState('');
  const [primaryMuscles, setPrimaryMuscles] = useState<string[]>([]);
  const [secondaryMuscles, setSecondaryMuscles] = useState<string[]>([]);
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    if (visible && initialData) {
      setName(initialData.name || '');
      setCategory(initialData.category || 'strength');
      setForce(initialData.force || '');
      setLevel(initialData.level || '');
      setMechanic(initialData.mechanic || '');
      setEquipment(initialData.equipment || '');
      setPrimaryMuscles(initialData.primaryMuscles || []);
      setSecondaryMuscles(initialData.secondaryMuscles || []);
      setInstructions(initialData.instructions || '');
    } else if (visible) {
      setName('');
      setCategory('strength');
      setForce('');
      setLevel('');
      setMechanic('');
      setEquipment('');
      setPrimaryMuscles([]);
      setSecondaryMuscles([]);
      setInstructions('');
    }
  }, [visible, initialData]);

  const canSave = name.trim().length > 0 && category.length > 0 && primaryMuscles.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      name: name.trim(),
      category,
      force,
      level,
      mechanic,
      equipment,
      primaryMuscles,
      secondaryMuscles,
      instructions: instructions.trim(),
    });
    onClose();
  };

  const bg = isDark ? '#1C1C1E' : '#FFFFFF';
  const textClr = isDark ? '#FFF' : '#000';
  const inputBg = isDark ? '#2C2C2E' : '#F2F2F7';
  const isEdit = mode === 'edit';

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.modalContainer, { backgroundColor: bg }]}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={onClose} hitSlop={12}>
              <ThemedText style={{ color: '#FF3B30', fontSize: 16, fontWeight: '600' }}>Cancel</ThemedText>
            </Pressable>
            <ThemedText type="defaultSemiBold" style={{ fontSize: 17 }}>
              {isEdit ? 'Edit Exercise' : 'New Exercise'}
            </ThemedText>
            <Pressable onPress={handleSave} disabled={!canSave} hitSlop={12}>
              <ThemedText style={{ color: canSave ? '#007AFF' : '#8E8E93', fontSize: 16, fontWeight: '700' }}>
                {isEdit ? 'Save' : 'Create'}
              </ThemedText>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Name */}
            <SectionLabel label="Exercise Name" required />
            <TextInput
              style={[styles.input, { color: textClr, backgroundColor: inputBg }]}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Russian Twist"
              placeholderTextColor="#8E8E93"
              autoFocus={!isEdit}
            />

            {/* Category */}
            <SectionLabel label="Category" required />
            <SinglePicker options={CATEGORIES} value={category} onChange={setCategory} />

            {/* Primary Muscles (multi-select) */}
            <SectionLabel label="Primary Muscles" required />
            <MultiPicker options={MUSCLES} values={primaryMuscles} onChange={setPrimaryMuscles} />

            {/* Force */}
            <SectionLabel label="Force" />
            <SinglePicker options={FORCE_OPTIONS} value={force} onChange={setForce} color="#FF9500" />

            {/* Level */}
            <SectionLabel label="Level" />
            <SinglePicker options={LEVEL_OPTIONS} value={level} onChange={setLevel} color="#34C759" />

            {/* Mechanic */}
            <SectionLabel label="Mechanic" />
            <SinglePicker options={MECHANIC_OPTIONS} value={mechanic} onChange={setMechanic} color="#5856D6" />

            {/* Equipment */}
            <SectionLabel label="Equipment" />
            <SinglePicker options={EQUIPMENT_OPTIONS} value={equipment} onChange={setEquipment} color="#FF2D55" />

            {/* Secondary Muscles (multi-select) */}
            <SectionLabel label="Secondary Muscles" />
            <MultiPicker options={MUSCLES} values={secondaryMuscles} onChange={setSecondaryMuscles} color="#8E8E93" />

            {/* Instructions */}
            <SectionLabel label="Instructions" />
            <ThemedText style={styles.hint}>One instruction per line</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea, { color: textClr, backgroundColor: inputBg }]}
              value={instructions}
              onChangeText={setInstructions}
              placeholder={'Step 1: Stand with feet shoulder-width apart.\nStep 2: Lower your body...'}
              placeholderTextColor="#8E8E93"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: {
    paddingHorizontal: 20, paddingBottom: 20, paddingTop: 16,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(142,142,147,0.15)',
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontWeight: '700', fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5, color: '#8E8E93' },
  required: { fontSize: 11, color: '#FF3B30', fontWeight: '600' },
  optional: { fontSize: 11, color: '#8E8E93', fontWeight: '500' },
  hint: { fontSize: 12, color: '#8E8E93', marginBottom: 8 },
  input: { borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 20 },
  textArea: { minHeight: 120 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: {
    paddingHorizontal: 13, paddingVertical: 9, borderRadius: 12,
    backgroundColor: 'rgba(142,142,147,0.12)',
  },
  chipText: { color: '#8E8E93', fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  chipTextActive: { color: '#FFF' },
});
