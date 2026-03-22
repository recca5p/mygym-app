import { StyleSheet, View, Pressable, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function DashboardScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  
  const themeStyles = {
    cardBackground: isDark ? '#1C1C1E' : '#FFFFFF',
    textPrimary: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#8E8E93' : '#6B7280',
    accentColor: '#007AFF', // A primary action blue
    successColor: '#34C759',
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F2F2F7' }]}>
      {/* Header Section */}
      <View style={styles.header}>
        <View>
          <ThemedText type="subtitle" style={{ color: themeStyles.textSecondary }}>Sunday, Mar 22</ThemedText>
          <ThemedText type="title">Hello, Athlete!</ThemedText>
        </View>
        <Pressable style={styles.profileButton}>
          <Ionicons name="person-circle" size={44} color={themeStyles.accentColor} />
        </Pressable>
      </View>

      {/* Daily Summary Metrics */}
      <View style={styles.metricsContainer}>
        <View style={[styles.metricCard, { backgroundColor: themeStyles.cardBackground }]}>
          <View style={styles.metricHeader}>
            <Ionicons name="flame" size={20} color="#FF9500" />
            <ThemedText type="defaultSemiBold">Calories</ThemedText>
          </View>
          <ThemedText type="title" style={styles.metricValue}>1,200</ThemedText>
          <ThemedText style={{ color: themeStyles.textSecondary, fontSize: 13 }}>/ 2,500 kcal target</ThemedText>
        </View>

        <View style={[styles.metricCard, { backgroundColor: themeStyles.cardBackground }]}>
          <View style={styles.metricHeader}>
            <Ionicons name="barbell" size={20} color={themeStyles.accentColor} />
            <ThemedText type="defaultSemiBold">Workouts</ThemedText>
          </View>
          <ThemedText type="title" style={styles.metricValue}>3</ThemedText>
          <ThemedText style={{ color: themeStyles.textSecondary, fontSize: 13 }}>Completed this week</ThemedText>
        </View>
      </View>

      {/* Quick Action */}
      <Pressable style={styles.primaryActionBtn}>
        <Ionicons name="add-circle" size={24} color="#FFFFFF" />
        <ThemedText style={styles.primaryActionText}>Start Empty Workout</ThemedText>
      </Pressable>

      {/* Recent Activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle">Recent Activity</ThemedText>
          <Pressable><ThemedText style={{ color: themeStyles.accentColor, fontWeight: '600' }}>See All</ThemedText></Pressable>
        </View>

        {/* Mock Activity 1 */}
        <View style={[styles.activityCard, { backgroundColor: themeStyles.cardBackground }]}>
          <View style={[styles.activityIcon, { backgroundColor: 'rgba(52, 199, 89, 0.15)' }]}>
             <Ionicons name="fitness" size={24} color={themeStyles.successColor} />
          </View>
          <View style={styles.activityDetails}>
            <ThemedText type="defaultSemiBold">Pull Day (Back & Biceps)</ThemedText>
            <ThemedText style={{ color: themeStyles.textSecondary, fontSize: 14, marginTop: 2 }}>Yesterday • 1h 15m • 12,000kg</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={themeStyles.textSecondary} />
        </View>

        {/* Mock Activity 2 */}
        <View style={[styles.activityCard, { backgroundColor: themeStyles.cardBackground }]}>
          <View style={[styles.activityIcon, { backgroundColor: 'rgba(255, 149, 0, 0.15)' }]}>
             <Ionicons name="walk" size={24} color="#FF9500" />
          </View>
          <View style={styles.activityDetails}>
            <ThemedText type="defaultSemiBold">Morning Run</ThemedText>
            <ThemedText style={{ color: themeStyles.textSecondary, fontSize: 14, marginTop: 2 }}>Friday • 5.2 km • 32m</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={themeStyles.textSecondary} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 80, // Giving extra room for iOS notch
    paddingBottom: 24,
  },
  profileButton: {
    padding: 4,
  },
  metricsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 32,
  },
  metricCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  metricValue: {
    fontSize: 32,
    lineHeight: 36,
    marginBottom: 4,
  },
  primaryActionBtn: {
    backgroundColor: '#007AFF',
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
    marginBottom: 40,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  activityIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  activityDetails: {
    flex: 1,
  },
});
