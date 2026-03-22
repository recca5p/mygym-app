import { Text, View, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useGymContext } from '@/src/store/GymContext';
import { ThemedText } from '@/components/themed-text';

const ICONS = ['🏋️', '💪', '🏃', '🚴', '🥊', '🧗', '🏊', '🤸'];

export default function OnboardingScreen() {
  const router = useRouter();
  const isDark = (useColorScheme() ?? 'light') === 'dark';
  const { createGym, needsOnboarding } = useGymContext();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🏋️');
  const [loading, setLoading] = useState(false);

  // If they somehow land here but don't need onboarding, send them home
  useEffect(() => {
    if (!needsOnboarding && !loading) {
      router.replace('/(tabs)');
    }
  }, [needsOnboarding, loading, router]);

  if (!needsOnboarding) {
    return null;
  }

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await createGym(name.trim(), icon);
    router.replace('/(tabs)');
  };

  const bg = isDark ? '#000' : '#F2F2F7';
  const textClr = isDark ? '#FFF' : '#000';
  const inputBg = isDark ? '#1C1C1E' : '#FFF';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboard}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Ionicons name="barbell" size={64} color="#007AFF" />
            <ThemedText style={styles.title}>Welcome to MyGym</ThemedText>
            <ThemedText style={styles.subtitle}>Where are you working out?</ThemedText>
          </View>

          <View style={styles.form}>
            <ThemedText style={styles.label}>Select an Icon</ThemedText>
            <View style={styles.iconRow}>
              {ICONS.map(i => (
                <Pressable
                  key={i}
                  style={[styles.iconBtn, icon === i && styles.iconBtnActive, { backgroundColor: inputBg }]}
                  onPress={() => setIcon(i)}
                >
                  <Text style={styles.emoji}>{i}</Text>
                </Pressable>
              ))}
            </View>

            <ThemedText style={styles.label}>Gym Name</ThemedText>
            <TextInput
              style={[styles.input, { color: textClr, backgroundColor: inputBg }]}
              placeholder="e.g. Planet Fitness, Home Garage..."
              placeholderTextColor="#8E8E93"
              value={name}
              onChangeText={setName}
              autoFocus
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable
            style={[styles.btn, !name.trim() && styles.btnDisabled]}
            disabled={!name.trim() || loading}
            onPress={handleCreate}
          >
            <ThemedText style={styles.btnText}>
              {loading ? 'Creating...' : 'Get Started'}
            </ThemedText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboard: { flex: 1 },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 28, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#8E8E93' },
  form: { width: '100%' },
  label: { fontSize: 14, fontWeight: '600', color: '#8E8E93', textTransform: 'uppercase', marginBottom: 12 },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
  iconBtn: {
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  iconBtnActive: { borderWidth: 3, borderColor: '#007AFF' },
  emoji: { fontSize: 24 },
  input: {
    padding: 18, borderRadius: 16, fontSize: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  footer: { padding: 24, paddingBottom: Platform.OS === 'ios' ? 0 : 24 },
  btn: {
    backgroundColor: '#007AFF', padding: 20, borderRadius: 16,
    alignItems: 'center', shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnDisabled: { backgroundColor: '#8E8E93', shadowOpacity: 0 },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});
