import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { usePatientProfile } from '../../hooks/usePatientProfile';
import { useAllergies } from '../../hooks/useAllergies';
import { useMedications } from '../../hooks/useMedications';
import { useConditions } from '../../hooks/useConditions';
import { useEmergencyContact } from '../../hooks/useEmergencyContact';
import { usePasses } from '../../hooks/usePasses';
import { patientService } from '../../services/patientService';
import { CompletenessCard } from '../../features/patient/CompletenessCard';
import { Card, Badge, Button, LoadingSpinner } from '../../components';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { profile, isLoading: isProfileLoading, loadProfile } = usePatientProfile();
  const { allergies, loadAllergies } = useAllergies();
  const { medications, loadMedications } = useMedications();
  const { conditions, loadConditions } = useConditions();
  const { contact, loadEmergencyContact } = useEmergencyContact();
  const { passes, loadPasses } = usePasses();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadProfile(),
      loadAllergies(),
      loadMedications(),
      loadConditions(),
      loadEmergencyContact(),
      loadPasses(),
    ]);
    setRefreshing(false);
  };

  const completeness = patientService.calculateCompleteness(
    profile,
    allergies.length,
    medications.length,
    conditions.length,
    Boolean(contact?.name && contact?.phoneNumber)
  );

  const activePasses = passes.filter((p) => p.status === 'ACTIVE');

  if (isProfileLoading && !refreshing) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  const patientName = profile
    ? `${profile.firstName} ${profile.lastName}`
    : user?.email || 'Patient';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E40AF']} />
      }
    >
      {/* Welcome & Patient Header */}
      <View style={styles.welcomeSection}>
        <View>
          <Text style={styles.welcomeSub}>Welcome back,</Text>
          <Text style={styles.welcomeName}>{patientName}</Text>
        </View>
        <Button
          title="Sign Out"
          variant="outline"
          size="sm"
          onPress={logout}
          style={styles.logoutBtn}
        />
      </View>

      {/* Emergency Readiness / Completeness */}
      <CompletenessCard
        completeness={completeness}
        onNavigateToCategory={(cat) => router.push(`/(app)/profile/${cat}` as any)}
      />

      {/* Emergency Pass Quick Status */}
      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Emergency Passes</Text>
          <Badge
            label={`${activePasses.length} Active`}
            variant={activePasses.length > 0 ? 'success' : 'neutral'}
          />
        </View>
        <Text style={styles.cardSubtitle}>
          {activePasses.length > 0
            ? 'You have an active emergency pass accessible to responders.'
            : 'No active pass currently deployed. Generate one when needed.'}
        </Text>
        <Button
          title="View & Manage Passes"
          variant="primary"
          size="sm"
          onPress={() => router.push('/(app)/passes')}
          style={styles.cardAction}
        />
      </Card>

      {/* Profile Snapshot Stats Grid */}
      <View style={styles.statsGrid}>
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => router.push('/(app)/profile/allergies')}
          accessibilityRole="button"
        >
          <Text style={styles.statNumber}>{allergies.length}</Text>
          <Text style={styles.statLabel}>Allergies</Text>
          <Text style={styles.statHint}>View list ›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() => router.push('/(app)/profile/medications')}
          accessibilityRole="button"
        >
          <Text style={styles.statNumber}>{medications.length}</Text>
          <Text style={styles.statLabel}>Medications</Text>
          <Text style={styles.statHint}>View list ›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() => router.push('/(app)/profile/conditions')}
          accessibilityRole="button"
        >
          <Text style={styles.statNumber}>{conditions.length}</Text>
          <Text style={styles.statLabel}>Conditions</Text>
          <Text style={styles.statHint}>View list ›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() => router.push('/(app)/profile/emergency-contact')}
          accessibilityRole="button"
        >
          <Text style={styles.statNumber}>{contact?.name ? '1' : '0'}</Text>
          <Text style={styles.statLabel}>Emergency Contact</Text>
          <Text style={styles.statHint}>{contact?.name ? 'Configured ›' : 'Add contact ›'}</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Sharing Preferences Shortcut */}
      <Card>
        <Text style={styles.cardTitle}>Sharing Preferences</Text>
        <Text style={styles.cardSubtitle}>
          Control which categories of your health data are exposed on emergency passes.
        </Text>
        <Button
          title="Configure Sharing Preferences"
          variant="outline"
          size="sm"
          onPress={() => router.push('/(app)/sharing')}
          style={styles.cardAction}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  welcomeSub: {
    fontSize: 14,
    color: '#6B7280',
  },
  welcomeName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  logoutBtn: {
    minHeight: 36,
    paddingHorizontal: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
    marginVertical: 4,
  },
  cardAction: {
    marginTop: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginVertical: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E40AF',
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 2,
  },
  statHint: {
    fontSize: 12,
    color: '#2563EB',
    marginTop: 6,
  },
});
