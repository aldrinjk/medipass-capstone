import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionTitle?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionTitle,
  onAction,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionTitle && onAction ? (
        <Button
          title={actionTitle}
          onPress={onAction}
          variant="outline"
          size="sm"
          style={styles.action}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  action: {
    marginTop: 4,
  },
});
