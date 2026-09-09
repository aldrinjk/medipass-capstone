import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Modal,
} from 'react-native';
import { usePasses } from '../../hooks/usePasses';
import { useSharingPreferences } from '../../hooks/useSharingPreferences';
import { PassSummaryCard } from '../../features/sharing/PassSummaryCard';
import { AccessHistoryList } from '../../features/sharing/AccessHistoryList';
import { Button, Card, LoadingSpinner, ErrorBanner, EmptyState } from '../../components';

export default function PassesScreen() {
  const {
    passes,
    auditLogs,
    isLoading,
    error,
    loadPasses,
    createPass,
    revokePass,
    loadAuditLogs,
  } = usePasses();
  const { categories } = useSharingPreferences();

  const [selectedPassForLogs, setSelectedPassForLogs] = useState<string | null>(null);
  const [isCreatingPass, setIsCreatingPass] = useState(false);
  const [expiryHours, setExpiryHours] = useState<number>(24);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleCreatePass = async () => {
    setActionError(null);
    if (categories.length === 0) {
      setActionError('You must configure at least one shareable category in Sharing Preferences before generating a pass.');
      return;
    }
    const newPass = await createPass(categories, expiryHours);
    if (!newPass) {
      setActionError('Failed to generate pass. Please try again.');
    }
  };

  const handleRevokePass = async (passId: string) => {
    setActionError(null);
    const success = await revokePass(passId);
    if (!success) {
      setActionError('Failed to revoke pass. Please try again.');
    }
  };

  const handleOpenLogs = async (passId: string) => {
    setSelectedPassForLogs(passId);
    await loadAuditLogs(passId);
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
            onRevoke={handleRevokePass}
            onViewLogs={handleOpenLogs}
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
              onRevoke={handleRevokePass}
              onViewLogs={handleOpenLogs}
            />
          ))}
        </>
      )}

      {/* Audit Logs Modal */}
      <Modal
        visible={!!selectedPassForLogs}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedPassForLogs(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pass Access Audit</Text>
              <Button
                title="✕"
                variant="outline"
                size="sm"
                onPress={() => setSelectedPassForLogs(null)}
                style={styles.modalCloseBtn}
              />
            </View>
            <ScrollView>
              {selectedPassForLogs && (
                <AccessHistoryList
                  logs={auditLogs[selectedPassForLogs] || []}
                  passId={selectedPassForLogs}
                />
              )}
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
});
