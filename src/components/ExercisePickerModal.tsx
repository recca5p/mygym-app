import React, { useState, useEffect } from 'react';
import { Modal, View, StyleSheet, FlatList, TextInput, Pressable, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/themed-text';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useExercises, type Exercise } from '@/src/hooks/useExercises';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (exerciseId: string) => void;
}

export function ExercisePickerModal({ visible, onClose, onSelect }: Props) {
  const isDark = useColorScheme() === 'dark';
  const { exercises, fetchExercises } = useExercises();
  const [search, setSearch] = useState('');
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    if (visible) {
      fetchExercises(search, '');
    }
  }, [visible, search, fetchExercises]);

  const bg = isDark ? '#1C1C1E' : '#FFFFFF';
  const textClr = isDark ? '#FFF' : '#000';
  const inputBg = isDark ? '#2C2C2E' : '#F2F2F7';
  const separatorClr = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  const renderItem = ({ item }: { item: Exercise }) => {
    let imagesArr: string[] = [];
    try { imagesArr = JSON.parse(item.images); } catch { /* empty */ }
    const displayImg = imagesArr.length > 0 ? imagesArr[0] : null;

    return (
      <Pressable
        style={styles.row}
        onPress={() => onSelect(item.id)}
      >
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

        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            setDetailExercise(item);
          }}
          style={styles.infoBtn}
          hitSlop={8}
        >
          <Ionicons name="information-circle-outline" size={24} color="#8E8E93" />
        </Pressable>

        <Ionicons name="add-circle" size={24} color="#007AFF" style={{ marginLeft: 8 }} />
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: bg }]}>
          <View style={styles.header}>
            <ThemedText type="defaultSemiBold" style={{ fontSize: 17 }}>Select Exercise</ThemedText>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
              <ThemedText style={{ color: '#007AFF', fontSize: 16, fontWeight: '600' }}>Done</ThemedText>
            </Pressable>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: textClr, backgroundColor: inputBg }]}
              placeholder="Search exercise"
              placeholderTextColor="#8E8E93"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <FlatList
            data={exercises}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: separatorClr }]} />}
            keyboardDismissMode="on-drag"
          />
        </View>
      </KeyboardAvoidingView>

      {/* Detail Overlay */}
      {detailExercise && (
        <Modal transparent animationType="fade" visible={!!detailExercise}>
          <View style={styles.detailOverlay}>
            <View style={[styles.detailCard, { backgroundColor: bg }]}>
              <View style={styles.detailHeader}>
                <ThemedText type="defaultSemiBold" style={{ flex: 1, fontSize: 18 }} numberOfLines={1}>
                  {detailExercise.name}
                </ThemedText>
                <Pressable onPress={() => setDetailExercise(null)} hitSlop={12}>
                  <Ionicons name="close-circle" size={26} color="#8E8E93" />
                </Pressable>
              </View>

              <ScrollView style={styles.detailBody} showsVerticalScrollIndicator={false}>
                <View style={styles.chipRow}>
                  <View style={styles.chip}><ThemedText style={styles.chipText}>{detailExercise.body_part}</ThemedText></View>
                  {detailExercise.equipment && (
                    <View style={styles.chip}><ThemedText style={styles.chipText}>{detailExercise.equipment}</ThemedText></View>
                  )}
                </View>

                {detailExercise.instructions ? (
                  <>
                    <ThemedText style={styles.sectionTitle}>Instructions</ThemedText>
                    <ThemedText style={{ color: '#8E8E93', lineHeight: 22 }}>{detailExercise.instructions}</ThemedText>
                  </>
                ) : (
                  <ThemedText style={{ color: '#8E8E93', fontStyle: 'italic' }}>No instructions available.</ThemedText>
                )}
              </ScrollView>

              <Pressable
                style={styles.detailAddBtn}
                onPress={() => {
                  onSelect(detailExercise.id);
                  setDetailExercise(null);
                }}
              >
                <ThemedText style={styles.detailAddBtnText}>Add to Workout</ThemedText>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16, paddingVertical: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: 'rgba(142,142,147,0.15)',
  },
  closeBtn: { position: 'absolute', right: 16 },
  searchContainer: { padding: 16, flexDirection: 'row', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: 28, zIndex: 1 },
  searchInput: { flex: 1, padding: 12, paddingLeft: 42, fontSize: 16, borderRadius: 12 },
  list: { paddingBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2C2C2E', overflow: 'hidden' },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(142, 142, 147, 0.15)' },
  rowText: { flex: 1, marginLeft: 14, marginRight: 8 },
  rowName: { fontSize: 16, fontWeight: '500', marginBottom: 2 },
  rowMuscle: { color: '#8E8E93', fontSize: 13, textTransform: 'capitalize' },
  infoBtn: { padding: 4 },
  separator: { height: 1, marginLeft: 74 },
  detailOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  detailCard: { borderRadius: 24, padding: 24, maxHeight: '80%', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  detailBody: { marginBottom: 20 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { backgroundColor: 'rgba(142,142,147,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  chipText: { color: '#8E8E93', fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8, marginTop: 4 },
  detailAddBtn: { backgroundColor: '#007AFF', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  detailAddBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});
