import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { ShareCategory, SHARE_CATEGORY_LABELS } from '../types/sharing';

interface CategoryToggleProps {
  category: ShareCategory;
  isEnabled: boolean;
  onToggle: (category: ShareCategory) => void;
  disabled?: boolean;
}

export const CategoryToggle: React.FC<CategoryToggleProps> = ({
  category,
  isEnabled,
  onToggle,
  disabled = false,
}) => {
  const metadata = SHARE_CATEGORY_LABELS[category];

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.label}>{metadata.label}</Text>
        <Text style={styles.description}>{metadata.description}</Text>
      </View>
      <Switch
        value={isEnabled}
        onValueChange={() => onToggle(category)}
        disabled={disabled}
        trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
        thumbColor={isEnabled ? '#1E40AF' : '#F3F4F6'}
        accessibilityRole="switch"
        accessibilityLabel={`Share ${metadata.label}`}
        accessibilityState={{ checked: isEnabled }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  textContainer: {
    flex: 1,
    paddingRight: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
});
