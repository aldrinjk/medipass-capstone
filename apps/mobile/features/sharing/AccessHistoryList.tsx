import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PassAuditLog } from '../../types/pass';
import { Card, Badge, EmptyState } from '../../components';

interface AccessHistoryListProps {
  logs: PassAuditLog[];
  passId: string;
}

export const AccessHistoryList: React.FC<AccessHistoryListProps> = ({ logs, passId }) => {
  if (logs.length === 0) {
    return (
      <EmptyState
        title="No Access Records"
        description={`No emergency responders have accessed pass ${passId} yet.`}
      />
    );
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'success';
      case 'EXPIRED':
        return 'warning';
      case 'REVOKED':
      case 'INVALID':
      default:
        return 'danger';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Access Audit Log ({passId})</Text>
      {logs.map((log, index) => (
        <Card key={log.id || `log-${index}`}>
          <View style={styles.logHeader}>
            <Text style={styles.timestamp}>
              {new Date(log.timestamp).toLocaleString()}
            </Text>
            <Badge label={log.accessStatus} variant={getStatusVariant(log.accessStatus)} />
          </View>

          {log.ipAddressTruncated ? (
            <View style={styles.row}>
              <Text style={styles.label}>Origin IP:</Text>
              <Text style={styles.value}>{log.ipAddressTruncated}</Text>
            </View>
          ) : null}

          {log.userAgent ? (
            <View style={styles.row}>
              <Text style={styles.label}>Client Agent:</Text>
              <Text style={styles.value}>{log.userAgent}</Text>
            </View>
          ) : null}
        </Card>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timestamp: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  row: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    width: 80,
  },
  value: {
    fontSize: 12,
    color: '#1F2937',
    flex: 1,
  },
});
