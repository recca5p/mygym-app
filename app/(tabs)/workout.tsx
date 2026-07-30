import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Pressable, ActivityIndicator, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useWorkoutSession } from '@/src/store/WorkoutContext';
import { useWorkouts, type Workout } from '@/src/hooks/useWorkouts';
import { useGymContext } from '@/src/store/GymContext';
import { CreateTemplateModal } from '@/src/components/CreateTemplateModal';

export default function WorkoutScreen() {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  const { startNewWorkout, activeWorkout, isRestoring, refreshActiveWorkout } = useWorkoutSession();
  const { getTemplates, createTemplate, deleteTemplate, startWorkoutFromTemplate, getFullWorkout } = useWorkouts();
  const { activeGym } = useGymContext();

  const [templates, setTemplates] = useState<Workout[]>([]);
  const [templateSearch, setTemplateSearch] = useState('');
  const [createVisible, setCreateVisible] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedExercises, setExpandedExercises] = useState<string[]>([]);

  const loadTemplates = useCallback(async () => {
    const t = await getTemplates(activeGym?.id ?? null, templateSearch);
    setTemplates(t);
  }, [getTemplates, activeGym?.id, templateSearch]);

  useEffect(() => {
    let cancelled = false;

    void getTemplates(activeGym?.id ?? null, templateSearch).then((result) => {
      if (!cancelled) {
        setTemplates(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [activeGym?.id, getTemplates, templateSearch]);

  const handleStartWorkout = async () => {
    if (activeWorkout) {
      router.push('/workout/active');
      return;
    }
    const success = await startNewWorkout();
    if (success) {
      router.push('/workout/active');
    }
  };

  const handleStartFromTemplate = async (templateId: number) => {
    if (activeWorkout) {
      Alert.alert('Active Workout', 'Please finish or discard your current workout first.');
      return;
    }
    const id = await startWorkoutFromTemplate(templateId, activeGym?.id ?? null);
    if (id) {
      await refreshActiveWorkout(id);
      router.push('/workout/active');
    }
  };

  const handleDeleteTemplate = (templateId: number, templateName: string | null) => {
    Alert.alert(
      'Delete Template',
      `Are you sure you want to delete "${templateName || 'Untitled'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteTemplate(templateId);
          await loadTemplates();
        }}
      ]
    );
  };

  const handleToggleExpand = async (templateId: number) => {
    if (expandedId === templateId) {
      setExpandedId(null);
      setExpandedExercises([]);
      return;
    }
    setExpandedId(templateId);
    const full = await getFullWorkout(templateId);
    setExpandedExercises(full?.exercises?.map(e => e.exercise?.name || 'Unknown') || []);
  };

  const handleCreateTemplate = async (name: string, exerciseIds: string[]) => {
    await createTemplate(activeGym?.id ?? null, name, exerciseIds);
    setCreateVisible(false);
    await loadTemplates();
  };

  const bg = isDark ? '#000' : '#F2F2F7';
  const cardBg = isDark ? '#1C1C1E' : '#FFF';
  const inputBg = isDark ? '#2C2C2E' : '#E5E5EA';
  const textClr = isDark ? '#FFF' : '#000';

  if (isRestoring) {
    return (
      <View style={[styles.centered, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <View style={styles.header}>
        <ThemedText type="title">Workout</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Quick Start */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Quick Start</ThemedText>
          <Pressable
            style={[styles.primaryBtn, activeWorkout && styles.primaryBtnActive]}
            onPress={handleStartWorkout}
          >
            {activeWorkout ? (
              <>
                <Ionicons name="play" size={24} color="#FFF" />
                <View style={{ marginLeft: 12 }}>
                  <ThemedText style={styles.btnText}>Resume Workout</ThemedText>
                  <ThemedText style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
                    In progress: {activeWorkout.name}
                  </ThemedText>
                </View>
              </>
            ) : (
              <>
                <Ionicons name="add-circle" size={24} color="#FFF" />
                <ThemedText style={[styles.btnText, { marginLeft: 12 }]}>Start Empty Workout</ThemedText>
              </>
            )}
          </Pressable>
        </View>

        {/* Templates */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <ThemedText type="subtitle">My Templates</ThemedText>
            <Pressable onPress={() => setCreateVisible(true)} style={styles.newTemplateBtn}>
              <Ionicons name="add" size={18} color="#FFF" />
              <ThemedText style={{ color: '#FFF', fontWeight: '600', marginLeft: 4, fontSize: 14 }}>New</ThemedText>
            </Pressable>
          </View>

          {/* Search */}
          <View style={[styles.searchRow, { backgroundColor: inputBg }]}>
            <Ionicons name="search" size={18} color="#8E8E93" />
            <TextInput
              style={[styles.searchInput, { color: textClr }]}
              placeholder="Search templates..."
              placeholderTextColor="#8E8E93"
              value={templateSearch}
              onChangeText={setTemplateSearch}
            />
          </View>

          {templates.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: cardBg }]}>
              <Ionicons name="document-text-outline" size={40} color="#8E8E93" style={{ marginBottom: 12 }} />
              <ThemedText style={{ color: textClr, fontWeight: '600', fontSize: 16 }}>No Templates Yet</ThemedText>
              <ThemedText style={{ color: '#8E8E93', textAlign: 'center', marginTop: 8, paddingHorizontal: 20 }}>
                Build a routine to save it as a template.
              </ThemedText>
            </View>
          ) : (
            templates.map((t) => (
              <Pressable
                key={t.id}
                style={[styles.templateCard, { backgroundColor: cardBg }]}
                onPress={() => handleToggleExpand(t.id)}
              >
                <View style={styles.templateRow}>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={{ fontWeight: '600', fontSize: 16 }}>{t.name || 'Untitled'}</ThemedText>
                    <ThemedText style={{ color: '#8E8E93', fontSize: 13, marginTop: 2 }}>
                      Created {new Date(t.created_at.replace(' ', 'T')).toLocaleDateString()}
                    </ThemedText>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Pressable
                      onPress={() => handleStartFromTemplate(t.id)}
                      style={styles.playBtn}
                      hitSlop={8}
                    >
                      <Ionicons name="play" size={16} color="#FFF" />
                    </Pressable>
                    <Pressable
                      onPress={() => handleDeleteTemplate(t.id, t.name)}
                      hitSlop={8}
                    >
                      <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                    </Pressable>
                  </View>
                </View>

                {expandedId === t.id && expandedExercises.length > 0 && (
                  <View style={styles.expandedArea}>
                    {expandedExercises.map((name, idx) => (
                      <ThemedText key={idx} style={styles.expandedExName}>
                        {idx + 1}. {name}
                      </ThemedText>
                    ))}
                  </View>
                )}
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      <CreateTemplateModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onSave={handleCreateTemplate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 80 },
  section: { marginBottom: 32 },
  sectionTitle: { marginBottom: 16 },
  primaryBtn: {
    backgroundColor: '#007AFF', borderRadius: 16, padding: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  primaryBtnActive: { backgroundColor: '#FF9500', shadowColor: '#FF9500' },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  newTemplateBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12,
    paddingHorizontal: 14, marginBottom: 16,
  },
  searchInput: { flex: 1, padding: 12, fontSize: 15, marginLeft: 8 },
  emptyCard: {
    borderRadius: 20, padding: 32, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(142,142,147,0.15)', borderStyle: 'dashed'
  },
  templateCard: {
    borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  templateRow: { flexDirection: 'row', alignItems: 'center' },
  playBtn: {
    backgroundColor: '#34C759', width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  expandedArea: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(142,142,147,0.15)' },
  expandedExName: { color: '#8E8E93', fontSize: 14, paddingVertical: 3 },
});
