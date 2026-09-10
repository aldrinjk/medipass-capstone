import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CategoryToggleList } from '../components/CategoryToggleList';
import { ExpiryPicker } from '../components/ExpiryPicker';
import { useCreatePass } from '../hooks/useCreatePass';

export function PassCreateScreen() {
  const router = useRouter();
  const {
    selectedCategories,
    toggleCategory,
    expiryHours,
    setExpiryHours,
    submitting,
    error,
    submit,
    canSubmit,
  } = useCreatePass();

  const handleCreate = async () => {
    const response = await submit();
    if (response) {
      router.replace(`/(app)/passes/${response.passId}`);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>What should this pass share?</Text>
      <Text style={styles.sectionSubtitle}>
        Only the categories you choose here are visible to anyone who scans the QR code.
      </Text>
      <CategoryToggleList selected={selectedCategories} onToggle={toggleCategory} />

      <Text style={[styles.sectionTitle, styles.sectionSpacing]}>How long should it stay active?</Text>
      <ExpiryPicker selectedHours={expiryHours} onSelect={setExpiryHours} />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable
        onPress={handleCreate}
        disabled={!canSubmit}
        style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
        accessibilityRole="button"
        accessibilityLabel="Create emergency pass"
      >
        <Text style={styles.submitText}>{submitting ? 'Creating…' : 'Create pass'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0b1220',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#4b5565',
    marginBottom: 4,
  },
  sectionSpacing: {
    marginTop: 12,
  },
  errorText: {
    color: '#8a231c',
    marginTop: 8,
  },
  submitButton: {
    marginTop: 24,
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: '#0a4d8c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
});
