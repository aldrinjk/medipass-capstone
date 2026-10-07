import React, { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { usePasses } from '../../hooks/usePasses';
import { useSharingPreferences } from '../../hooks/useSharingPreferences';
import { PassSummaryCard } from '../../features/sharing/PassSummaryCard';
import { AccessHistoryList } from '../../features/sharing/AccessHistoryList';
import { Button, Card, LoadingSpinner, ErrorBanner, EmptyState } from '../../components';
import { AccessLogResponse } from '../../types/pass';

export default function PassesScreen() {
  const {
    passes,
    auditLogs,
    publicUrls,
    isLoading,
    error,
    loadPasses,
    createPass,
    revokePass,
    rotatePass,
    loadAuditLogs,
    loadAccessLogDetail,
  } = usePasses();
  const { categories, loadPreferences } = useSharingPreferences();

  const [selectedPassForLogs, setSelectedPassForLogs] = useState<string | null>(null);
  const [isCreatingPass, setIsCreatingPass] = useState(false);
  const [revokingPassId, setRevokingPassId] = useState<string | null>(null);
  const [rotatingPassId, setRotatingPassId] = useState<string | null>(null);
  const [selectedAccessLog, setSelectedAccessLog] = useState<AccessLogResponse | null>(null);
  const [loadingAccessLogId, setLoadingAccessLogId] = useState<string | null>(null);
  const [expiryHours, setExpiryHours] = useState<number>(24);
  const [actionError, setActionError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void loadPreferences();
    }, [loadPreferences])
  );

  const handleCreatePass = async () => {
    setActionError(null);

    const latestCategories = await loadPreferences();
    if (latestCategories === null) {
      setActionError(
        'Could not refresh your sharing preferences. Check your connection and try again.'
      );
      return;
    }

    if (latestCategories.length === 0) {
      setActionError(
        'You must configure at least one shareable category in Sharing Preferences before generating a pass.'
      );
      return;
    }

    setIsCreatingPass(true);
    try {
      const newPass = await createPass(latestCategories, expiryHours);
      if (!newPass) {
        setActionError('Failed to generate pass. Please try again.');
      }
    } finally {
      setIsCreatingPass(false);
    }
  };

  const handleRevokePass = async (passId: string) => {
    setActionError(null);
    setRevokingPassId(passId);
    try {
      const success = await revokePass(passId);
      if (!success) {
        setActionError('Failed to revoke pass. Please try again.');
      }
    } finally {
      setRevokingPassId(null);
    }
  };

  const confirmRevokePass = (passId: string) => {
    Alert.alert(
      'Revoke emergency pass?',
      'This immediately disables the current QR link.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: () => {
            void handleRevokePass(passId);
          },
        },
      ]
    );
  };

  const handleRotatePass = async (passId: string) => {
    setActionError(null);
    setRotatingPassId(passId);
    try {
      const rotated = await rotatePass(passId);
      if (!rotated) {
        setActionError('Failed to rotate pass link. Please try again.');
      }
    } finally {
      setRotatingPassId(null);
    }
  };

  const handleOpenLogs = async (passId: string) => {
    setSelectedAccessLog(null);
    setSelectedPassForLogs(passId);
    await loadAuditLogs(passId);
  };

  const handleViewAccessLog = async (logId: string) => {
    setLoadingAccessLogId(logId);
    setActionError(null);
    try {
      const detail = await loadAccessLogDetail(logId);
      if (detail) {
        setSelectedAccessLog(detail);
      } else {
        setActionError('Failed to load access-log details. Please try again.');
      }
    } finally {
      setLoadingAccessLogId(null);
    }
  };

  const closeAuditModal = () => {
    setSelectedAccessLog(null);
    setLoadingAccessLogId(null);
    setSelectedPassForLogs(null);
  };

  if (isLoading && passes.length === 0) {
    return <LoadingSpinner message="Loading emergency passes..." />;
  }

  const activePasses = passes.filter((p) => p.status === 'ACTIVE');
  const pastPasses = passes.filter((p) => p.status !== 'ACTIVE');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadPasses} />}
    >
      <Text style={styles.pageTitle}>Emergency Pass Manager</Text>
      <Text style={styles.pageSubtitle}>
        Generate time-limited emergency passes or revoke active passes. Each pass allows responders
        to view permitted information via their mobile browser.
      </Text>

      {error || actionError ? (
        <ErrorBanner
          message={error || actionError || ''}
          onDismiss={() => setActionError(null)}
        />
      ) : null}

      {/* Pass Generation Card */}
      <Card style={styles.createCard}>
        <Text style={styles.createTitle}>Generate Emergency Pass</Text>
        <Text style={styles.createDesc}>
          Uses your current sharing preferences ({categories.length} categories enabled).
        </Text>

        <View style={styles.durationSelector}>
          <Text style={styles.durationLabel}>Duration:</Text>
          {[12, 24, 48, 72].map((hours) => (
            <Button
              key={hours}
              title={`${hours}h`}
              size="sm"
              variant={expiryHours === hours ? 'primary' : 'outline'}
              onPress={() => setExpiryHours(hours)}
              style={styles.durationBtn}
            />
          ))}
        </View>

        <Button
          title="Create New Emergency Pass"
          onPress={handleCreatePass}
          isLoading={isCreatingPass}
          style={styles.generateBtn}
        />
      </Card>

      {/* Active Passes Section */}
      <Text style={styles.sectionHeader}>Active Passes ({activePasses.length})</Text>
      {activePasses.length === 0 ? (
        <EmptyState
          title="No Active Passes"
          description="You currently have no active emergency passes. Create one above when you travel or require active emergency coverage."
        />
      ) : (
        activePasses.map((pass) => (
          <PassSummaryCard
            key={pass.passId}
            pass={pass}
            publicUrl={publicUrls[pass.passId]}
            onRevoke={confirmRevokePass}
            onRotate={handleRotatePass}
            onViewLogs={handleOpenLogs}
            isRevoking={revokingPassId === pass.passId}
            isRotating={rotatingPassId === pass.passId}
          />
        ))
      )}

      {/* Past / Revoked / Expired Section */}
      {pastPasses.length > 0 && (
        <>
          <Text style={[styles.sectionHeader, styles.pastHeader]}>
            Past & Revoked Passes ({pastPasses.length})
          </Text>
          {pastPasses.map((pass) => (
            <PassSummaryCard
              key={pass.passId}
              pass={pass}
              publicUrl={publicUrls[pass.passId]}
              onRevoke={confirmRevokePass}
              onRotate={handleRotatePass}
              onViewLogs={handleOpenLogs}
              isRevoking={revokingPassId === pass.passId}
              isRotating={rotatingPassId === pass.passId}
            />
          ))}
        </>
      )}

      {/* Audit Logs Modal */}
      <Modal
        visible={!!selectedPassForLogs}
        animationType="slide"
        transparent={true}
        onRequestClose={closeAuditModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pass Access Audit</Text>
              <Button
                title="✕"
                variant="outline"
                size="sm"
                onPress={closeAuditModal}
                style={styles.modalCloseBtn}
              />
            </View>
            <ScrollView>
              {selectedAccessLog ? (
                <Card>
                  <Text style={styles.detailTitle}>Access record details</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Outcome</Text>
                    <Text style={styles.detailValue}>{selectedAccessLog.outcome}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Accessed</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedAccessLog.accessedAt).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Responder</Text>
                    <Text style={styles.detailValue}>
                      {selectedAccessLog.responderName ||
                        (selectedAccessLog.outcome === 'SUCCESS'
                          ? 'Unavailable for older access records'
                          : 'Not collected because access ended before responder verification')}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Role / organization</Text>
                    <Text style={styles.detailValue}>
                      {[
                        selectedAccessLog.responderRole,
                        selectedAccessLog.responderOrganization,
                      ].filter(Boolean).join(' · ') ||
                        (selectedAccessLog.outcome === 'SUCCESS'
                          ? 'Not provided'
                          : 'Not collected because access ended before responder verification')}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Verification</Text>
                    <Text style={styles.detailValue}>
                      {selectedAccessLog.verificationMethod === 'PHONE_OTP'
                        ? selectedAccessLog.verificationNote?.startsWith('Development OTP')
                          ? `Development OTP simulation${selectedAccessLog.responderPhoneLast4 ? ` · mobile ending ${selectedAccessLog.responderPhoneLast4}` : ''}. No SMS was sent. Name is self-declared.`
                          : `Phone verified${selectedAccessLog.responderPhoneLast4 ? ` · mobile ending ${selectedAccessLog.responderPhoneLast4}` : ''}. Name is self-declared.`
                        : selectedAccessLog.verificationMethod === 'EMERGENCY_OVERRIDE'
                          ? 'Unverified emergency override. Identity is self-declared.'
                          : selectedAccessLog.verificationMethod?.replaceAll('_', ' ') ||
                            (selectedAccessLog.outcome === 'SUCCESS'
                              ? 'Unavailable for older access records'
                              : 'Not applicable because access ended before verification')}
                    </Text>
                  </View>
                  {selectedAccessLog.verificationMethod === 'EMERGENCY_OVERRIDE' &&
                  selectedAccessLog.verificationNote ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Emergency reason</Text>
                      <Text style={styles.detailValue}>{selectedAccessLog.verificationNote}</Text>
                    </View>
                  ) : null}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Responder device</Text>
                    <Text style={styles.detailValue}>
                      {selectedAccessLog.responderDevice || 'Unavailable'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Trace code</Text>
                    <Text style={styles.detailValue}>
                      {selectedAccessLog.traceCode || 'Unavailable for older access records'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Pass ID</Text>
                    <Text style={styles.detailValue}>{selectedAccessLog.passId}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Record ID</Text>
                    <Text style={styles.detailValue}>{selectedAccessLog.id}</Text>
                  </View>
                  <Button
                    title="Back to access history"
                    variant="outline"
                    size="sm"
                    onPress={() => setSelectedAccessLog(null)}
                    style={styles.detailBackButton}
                  />
                </Card>
              ) : selectedPassForLogs ? (
                <>
                  {loadingAccessLogId ? (
                    <LoadingSpinner message="Loading access record..." />
                  ) : null}
                  <AccessHistoryList
                    logs={auditLogs[selectedPassForLogs] || []}
                    passId={selectedPassForLogs}
                    onViewDetails={handleViewAccessLog}
                  />
                </>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginTop: 4,
    marginBottom: 16,
  },
  createCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
    marginBottom: 16,
  },
  createTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E40AF',
  },
  createDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginVertical: 4,
  },
  durationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 12,
  },
  durationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginRight: 4,
  },
  durationBtn: {
    minHeight: 36,
    paddingHorizontal: 12,
  },
  generateBtn: {
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
    marginBottom: 8,
  },
  pastHeader: {
    marginTop: 24,
    color: '#6B7280',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalCloseBtn: {
    minHeight: 36,
    width: 36,
    borderRadius: 18,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  detailRow: {
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
  },
  detailBackButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
});
