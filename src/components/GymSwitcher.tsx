import React, { useState } from 'react';
import { Modal, View, StyleSheet, Pressable, ScrollView, TextInput, KeyboardAvoidingView, Platform, Text, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useGymContext, type Gym } from '@/src/store/GymContext';

const ICONS = ['🏋️', '💪', '🏃', '🚴', '🥊', '🧗', '🏊', '🤸'];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function GymSwitcher({ visible, onClose }: Props) {
  const isDark = (useColorScheme() ?? 'light') === 'dark';
  const { gyms, activeGym, switchGym, createGym, updateGym, deleteGym } = useGymContext();
  
  const [formMode, setFormMode] = useState<'none' | 'add' | 'edit'>('none');
  const [editingGym, setEditingGym] = useState<Gym | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [iconInput, setIconInput] = useState('💪');

  const bg = isDark ? '#1C1C1E' : '#FFFFFF';
  const textClr = isDark ? '#FFF' : '#000';
  const inputBg = isDark ? '#2C2C2E' : '#F2F2F7';
  const insets = useSafeAreaInsets();

  const handleSelect = async (id: number) => {
    await switchGym(id);
    onClose();
  };

  const openAddForm = () => {
    setNameInput('');
    setIconInput('💪');
    setEditingGym(null);
    setFormMode('add');
  };

  const openEditForm = (gym: Gym) => {
    setNameInput(gym.name);
    setIconInput(gym.icon);
    setEditingGym(gym);
    setFormMode('edit');
  };

  const handleSave = async () => {
    if (!nameInput.trim()) return;
    
    if (formMode === 'add') {
      await createGym(nameInput.trim(), iconInput);
    } else if (formMode === 'edit' && editingGym) {
      await updateGym(editingGym.id, nameInput.trim(), iconInput);
    }
    
    setFormMode('none');
  };

  const handleDelete = () => {
    if (!editingGym) return;
    
    Alert.alert(
      'Delete Gym',
      `Are you sure you want to delete "${editingGym.name}"? Your workouts logged at this gym will remain but the gym association will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            await deleteGym(editingGym.id);
            setFormMode('none');
            // If we just deleted the last gym, context will auto-trigger onboarding behind the scenes
            if (gyms.length <= 1) {
              onClose();
            }
          }
        }
      ]
    );
  };

  const renderForm = () => {
    const isEdit = formMode === 'edit';
    const canSave = nameInput.trim().length > 0 && (
      !isEdit || nameInput !== editingGym?.name || iconInput !== editingGym?.icon
    );

    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={[styles.modalContainer, { backgroundColor: bg, marginTop: insets.top }]}>
          <View style={styles.header}>
            <Pressable onPress={() => setFormMode('none')} hitSlop={12}>
              <Ionicons name="arrow-back" size={24} color={textClr} />
            </Pressable>
            <ThemedText type="defaultSemiBold" style={{ fontSize: 17 }}>
              {isEdit ? 'Edit Gym' : 'Add New Gym'}
            </ThemedText>
            <Pressable onPress={handleSave} disabled={!canSave} hitSlop={12}>
              <ThemedText style={{ color: canSave ? '#007AFF' : '#8E8E93', fontSize: 16, fontWeight: '700' }}>
                Save
              </ThemedText>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            <ThemedText style={styles.label}>Select an Icon</ThemedText>
            <View style={styles.iconRow}>
              {ICONS.map(i => (
                <Pressable
                  key={i}
                  style={[styles.iconBtn, iconInput === i && styles.iconBtnActive, { backgroundColor: inputBg }]}
                  onPress={() => setIconInput(i)}
                >
                  <Text style={styles.emoji}>{i}</Text>
                </Pressable>
              ))}
            </View>

            <ThemedText style={styles.label}>Gym Name</ThemedText>
            <TextInput
              style={[styles.input, { color: textClr, backgroundColor: inputBg }]}
              placeholder="e.g. Planet Fitness"
              placeholderTextColor="#8E8E93"
              value={nameInput}
              onChangeText={setNameInput}
              autoFocus
            />

            {isEdit && gyms.length > 1 && (
              <Pressable style={styles.deleteBtn} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                <ThemedText style={{ color: '#FF3B30', fontSize: 16, fontWeight: '600', marginLeft: 8 }}>
                  Delete Gym
                </ThemedText>
              </Pressable>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    );
  };

  const renderList = () => (
    <View style={[styles.modalContainer, { backgroundColor: bg, marginTop: insets.top }]}>
      <View style={styles.header}>
        <ThemedText type="defaultSemiBold" style={{ fontSize: 17, marginLeft: 36 }}>Switch Gym</ThemedText>
        <Pressable onPress={onClose} hitSlop={12}>
          <Ionicons name="close" size={28} color={textClr} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {gyms.map(gym => {
          const isActive = activeGym?.id === gym.id;
          return (
            <View key={gym.id} style={[styles.row, isActive && styles.rowActive]}>
              <Pressable 
                style={styles.rowClickable}
                onPress={() => handleSelect(gym.id)}
              >
                <View style={[styles.gymIcon, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
                  <Text style={{ fontSize: 18 }}>{gym.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={[styles.gymName, isActive && styles.gymNameActive]}>{gym.name}</ThemedText>
                </View>
                {isActive && <Ionicons name="checkmark-circle" size={22} color="#007AFF" style={{ marginRight: 12 }} />}
              </Pressable>
              
              <Pressable 
                style={styles.editBtn} 
                onPress={() => openEditForm(gym)}
                hitSlop={8}
              >
                <Ionicons name="pencil" size={20} color="#8E8E93" />
              </Pressable>
            </View>
          );
        })}

        <Pressable style={styles.addBtn} onPress={openAddForm}>
          <Ionicons name="add" size={20} color="#007AFF" />
          <ThemedText style={{ color: '#007AFF', fontSize: 16, fontWeight: '600', marginLeft: 8 }}>
            Add another gym
          </ThemedText>
        </Pressable>
      </ScrollView>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        {formMode !== 'none' ? renderForm() : renderList()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: {
    paddingHorizontal: 20, paddingBottom: 20, paddingTop: 16,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '90%', minHeight: 400,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(142,142,147,0.15)',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 16, marginBottom: 8,
  },
  rowActive: { backgroundColor: 'rgba(0,122,255,0.08)' },
  rowClickable: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  gymIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  gymName: { fontSize: 16, fontWeight: '500' },
  gymNameActive: { color: '#007AFF', fontWeight: 'bold' },
  editBtn: { padding: 8 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, marginTop: 12,
  },
  label: { fontSize: 13, fontWeight: '600', color: '#8E8E93', textTransform: 'uppercase', marginBottom: 12 },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  iconBtn: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center',
  },
  iconBtnActive: { borderWidth: 2, borderColor: '#007AFF' },
  emoji: { fontSize: 22 },
  input: { borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 20 },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 10, paddingVertical: 16, borderRadius: 12, backgroundColor: 'rgba(255,59,48,0.1)'
  }
});
