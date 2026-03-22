import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, ScrollView, Pressable, ActivityIndicator, useWindowDimensions, Alert, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useExercises, type Exercise } from '@/src/hooks/useExercises';
import { ExerciseModal } from '@/src/components/ExerciseModal';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const isDark = (useColorScheme() ?? 'light') === 'dark';
  const { getExerciseById, updateExercise, deleteExercise } = useExercises();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const { width: screenWidth } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const loadExercise = async () => {
    if (id) {
      const ex = await getExerciseById(id as string);
      setExercise(ex);
    }
  };

  useEffect(() => {
    loadExercise();
  }, [id]);

  if (!exercise) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const bg = isDark ? '#000' : '#F2F2F7';
  const cardBg = isDark ? '#1C1C1E' : '#FFF';

  let imagesArr: string[] = [];
  try { imagesArr = JSON.parse(exercise.images); } catch (_e) { /* empty */ }
  let instructionsArr: string[] = [];
  try { instructionsArr = JSON.parse(exercise.instructions); } catch (_e) { /* empty */ }

  const imageWidth = screenWidth;
  const imageHeight = screenWidth * 0.75;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / imageWidth);
    setActiveIndex(index);
  };

  const goToSlide = (direction: number) => {
    const nextIndex = Math.max(0, Math.min(activeIndex + direction, imagesArr.length - 1));
    scrollRef.current?.scrollTo({ x: nextIndex * imageWidth, animated: true });
    setActiveIndex(nextIndex);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Exercise',
      `Are you sure you want to delete "${exercise.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteExercise(exercise.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    setEditModalVisible(true);
  };

  const handleSaveEdit = async (name: string, type: string, bodyPart: string) => {
    await updateExercise(exercise.id, name, type, bodyPart);
    await loadExercise();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      <ScrollView bounces={false} style={{ flex: 1 }}>
        {/* Top bar with back + actions */}
        <View style={styles.topBar}>
          <Pressable style={styles.topBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </Pressable>

          <View style={styles.topActions}>
            <Pressable style={styles.topBtn} onPress={handleEdit}>
              <Ionicons name="create-outline" size={22} color="#FFF" />
            </Pressable>
            <Pressable style={[styles.topBtn, { backgroundColor: 'rgba(255,59,48,0.8)' }]} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={22} color="#FFF" />
            </Pressable>
          </View>
        </View>

        {/* Image carousel */}
        {imagesArr.length > 0 ? (
          <View>
            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleScroll}
              style={{ width: imageWidth, height: imageHeight }}
            >
              {imagesArr.map((uri, i) => (
                <Image
                  key={i}
                  source={{ uri }}
                  style={{ width: imageWidth, height: imageHeight }}
                  contentFit="cover"
                  transition={200}
                />
              ))}
            </ScrollView>

            {imagesArr.length > 1 ? (
              <View style={styles.carouselControls}>
                <Pressable
                  style={[styles.arrowBtn, activeIndex === 0 && styles.arrowDisabled]}
                  onPress={() => goToSlide(-1)}
                  disabled={activeIndex === 0}
                >
                  <Ionicons name="chevron-back" size={22} color="#FFF" />
                </Pressable>
                <ThemedText style={styles.slideCounter}>
                  {activeIndex + 1} / {imagesArr.length}
                </ThemedText>
                <Pressable
                  style={[styles.arrowBtn, activeIndex === imagesArr.length - 1 && styles.arrowDisabled]}
                  onPress={() => goToSlide(1)}
                  disabled={activeIndex === imagesArr.length - 1}
                >
                  <Ionicons name="chevron-forward" size={22} color="#FFF" />
                </Pressable>
              </View>
            ) : null}

            {imagesArr.length > 1 ? (
              <View style={styles.dots}>
                {imagesArr.map((_, i) => (
                  <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
                ))}
              </View>
            ) : null}
          </View>
        ) : (
          <View style={[{ width: imageWidth, height: imageHeight }, styles.noImage]}>
            <Ionicons name="barbell" size={60} color="#8E8E93" />
          </View>
        )}

        <View style={[styles.content, { backgroundColor: bg }]}>
          <ThemedText type="title" style={{ marginBottom: 16 }}>{exercise.name}</ThemedText>

          <View style={styles.tags}>
            <View style={styles.tag}>
              <ThemedText style={styles.tagTxt}>{exercise.body_part}</ThemedText>
            </View>
            <View style={styles.tag}>
              <ThemedText style={styles.tagTxt}>{exercise.type}</ThemedText>
            </View>
            <View style={styles.tag}>
              <ThemedText style={styles.tagTxt}>{exercise.equipment}</ThemedText>
            </View>
            <View style={[styles.tag, { backgroundColor: 'rgba(52, 199, 89, 0.1)' }]}>
              <ThemedText style={[styles.tagTxt, { color: '#34C759' }]}>{exercise.level}</ThemedText>
            </View>
          </View>

          {exercise.force ? (
            <View style={[styles.infobox, { backgroundColor: cardBg }]}>
              <ThemedText style={styles.infoboxTitle}>Force &amp; Mechanic</ThemedText>
              <ThemedText style={{ color: '#8E8E93', textTransform: 'capitalize' }}>
                {exercise.force}{exercise.mechanic ? ` · ${exercise.mechanic}` : ''}
              </ThemedText>
            </View>
          ) : null}

          <View style={[styles.infobox, { backgroundColor: cardBg }]}>
            <ThemedText style={styles.infoboxTitle}>Secondary Muscles</ThemedText>
            <ThemedText style={{ color: '#8E8E93', textTransform: 'capitalize' }}>
              {exercise.secondary_muscles && exercise.secondary_muscles !== '[]'
                ? JSON.parse(exercise.secondary_muscles).join(', ')
                : 'None listed'}
            </ThemedText>
          </View>

          <ThemedText type="subtitle" style={styles.sectionTitle}>Instructions</ThemedText>

          <View style={[styles.instructionList, { backgroundColor: cardBg }]}>
            {instructionsArr.length > 0 ? instructionsArr.map((step: string, i: number) => (
              <View key={i} style={styles.stepBlock}>
                <View style={styles.stepNum}>
                  <ThemedText style={styles.stepNumTxt}>{i + 1}</ThemedText>
                </View>
                <ThemedText style={styles.stepText}>{step}</ThemedText>
              </View>
            )) : (
              <ThemedText style={{ padding: 16 }}>No specific instructions available.</ThemedText>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <ExerciseModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSave={handleSaveEdit}
        initialName={exercise.name}
        initialType={exercise.type}
        initialBodyPart={exercise.body_part}
        mode="edit"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: {
    position: 'absolute', top: 8, left: 16, right: 16, zIndex: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  topBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center',
  },
  topActions: { flexDirection: 'row', gap: 10 },
  noImage: { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  carouselControls: {
    position: 'absolute', bottom: 16, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20,
  },
  arrowBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center',
  },
  arrowDisabled: { opacity: 0.3 },
  slideCounter: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(142,142,147,0.3)' },
  dotActive: { backgroundColor: '#007AFF', width: 18 },
  content: { padding: 24, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  tag: { backgroundColor: 'rgba(0, 122, 255, 0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  tagTxt: { color: '#007AFF', fontWeight: 'bold', textTransform: 'capitalize' },
  infobox: { padding: 16, borderRadius: 16, marginBottom: 24 },
  infoboxTitle: { fontWeight: 'bold', marginBottom: 4 },
  sectionTitle: { marginBottom: 16 },
  instructionList: { borderRadius: 16, paddingVertical: 16, marginBottom: 40 },
  stepBlock: { flexDirection: 'row', marginBottom: 16, paddingHorizontal: 16, paddingRight: 36 },
  stepNum: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#007AFF',
    justifyContent: 'center', alignItems: 'center', marginRight: 16, marginTop: 2,
  },
  stepNumTxt: { color: '#FFF', fontWeight: 'bold' },
  stepText: { fontSize: 16, lineHeight: 24, flex: 1 },
});
