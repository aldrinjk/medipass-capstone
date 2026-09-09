import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Medication } from '../../types/clinical';
import { Card, Badge, Button } from '../../components';

interface MedicationCardProps {
  medication: Medication;
  onEdit: (medication: Medication) => void;
  onDelete: (id: string) => void;
}

export const MedicationCard: React.FC<MedicationCardProps> = ({
  medication,
  onEdit,
  onDelete,
}) => {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'COMPLETED':
        return 'info';
      case 'DISCONTINUED':
      default:
        return 'neutral';
    }
  };

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.name}>{medication.name}</Text>
        <Badge
          label={medication.status}
          variant={getStatusVariant(medication.status)}
        />
      </View>

      {medication.dosage ? (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Dosage:</Text>
          <Text style={styles.detailValue}>{medication.dosage}</Text>
        </View>
      ) : null}

      {medication.frequency ? (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Frequency:</Text>
          <Text style={styles.detailValue}>{medication.frequency}</Text>
        </View>
      ) : null}

      {medication.route ? (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Route:</Text>
          <Text style={styles.detailValue}>{medication.route}</Text>
        </View>
      ) : null}

      {medication.instructions ? (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Instructions:</Text>
          <Text style={styles.detailValue}>{medication.instructions}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          title="Edit"
          variant="outline"
          size="sm"
          onPress={() => onEdit(medication)}
          style={styles.actionBtn}
        />
        <Button
          title="Delete"
          variant="danger"
          size="sm"
          onPress={() => onDelete(medication.id)}
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
  name: {
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
    width: 90,
  },
  detailValue: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
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
