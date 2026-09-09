import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CategoryCompleteness } from '../../types/patient';
import { Card, ProgressBar } from '../../components';

interface CompletenessCardProps {
  completeness: CategoryCompleteness;
  onNavigateToCategory: (category: string) => void;
}

export const CompletenessCard: React.FC<CompletenessCardProps> = ({
  completeness,
  onNavigateToCategory,
}) => {
  const items = [
    { key: 'demographics', label: 'Demographics & Blood Type', isComplete: completeness.demographics },
    { key: 'allergies', label: 'Allergies & Reactions', isComplete: completeness.allergies },
    { key: 'medications', label: 'Medications & Dosages', isComplete: completeness.medications },
    { key: 'conditions', label: 'Conditions & Diagnoses', isComplete: completeness.conditions },
    { key: 'emergency-contact', label: 'Emergency Contact', isComplete: completeness.emergencyContact },
  ];

  return (
    <Card>
      <Text style={styles.title}>Emergency Profile Readiness</Text>
      <ProgressBar percentage={completeness.overallPercentage} />

      <View style={styles.checklist}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={styles.checklistItem}
            onPress={() => onNavigateToCategory(item.key)}
            accessibilityRole="button"
            accessibilityLabel={`${item.label}: ${item.isComplete ? 'Complete' : 'Incomplete'}`}
          >
            <Text style={[styles.statusIcon, item.isComplete ? styles.completeIcon : styles.incompleteIcon]}>
              {item.isComplete ? '✓' : '○'}
            </Text>
            <Text style={[styles.itemText, item.isComplete && styles.itemTextComplete]}>
              {item.label}
            </Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  checklist: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  statusIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 28,
  },
  completeIcon: {
    color: '#10B981',
  },
  incompleteIcon: {
    color: '#9CA3AF',
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  itemTextComplete: {
    color: '#1F2937',
  },
  arrow: {
    fontSize: 18,
    color: '#9CA3AF',
  },
});
