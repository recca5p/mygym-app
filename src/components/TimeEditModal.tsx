import React, { useState } from 'react';
import { Modal, View, TextInput, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Props {
  visible: boolean;
  currentSeconds: number;
  onSave: (totalSeconds: number) => void;
  onClose: () => void;
}

export function TimeEditModal({ visible, currentSeconds, onSave, onClose }: Props) {
  if (!visible) {
    return null;
  }

  return (
    <TimeEditForm
      currentSeconds={currentSeconds}
      onClose={onClose}
      onSave={onSave}
    />
  );
}

function TimeEditForm({
  currentSeconds,
  onSave,
  onClose,
}: Omit<Props, 'visible'>) {
  const isDark = useColorScheme() === 'dark';

  const initH = Math.floor(currentSeconds / 3600);
  const initM = Math.floor((currentSeconds % 3600) / 60);
  const initS = currentSeconds % 60;

  const [hours, setHours] = useState(initH.toString());
  const [minutes, setMinutes] = useState(initM.toString());
  const [seconds, setSeconds] = useState(initS.toString());

  const bg = isDark ? '#1C1C1E' : '#FFFFFF';
  const inputBg = isDark ? '#2C2C2E' : '#F2F2F7';
  const textClr = isDark ? '#FFF' : '#000';

  const handleSave = () => {
    const h = parseInt(hours, 10) || 0;
    const m = parseInt(minutes, 10) || 0;
    const s = parseInt(seconds, 10) || 0;
    const total = Math.max(0, h * 3600 + m * 60 + s);
    onSave(total);
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: bg }]}>
          <ThemedText type="defaultSemiBold" style={{ fontSize: 18, textAlign: 'center', marginBottom: 8 }}>
            Edit Workout Duration
          </ThemedText>
          <ThemedText style={{ color: '#8E8E93', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>
            Adjust the elapsed time for this workout session.
          </ThemedText>

          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: textClr }]}
                keyboardType="number-pad"
                value={hours}
                onChangeText={setHours}
                maxLength={2}
                selectTextOnFocus
              />
              <ThemedText style={styles.inputLabel}>hr</ThemedText>
            </View>

            <ThemedText style={styles.colon}>:</ThemedText>

            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: textClr }]}
                keyboardType="number-pad"
                value={minutes}
                onChangeText={setMinutes}
                maxLength={2}
                selectTextOnFocus
              />
              <ThemedText style={styles.inputLabel}>min</ThemedText>
            </View>

            <ThemedText style={styles.colon}>:</ThemedText>

            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, color: textClr }]}
                keyboardType="number-pad"
                value={seconds}
                onChangeText={setSeconds}
                maxLength={2}
                selectTextOnFocus
              />
              <ThemedText style={styles.inputLabel}>sec</ThemedText>
            </View>
          </View>

          <View style={styles.btnRow}>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <ThemedText style={{ color: '#FF3B30', fontWeight: '600', fontSize: 16 }}>Cancel</ThemedText>
            </Pressable>
            <Pressable style={styles.saveBtn} onPress={handleSave}>
              <ThemedText style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Save</ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: {
    width: '100%', borderRadius: 24, padding: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10,
  },
  inputRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 28, gap: 8 },
  inputGroup: { alignItems: 'center' },
  input: {
    width: 64, height: 64, borderRadius: 16, textAlign: 'center',
    fontSize: 28, fontWeight: 'bold', fontVariant: ['tabular-nums'],
  },
  inputLabel: { color: '#8E8E93', fontSize: 12, fontWeight: '600', marginTop: 6 },
  colon: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  btnRow: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, paddingVertical: 16, borderRadius: 16,
    backgroundColor: 'rgba(255,59,48,0.1)', alignItems: 'center',
  },
  saveBtn: {
    flex: 1, paddingVertical: 16, borderRadius: 16,
    backgroundColor: '#007AFF', alignItems: 'center',
  },
});
