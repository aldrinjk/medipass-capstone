import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { usePatientProfile } from '../../../hooks/usePatientProfile';
import { useAllergies } from '../../../hooks/useAllergies';
import { useMedications } from '../../../hooks/useMedications';
import { useConditions } from '../../../hooks/useConditions';
import { useEmergencyContact } from '../../../hooks/useEmergencyContact';
import { Card, LoadingSpinner } from '../../../components';

export default function ProfileIndexScreen() {
  const router = useRouter();
  const { profile, isLoading } = usePatientProfile();
  const { allergies } = useAllergies();
  const { medications } = useMedications();
  const { conditions } = useConditions();
  const { contact } = useEmergencyContact();

  if (isLoading) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  const sections = [
    {
      id: 'demographics',
      title: 'Demographics',
      subtitle: profile?.fullName
        ? `${profile.fullName} • Birth date: ${profile.birthDate || 'Not set'}`
        : 'Full name, birth date, gender, and phone',
      route: '/(app)/profile/demographics',
      count: profile?.fullName ? 'Configured' : 'Incomplete',
    },
    {
      id: 'allergies',
      title: 'Allergies & Reactions',
      subtitle: 'Critical drug & food allergies, severity levels',
      route: '/(app)/profile/allergies',
      count: `${allergies.length} recorded`,
    },
    {
      id: 'medications',
      title: 'Medications',
      subtitle: 'Current medications, dosage, and frequency',
      route: '/(app)/profile/medications',
      count: `${medications.length} active`,
    },
    {
      id: 'conditions',
      title: 'Medical Conditions',
      subtitle: 'Diagnoses, status, and clinical notes',
      route: '/(app)/profile/conditions',
      count: `${conditions.length} recorded`,
    },
    {
      id: 'emergency-contact',
      title: 'Emergency Contact',
      subtitle: 'Next-of-kin or designated emergency proxy',
      route: '/(app)/profile/emergency-contact',
      count: contact?.name ? contact.name : 'Missing',
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Clinical Emergency Record</Text>
      <Text style={styles.pageSubtitle}>
        Manage the health data stored in your MediPass. Keep demographics, allergies,
        medications, conditions, and emergency contact details up to date.
      </Text>

      {sections.map((sec) => (
        <TouchableOpacity
          key={sec.id}
          onPress={() => router.push(sec.route as any)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${sec.title}, ${sec.count}`}
        >
          <Card style={styles.menuCard}>
            <View style={styles.cardLeft}>
              <Text style={styles.cardTitle}>{sec.title}</Text>
              <Text style={styles.cardSubtitle}>{sec.subtitle}</Text>
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.countText}>{sec.count}</Text>
              <Text style={styles.arrow}>›</Text>
            </View>
          </Card>
        </TouchableOpacity>
      ))}
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
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginTop: 4,
    marginBottom: 16,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  cardLeft: {
    flex: 1,
    paddingRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  arrow: {
    fontSize: 20,
    color: '#9CA3AF',
  },
});
