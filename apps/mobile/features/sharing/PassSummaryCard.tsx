import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PassSummary } from '../../types/pass';
import { Card, Badge, Button } from '../../components';

interface PassSummaryCardProps {
  pass: PassSummary;
  onRevoke: (passId: string) => void;
  onViewLogs: (passId: string) => void;
  isRevoking?: boolean;
}

export const PassSummaryCard: React.FC<PassSummaryCardProps> = ({
  pass,
  onRevoke,
  onViewLogs,
  isRevoking = false,
}) => {
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'EXPIRED':
        return 'warning';
      case 'REVOKED':
      default:
        return 'danger';
    }
  };

  const formattedExpiry = new Date(pass.expiresAt).toLocaleString();
  const isActive = pass.status === 'ACTIVE';

  return (
    <Card>
      <View style={styles.header}>
        <View>
          <Text style={styles.passIdLabel}>Pass Identifier</Text>
          <Text style={styles.passId}>{pass.passId}</Text>
        </View>
        <Badge label={pass.status} variant={getBadgeVariant(pass.status)} />
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.label}>Expires:</Text>
        <Text style={styles.value}>{formattedExpiry}</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.label}>Categories:</Text>
        <Text style={styles.categoriesText}>
          {pass.categories.join(', ')}
        </Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.label}>Public URL:</Text>
        <Text style={styles.urlText} numberOfLines={1} ellipsizeMode="middle">
          {pass.publicUrl}
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          title="Access Log"
          variant="outline"
          size="sm"
          onPress={() => onViewLogs(pass.passId)}
          style={styles.actionBtn}
        />
        {isActive && (
          <Button
            title="Revoke Pass"
            variant="danger"
            size="sm"
            onPress={() => onRevoke(pass.passId)}
            isLoading={isRevoking}
            style={styles.actionBtn}
          />
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  passIdLabel: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  passId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  detailRow: {
    flexDirection: 'row',
    marginVertical: 3,
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    width: 85,
  },
  value: {
    fontSize: 13,
    color: '#1F2937',
    flex: 1,
  },
  categoriesText: {
    fontSize: 13,
    color: '#1F2937',
    flex: 1,
    fontWeight: '500',
  },
  urlText: {
    fontSize: 12,
    color: '#2563EB',
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
    minWidth: 90,
  },
});
