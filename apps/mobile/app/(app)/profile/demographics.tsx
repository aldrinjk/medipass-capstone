import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { usePatientProfile } from '../../../hooks/usePatientProfile';
import { DemographicsForm } from '../../../features/patient/DemographicsForm';
import { DemographicsFormData } from '../../../types/validation';
import { LoadingSpinner, ErrorBanner } from '../../../components';

export default function DemographicsScreen() {
  const router = useRouter();
  const { profile, isLoading, error, updateProfile } = usePatientProfile();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: DemographicsFormData): Promise<boolean> => {
    setIsSubmitting(true);
    setSuccessMessage(null);
    try {
      const success = await updateProfile({
        fullName: data.fullName,
        birthDate: data.birthDate || null,
        gender: data.gender || null,
        phone: data.phone || null,
      });
      if (success) {
        setSuccessMessage('Patient demographics updated successfully');
      }
      return success;
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !profile) {
    return <LoadingSpinner message="Loading patient demographics..." />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Demographics</Text>
      <Text style={styles.pageSubtitle}>
        First responders verify your identity from your full name, birth date, gender, and phone
        number.
      </Text>

      {error ? <ErrorBanner message={error} /> : null}

      {successMessage ? (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>✓ {successMessage}</Text>
        </View>
      ) : null}

      <DemographicsForm
        initialData={profile}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
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
  successBanner: {
    backgroundColor: '#DEF7EC',
    borderColor: '#31C48D',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  successText: {
    color: '#03543F',
    fontWeight: '600',
    fontSize: 14,
  },
});
