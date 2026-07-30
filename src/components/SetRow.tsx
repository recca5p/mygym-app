import React, { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { WorkoutSet } from '@/src/hooks/useWorkouts';

interface Props {
  set: WorkoutSet;
  onUpdate: (updates: Partial<WorkoutSet>) => void;
  onDelete: () => void;
}

const TYPE_CONFIG = {
  normal: { label: '', color: '#8E8E93' },           // No prefix letter, standard gray number
  warmup: { label: 'W', color: '#FF9500' },          // Orange
  drop:   { label: 'D', color: '#AF52DE' },          // Purple
  failure:{ label: 'F', color: '#FF3B30' },          // Red
};

type SetType = keyof typeof TYPE_CONFIG;
const TYPES: SetType[] = ['normal', 'warmup', 'drop', 'failure'];

export function SetRow({ set, onUpdate, onDelete }: Props) {
  const isDark = useColorScheme() === 'dark';

  const [weight, setWeight] = useState(set.weight_kg ? set.weight_kg.toString() : '');
  const [reps, setReps] = useState(set.reps ? set.reps.toString() : '');

  const inputBg = isDark ? '#2C2C2E' : '#F2F2F7';
  const textClr = isDark ? '#FFF' : '#000';
  const completedColor = '#34C759';

  const config = TYPE_CONFIG[set.set_type] || TYPE_CONFIG.normal;

  const cycleType = () => {
    const nextIdx = (TYPES.indexOf(set.set_type) + 1) % TYPES.length;
    onUpdate({ set_type: TYPES[nextIdx] });
  };

  const handleBlurWeight = () => {
    onUpdate({ weight_kg: weight ? parseFloat(weight) : null });
  };

  const handleBlurReps = () => {
    onUpdate({ reps: reps ? parseInt(reps, 10) : null });
  };

  return (
    <View style={[styles.row, set.is_completed && { backgroundColor: isDark ? 'rgba(52,199,89,0.1)' : 'rgba(52,199,89,0.05)' }]}>
      {/* Set Number / Type Toggler */}
      <Pressable style={styles.typeCol} onPress={cycleType} hitSlop={8}>
        <ThemedText style={{ color: set.is_completed ? completedColor : config.color, fontWeight: 'bold' }}>
          {config.label || set.set_number}
        </ThemedText>
      </Pressable>

      {/* Prev String Placeholder */}
      <View style={styles.prevCol}>
        <ThemedText style={styles.prevText}>-</ThemedText>
      </View>

      {/* Weight Input */}
      <View style={styles.inputCol}>
        <TextInput
          style={[styles.input, { backgroundColor: set.is_completed ? 'transparent' : inputBg, color: textClr }]}
          keyboardType="decimal-pad"
          placeholder="-"
          placeholderTextColor="#8E8E93"
          value={weight}
          onChangeText={setWeight}
          onBlur={handleBlurWeight}
          editable={!set.is_completed}
        />
      </View>

      {/* Reps Input */}
      <View style={styles.inputCol}>
        <TextInput
          style={[styles.input, { backgroundColor: set.is_completed ? 'transparent' : inputBg, color: textClr }]}
          keyboardType="number-pad"
          placeholder="-"
          placeholderTextColor="#8E8E93"
          value={reps}
          onChangeText={setReps}
          onBlur={handleBlurReps}
          editable={!set.is_completed}
        />
      </View>

      {/* Checkmark Button */}
      <Pressable
        style={[styles.checkCol, set.is_completed && { backgroundColor: completedColor }]}
        onPress={() => onUpdate({ is_completed: !set.is_completed })}
      >
        {set.is_completed ? (
          <Ionicons name="checkmark" size={18} color="#FFF" />
        ) : (
          <View style={styles.checkEmpty} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 16,
  },
  typeCol: { width: 32, alignItems: 'center', justifyContent: 'center' },
  prevCol: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  prevText: { color: '#8E8E93', fontSize: 13 },
  inputCol: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  input: {
    width: '100%', textAlign: 'center', paddingVertical: 8, fontSize: 16,
    fontWeight: '600', borderRadius: 8,
  },
  checkCol: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(142,142,147,0.15)',
    justifyContent: 'center', alignItems: 'center', marginLeft: 12,
  },
  checkEmpty: { width: 14, height: 14, borderRadius: 4, borderWidth: 2, borderColor: '#8E8E93' }
});
