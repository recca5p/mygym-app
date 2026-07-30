import React, { useState, useEffect } from 'react';
import { Modal, View, TextInput, StyleSheet, Pressable, FlatList, Platform, KeyboardAvoidingView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ExercisePickerModal } from './ExercisePickerModal';
import { useExercises, type Exercise } from '@/src/hooks/useExercises';
import { useSQLiteContext } from 'expo-sqlite';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, exerciseIds: string[]) => void;
}

export function CreateTemplateModal({ visible, onClose, onSave }: Props) {
  const isDark = useColorScheme() === 'dark';
  const db = useSQLiteContext();
  const { exercises: allExercises, fetchExercises } = useExercises();

  const [name, setName] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);

  // Preload exercises when modal opens
  useEffect(() => {
    if (visible) {
      fetchExercises('', '');
    }
  }, [visible, fetchExercises]);

  const bg = isDark ? '#1C1C1E' : '#FFFFFF';
  const inputBg = isDark ? '#2C2C2E' : '#F2F2F7';
  const textClr = isDark ? '#FFF' : '#000';

  const canSave = name.trim().length > 0 && selectedExercises.length > 0;

  const handleAddExercise = async (exerciseId: string) => {
    setPickerVisible(false);
    // Already added?
    if (selectedExercises.find(s => s.id === exerciseId)) return;

    // Try from loaded list first, fallback to DB lookup
    let ex = allExercises.find(e => e.id === exerciseId);
    if (!ex) {
      const row = await db.getFirstAsync<Exercise>('SELECT * FROM exercise WHERE id = ?', [exerciseId]);
      if (row) ex = row;
    }
    if (ex) {
      setSelectedExercises(prev => [...prev, ex!]);
    }
  };

  const handleRemove = (exerciseId: string) => {
    setSelectedExercises(prev => prev.filter(e => e.id !== exerciseId));
  };

  const handleSave = () => {
    if (!canSave) return;
    onSave(name.trim(), selectedExercises.map(e => e.id));
    setName('');
    setSelectedExercises([]);
  };

  const handleClose = () => {
    setName('');
    setSelectedExercises([]);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: bg }]}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={handleClose} hitSlop={12}>
              <ThemedText style={{ color: '#FF3B30', fontSize: 16, fontWeight: '600' }}>Cancel</ThemedText>
            </Pressable>
            <ThemedText type="defaultSemiBold" style={{ fontSize: 17 }}>New Template</ThemedText>
            <Pressable onPress={handleSave} disabled={!canSave} hitSlop={12}>
              <ThemedText style={{ color: canSave ? '#007AFF' : '#8E8E93', fontSize: 16, fontWeight: '700' }}>Save</ThemedText>
            </Pressable>
          </View>

          {/* Name Input */}
          <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            <ThemedText style={styles.label}>TEMPLATE NAME</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: textClr }]}
              placeholder="e.g. Push Day"
              placeholderTextColor="#8E8E93"
              value={name}
              onChangeText={setName}
              autoFocus
            />
          </View>

          {/* Exercise List */}
          <View style={{ flex: 1, paddingHorizontal: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <ThemedText style={styles.label}>EXERCISES ({selectedExercises.length})</ThemedText>
              <Pressable onPress={() => setPickerVisible(true)} style={styles.addBtn}>
                <Ionicons name="add" size={18} color="#FFF" />
                <ThemedText style={{ color: '#FFF', fontWeight: '600', fontSize: 14, marginLeft: 4 }}>Add</ThemedText>
              </Pressable>
            </View>

            {selectedExercises.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="barbell-outline" size={40} color="#8E8E93" style={{ marginBottom: 12 }} />
                <ThemedText style={{ color: '#8E8E93', textAlign: 'center' }}>
                  Add exercises to build your template.
                </ThemedText>
              </View>
            ) : (
              <FlatList
                data={selectedExercises}
                keyExtractor={item => item.id}
                renderItem={({ item, index }) => (
                  <View style={[styles.exRow, { backgroundColor: inputBg }]}>
                    <ThemedText style={{ color: '#8E8E93', fontWeight: 'bold', width: 28 }}>{index + 1}</ThemedText>
                    <ThemedText style={{ flex: 1, fontWeight: '500' }} numberOfLines={1}>{item.name}</ThemedText>
                    <Pressable onPress={() => handleRemove(item.id)} hitSlop={8}>
                      <Ionicons name="close-circle" size={22} color="#FF3B30" />
                    </Pressable>
                  </View>
                )}
                contentContainerStyle={{ paddingBottom: 20 }}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              />
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      <ExercisePickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={handleAddExercise}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(142,142,147,0.15)',
  },
  label: { color: '#8E8E93', fontWeight: '700', fontSize: 12, letterSpacing: 0.5, marginBottom: 8 },
  input: { borderRadius: 12, padding: 14, fontSize: 16 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
  },
  emptyState: {
    flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80,
  },
  exRow: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 14,
  },
});
