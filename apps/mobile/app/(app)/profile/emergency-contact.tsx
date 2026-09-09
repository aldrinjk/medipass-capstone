import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEmergencyContact } from '../../../hooks/useEmergencyContact';
import { EmergencyContactForm } from '../../../features/patient/EmergencyContactForm';
import { EmergencyContactFormData } from '../../../types/validation';
import { LoadingSpinner, ErrorBanner } from '../../../components';

export default function EmergencyContactScreen() {
  const { contact, isLoading, error, updateEmergencyContact } = useEmergencyContact();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: EmergencyContactFormData): Promise<boolean> => {
    setIsSubmitting(true);
    setSuccessMessage(null);
    try {
      const success = await updateEmergencyContact({
        name: data.name,
        relationship: data.relationship,
        phoneNumber: data.phoneNumber,
        alternatePhone: data.alternatePhone || undefined,
        email: data.email || undefined,
      });
      if (success) {
        setSuccessMessage('Emergency contact saved successfully');
      }
      return success;
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !contact) {
    return <LoadingSpinner message="Loading emergency contact..." />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Primary Emergency Contact</Text>
      <Text style={styles.pageSubtitle}>
        First responders and ER clinicians will attempt to contact this person first in the event
        of an incapacitating emergency.
      </Text>

      {error ? <ErrorBanner message={error} /> : null}

      {successMessage ? (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>✓ {successMessage}</Text>
        </View>
      ) : null}

      <EmergencyContactForm
        initialData={contact}
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
