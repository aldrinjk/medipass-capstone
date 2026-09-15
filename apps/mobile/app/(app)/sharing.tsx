import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSharingPreferences } from '../../hooks/useSharingPreferences';
import { SharingPreferencesForm } from '../../features/sharing/SharingPreferencesForm';
import { LoadingSpinner, ErrorBanner } from '../../components';

export default function SharingScreen() {
  const {
    categories,
    isLoading,
    isSaving,
    error,
    successMessage,
    toggleCategory,
    savePreferences,
  } = useSharingPreferences();

  if (isLoading) {
    return <LoadingSpinner message="Loading sharing preferences..." />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Emergency Sharing Policy</Text>
      <Text style={styles.pageSubtitle}>
        These settings dictate what information emergency responders are authorized to see when
        scanning any pass generated from your MediPass passport.
      </Text>

      {error ? <ErrorBanner message={error} /> : null}

      {successMessage ? (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>✓ {successMessage}</Text>
        </View>
      ) : null}

      <SharingPreferencesForm
        categories={categories}
        onToggleCategory={toggleCategory}
        onSave={() => savePreferences()}
        isSaving={isSaving}
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
