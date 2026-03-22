import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, TextInput, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useExercises, type Exercise } from '@/src/hooks/useExercises';
import { ExerciseModal } from '@/src/components/ExerciseModal';
import { Link } from 'expo-router';

const MUSCLES = [
  'abdominals', 'abductors', 'adductors', 'biceps', 'calves',
  'chest', 'forearms', 'glutes', 'hamstrings', 'lats',
  'lower back', 'middle back', 'neck', 'quadriceps',
  'shoulders', 'traps', 'triceps',
];

export default function ExercisesScreen() {
  const isDark = (useColorScheme() ?? 'light') === 'dark';
  const { exercises, fetchExercises, addCustomExercise, deleteExercise } = useExercises();

  const [search, setSearch] = useState('');
  const [activeMuscle, setActiveMuscle] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchExercises(search, activeMuscle);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, activeMuscle, fetchExercises]);

  const bg = isDark ? '#000' : '#F2F2F7';
  const textClr = isDark ? '#FFF' : '#000';
  const separatorClr = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  const renderItem = ({ item }: { item: Exercise }) => {
    let imagesArr: string[] = [];
    try { imagesArr = JSON.parse(item.images); } catch (_e) { /* empty */ }
    const displayImg = imagesArr.length > 0 ? imagesArr[0] : null;

    return (
      <Link href={{ pathname: '/exercise/[id]', params: { id: item.id } }} asChild>
        <Pressable style={styles.row}>
          {displayImg ? (
            <Image source={{ uri: displayImg }} style={styles.avatar} contentFit="cover" transition={150} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="barbell" size={18} color="#8E8E93" />
            </View>
          )}

          <View style={styles.rowText}>
            <ThemedText numberOfLines={1} style={styles.rowName}>{item.name}</ThemedText>
            <ThemedText style={styles.rowMuscle} numberOfLines={1}>{item.body_part}</ThemedText>
          </View>

          <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
        </Pressable>
      </Link>
    );
  };

  const separator = () => <View style={[styles.separator, { backgroundColor: separatorClr }]} />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <View style={styles.header}>
        <View>
          <ThemedText type="title">Library</ThemedText>
          <ThemedText style={{ color: '#8E8E93' }}>
            {exercises.length} results
          </ThemedText>
        </View>
        <Pressable onPress={() => setModalVisible(true)} style={styles.addButton}>
          <Ionicons name="add" size={28} color="#FFF" />
        </Pressable>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: textClr, backgroundColor: isDark ? '#1C1C1E' : '#E5E5EA' }]}
          placeholder="Search exercise"
          placeholderTextColor="#8E8E93"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <Pressable
            style={[styles.filterChip, !activeMuscle && styles.filterActiveBg]}
            onPress={() => setActiveMuscle('')}
          >
            <ThemedText style={[styles.filterText, !activeMuscle && styles.filterActiveTxt]}>All Muscles</ThemedText>
          </Pressable>

          {MUSCLES.map(m => (
            <Pressable
              key={m}
              style={[styles.filterChip, activeMuscle === m && styles.filterActiveBg]}
              onPress={() => setActiveMuscle(activeMuscle === m ? '' : m)}
            >
              <ThemedText style={[styles.filterText, activeMuscle === m && styles.filterActiveTxt]}>{m}</ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={exercises}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={separator}
      />

      <ExerciseModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={(name, type, part) => addCustomExercise(name, type, part)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12,
  },
  addButton: {
    backgroundColor: '#007AFF', width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 20,
    marginBottom: 12, borderRadius: 12, overflow: 'hidden',
  },
  searchIcon: { position: 'absolute', left: 14, zIndex: 1 },
  searchInput: { flex: 1, padding: 12, paddingLeft: 42, fontSize: 16, borderRadius: 12 },
  filterWrapper: { height: 40, marginBottom: 8 },
  filterScroll: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: 'rgba(142, 142, 147, 0.12)',
    borderRadius: 20,
  },
  filterActiveBg: { backgroundColor: '#007AFF' },
  filterText: { color: '#8E8E93', fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  filterActiveTxt: { color: '#FFF' },
  list: { paddingBottom: 80 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 20,
  },
  avatar: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#2C2C2E',
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(142, 142, 147, 0.15)',
  },
  rowText: { flex: 1, marginLeft: 14, marginRight: 8 },
  rowName: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  rowMuscle: { color: '#007AFF', fontSize: 13, textTransform: 'capitalize' },
  separator: { height: 1, marginLeft: 84 },
});
