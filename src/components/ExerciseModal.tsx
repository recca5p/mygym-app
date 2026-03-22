import React, { useState, useEffect } from 'react';
import { Modal, View, TextInput, StyleSheet, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

const CATEGORIES = ['strength', 'stretching', 'plyometrics', 'cardio', 'strongman', 'powerlifting', 'olympic weightlifting'];
const BODY_PARTS = [
  'abdominals', 'abductors', 'adductors', 'biceps', 'calves',
  'chest', 'forearms', 'glutes', 'hamstrings', 'lats',
  'lower back', 'middle back', 'neck', 'quadriceps',
  'shoulders', 'traps', 'triceps',
];

interface ExerciseModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, type: string, bodyPart: string) => void;
  initialName?: string;
  initialType?: string;
  initialBodyPart?: string;
  mode?: 'create' | 'edit';
}

export function ExerciseModal({
  visible,
  onClose,
  onSave,
  initialName = '',
  initialType = 'strength',
  initialBodyPart = '',
  mode = 'create',
}: ExerciseModalProps) {
  const isDark = (useColorScheme() ?? 'light') === 'dark';
  const [name, setName] = useState(initialName);
  const [type, setType] = useState(initialType);
  const [bodyPart, setBodyPart] = useState(initialBodyPart);

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setType(initialType);
      setBodyPart(initialBodyPart);
    }
  }, [visible, initialName, initialType, initialBodyPart]);

  const handleSave = () => {
    if (!name.trim() || !type.trim() || !bodyPart.trim()) return;
    onSave(name.trim(), type.trim(), bodyPart.trim());
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
            <Pressable onPress={onClose}>
              <ThemedText style={{ color: '#FF3B30', fontSize: 16, fontWeight: '600' }}>Cancel</ThemedText>
            </Pressable>
            <ThemedText type="defaultSemiBold" style={{ fontSize: 17 }}>
              {isEdit ? 'Edit Exercise' : 'New Exercise'}
            </ThemedText>
            <Pressable onPress={handleSave}>
              <ThemedText style={{ color: '#007AFF', fontSize: 16, fontWeight: '700' }}>
                {isEdit ? 'Save' : 'Create'}
              </ThemedText>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Name */}
            <ThemedText style={styles.label}>Exercise Name</ThemedText>
            <TextInput
              style={[styles.input, { color: textClr, backgroundColor: inputBg }]}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Russian Twist"
              placeholderTextColor="#8E8E93"
              autoFocus={!isEdit}
            />

            {/* Category */}
            <ThemedText style={styles.label}>Category</ThemedText>
            <View style={styles.chipRow}>
              {CATEGORIES.map(c => (
                <Pressable
                  key={c}
                  style={[styles.chip, type === c && styles.chipActive]}
                  onPress={() => setType(c)}
                >
                  <ThemedText style={[styles.chipText, type === c && styles.chipTextActive]}>{c}</ThemedText>
                </Pressable>
              ))}
            </View>

            {/* Target Body Part */}
            <ThemedText style={styles.label}>Target Muscle</ThemedText>
            <View style={styles.chipRow}>
              {BODY_PARTS.map(bp => (
                <Pressable
                  key={bp}
                  style={[styles.chip, bodyPart === bp && styles.chipActive]}
                  onPress={() => setBodyPart(bodyPart === bp ? '' : bp)}
                >
                  <ThemedText style={[styles.chipText, bodyPart === bp && styles.chipTextActive]}>{bp}</ThemedText>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: {
    paddingHorizontal: 20, paddingBottom: 40, paddingTop: 16,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 24, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(142,142,147,0.15)',
  },
  label: { marginBottom: 10, fontWeight: '600', fontSize: 14, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 24,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    backgroundColor: 'rgba(142,142,147,0.12)',
  },
  chipActive: { backgroundColor: '#007AFF' },
  chipText: { color: '#8E8E93', fontSize: 14, fontWeight: '600', textTransform: 'capitalize' },
  chipTextActive: { color: '#FFF' },
});
