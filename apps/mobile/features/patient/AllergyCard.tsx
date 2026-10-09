import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Allergy } from '../../types/clinical';
import { Card, Button } from '../../components';

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
  const severity = allergy.severity?.toUpperCase();

  const getSeverityStyles = (value?: string) => {
    switch (value) {
      case 'SEVERE':
        return {
          badge: styles.severeBadge,
          text: styles.severeText,
        };
      case 'MODERATE':
        return {
          badge: styles.moderateBadge,
          text: styles.moderateText,
        };
      case 'MILD':
      default:
        return {
          badge: styles.mildBadge,
          text: styles.mildText,
        };
    }
  };

  const severityStyles = getSeverityStyles(severity);

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.substance}>{allergy.substance}</Text>
        {severity ? (
          <View style={[styles.severityBadge, severityStyles.badge]}>
            <Text style={[styles.severityText, severityStyles.text]}>
              {severity}
            </Text>
          </View>
        ) : null}
      </View>

      {allergy.reaction ? (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Reaction:</Text>
          <Text style={styles.detailValue}>{allergy.reaction}</Text>
        </View>
      ) : null}

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
    flex: 1,
    paddingRight: 12,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  severityText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  mildBadge: {
    backgroundColor: '#DCFCE7',
  },
  mildText: {
    color: '#166534',
  },
  moderateBadge: {
    backgroundColor: '#FEF3C7',
  },
  moderateText: {
    color: '#92400E',
  },
  severeBadge: {
    backgroundColor: '#FEE2E2',
  },
  severeText: {
    color: '#B91C1C',
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
