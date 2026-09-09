import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShareCategory, ALL_SHARE_CATEGORIES } from '../../types/sharing';
import { CategoryToggle, Button, Card } from '../../components';

interface SharingPreferencesFormProps {
  categories: ShareCategory[];
  onToggleCategory: (category: ShareCategory) => void;
  onSave: () => Promise<boolean>;
  isSaving?: boolean;
}

export const SharingPreferencesForm: React.FC<SharingPreferencesFormProps> = ({
  categories,
  onToggleCategory,
  onSave,
  isSaving = false,
}) => {
  return (
    <Card>
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Patient Privacy & Control</Text>
        <Text style={styles.bannerText}>
          Select which categories of your emergency profile are disclosed when a first responder
          scans your MediPass. Only checked categories will be visible to emergency responders.
        </Text>
      </View>

      <View style={styles.toggleList}>
        {ALL_SHARE_CATEGORIES.map((category) => (
          <CategoryToggle
            key={category}
            category={category}
            isEnabled={categories.includes(category)}
            onToggle={onToggleCategory}
            disabled={isSaving}
          />
        ))}
      </View>

      <Button
        title="Save Sharing Preferences"
        onPress={onSave}
        isLoading={isSaving}
        style={styles.saveBtn}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 4,
  },
  bannerText: {
    fontSize: 13,
    color: '#1E3A8A',
    lineHeight: 18,
  },
  toggleList: {
    marginBottom: 16,
  },
  saveBtn: {
    marginTop: 8,
  },
});
