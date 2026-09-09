import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Allergy } from '../../types/clinical';
import { Card, Badge, Button } from '../../components';

interface AllergyCardProps {
  allergy: Allergy;
  onEdit: (allergy: Allergy) => void;
  onDelete: (id: string) => void;
}

export const AllergyCard: React.FC<AllergyCardProps> = ({
  allergy,
  onEdit,
  onDelete,
}) => {
  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'SEVERE':
        return 'danger';
      case 'MODERATE':
        return 'warning';
      case 'MILD':
      default:
        return 'info';
    }
  };

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.substance}>{allergy.substance}</Text>
        <Badge
          label={allergy.severity}
          variant={getSeverityVariant(allergy.severity)}
        />
      </View>

      {allergy.reaction ? (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Reaction:</Text>
          <Text style={styles.detailValue}>{allergy.reaction}</Text>
        </View>
      ) : null}

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Status:</Text>
        <Text style={styles.statusValue}>{allergy.status}</Text>
      </View>

      <View style={styles.actions}>
        <Button
          title="Edit"
          variant="outline"
          size="sm"
          onPress={() => onEdit(allergy)}
          style={styles.actionBtn}
        />
        <Button
          title="Delete"
          variant="danger"
          size="sm"
          onPress={() => onDelete(allergy.id)}
          style={styles.actionBtn}
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  substance: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  detailRow: {
    flexDirection: 'row',
    marginVertical: 3,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  statusValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  actionBtn: {
    minWidth: 70,
  },
});
