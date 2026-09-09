import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Condition } from '../../types/clinical';
import { Card, Badge, Button } from '../../components';

interface ConditionCardProps {
  condition: Condition;
  onEdit: (condition: Condition) => void;
  onDelete: (id: string) => void;
}

export const ConditionCard: React.FC<ConditionCardProps> = ({
  condition,
  onEdit,
  onDelete,
}) => {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'RECURRENCE':
      case 'RELAPSE':
        return 'danger';
      case 'REMISSION':
      case 'INACTIVE':
        return 'warning';
      case 'RESOLVED':
      default:
        return 'success';
    }
  };

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.name}>{condition.conditionName}</Text>
        <Badge
          label={condition.clinicalStatus}
          variant={getStatusVariant(condition.clinicalStatus)}
        />
      </View>

      {condition.onsetDate ? (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Onset Date:</Text>
          <Text style={styles.detailValue}>{condition.onsetDate}</Text>
        </View>
      ) : null}

      {condition.notes ? (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Notes:</Text>
          <Text style={styles.detailValue}>{condition.notes}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          title="Edit"
          variant="outline"
          size="sm"
          onPress={() => onEdit(condition)}
          style={styles.actionBtn}
        />
        <Button
          title="Delete"
          variant="danger"
          size="sm"
          onPress={() => onDelete(condition.id)}
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
