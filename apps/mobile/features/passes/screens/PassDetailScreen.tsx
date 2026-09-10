import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PassQrCode } from '../../../components/qr/PassQrCode';
import { ConfirmButton } from '../components/ConfirmButton';
import { PassStatusBadge } from '../components/PassStatusBadge';
import { usePassDetail } from '../hooks/usePassDetail';
import { formatCategoryList } from '../utils/categories';
import { formatExpiresAt } from '../utils/expiry';

interface PassDetailScreenProps {
  passId: string;
}

export function PassDetailScreen({ passId }: PassDetailScreenProps) {
  const { status, pass, publicUrl, error, refresh, revoke, rotate, actionInFlight, actionError } =
    usePassDetail(passId);

  if (status === 'loading') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0a4d8c" />
      </View>
    );
  }

  if (status === 'error' || !pass) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Could not load this pass.'}</Text>
        <Pressable onPress={refresh} style={styles.retryButton} accessibilityRole="button">
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  const isActive = pass.status === 'ACTIVE';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.statusRow}>
        <PassStatusBadge status={pass.status} />
        <Text style={styles.expiry}>Expires {formatExpiresAt(pass.expiresAt)}</Text>
      </View>

      <Text style={styles.categories}>Sharing: {formatCategoryList(pass.categories)}</Text>

      {isActive ? (
        publicUrl ? (
          <View style={styles.qrWrapper}>
            <PassQrCode publicUrl={publicUrl} />
            <Text style={styles.qrHint}>Have a responder scan this with their phone camera.</Text>
          </View>
        ) : (
          <View style={styles.noQrCard}>
            <Text style={styles.noQrTitle}>No shareable link on this device</Text>
            <Text style={styles.noQrSubtitle}>
              This pass&apos;s QR link isn&apos;t available on this device (for example, after a
              reinstall). Rotate it to generate a new one.
            </Text>
          </View>
        )
      ) : (
        <View style={styles.noQrCard}>
          <Text style={styles.noQrTitle}>
            {pass.status === 'REVOKED' ? 'This pass has been revoked' : 'This pass has expired'}
          </Text>
          <Text style={styles.noQrSubtitle}>Its QR code no longer grants access to anyone.</Text>
        </View>
      )}

      {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}

      {isActive ? (
        <View style={styles.actions}>
          <ConfirmButton
            label="Rotate QR"
            confirmLabel="Tap again to rotate"
            onConfirm={rotate}
            loading={actionInFlight === 'rotate'}
            disabled={actionInFlight !== null}
          />
          <ConfirmButton
            label="Revoke pass"
            confirmLabel="Tap again to revoke"
            onConfirm={revoke}
            loading={actionInFlight === 'revoke'}
            disabled={actionInFlight !== null}
            tone="danger"
          />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expiry: {
    fontSize: 13,
    color: '#4b5565',
  },
  categories: {
    fontSize: 15,
    color: '#0b1220',
  },
  qrWrapper: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  qrHint: {
    fontSize: 13,
    color: '#4b5565',
    textAlign: 'center',
  },
  noQrCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d7dce2',
    padding: 16,
    gap: 6,
  },
  noQrTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0b1220',
  },
  noQrSubtitle: {
    fontSize: 13,
    color: '#4b5565',
  },
  actions: {
    gap: 10,
    marginTop: 8,
  },
  errorText: {
    color: '#8a231c',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#0a4d8c',
  },
  retryText: {
    color: '#0a4d8c',
    fontWeight: '700',
  },
});
