import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AccessLogResponse } from '../../types/pass';
import { Card, Badge, EmptyState, Button } from '../../components';

interface AccessHistoryListProps {
  logs: AccessLogResponse[];
  passId: string;
  onViewDetails?: (logId: string) => void;
}

export const AccessHistoryList: React.FC<AccessHistoryListProps> = ({
  logs,
  passId,
  onViewDetails,
}) => {
  if (logs.length === 0) {
    return (
      <EmptyState
        title="No Access Records"
        description={`No emergency responders have accessed pass ${passId} yet.`}
      />
    );
  }

  const getStatusVariant = (outcome: string) => {
    switch (outcome) {
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
              {new Date(log.accessedAt).toLocaleString()}
            </Text>
            <Badge label={log.outcome} variant={getStatusVariant(log.outcome)} />
          </View>
          {log.responderName ? (
            <Text style={styles.responderText}>
              {log.responderName}
              {log.responderRole ? ` · ${log.responderRole}` : ''}
              {log.responderOrganization ? ` · ${log.responderOrganization}` : ''}
            </Text>
          ) : null}
          {log.verificationMethod ? (
            <Text style={styles.verificationText}>
              {log.verificationMethod === 'PHONE_OTP'
                ? `PHONE VERIFIED${log.responderPhoneLast4 ? ` · ••••${log.responderPhoneLast4}` : ''}`
                : log.verificationMethod === 'EMERGENCY_OVERRIDE'
                  ? 'UNVERIFIED EMERGENCY OVERRIDE'
                  : log.verificationMethod.replaceAll('_', ' ')}
            </Text>
          ) : null}
          <Text style={styles.deviceText}>
            {log.responderDevice || 'Responder device unavailable'}
          </Text>
          {log.traceCode ? (
            <Text style={styles.traceText}>Trace {log.traceCode}</Text>
          ) : null}
          <Text style={styles.logId}>Record {log.id}</Text>
          {onViewDetails ? (
            <Button
              title="View details"
              variant="outline"
              size="sm"
              onPress={() => onViewDetails(log.id)}
              style={styles.detailsButton}
            />
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
  responderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  verificationText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E40AF',
    marginBottom: 3,
  },
  deviceText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  traceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 4,
  },
  logId: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 8,
  },
  detailsButton: {
    alignSelf: 'flex-start',
  },
});
