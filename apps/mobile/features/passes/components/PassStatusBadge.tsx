import { StyleSheet, Text, View } from 'react-native';
import type { PassStatus } from '../../../types/pass';

const STATUS_STYLE: Record<PassStatus, { background: string; text: string; label: string }> = {
  ACTIVE: { background: '#e3f5e9', text: '#0f6b3c', label: 'Active' },
  REVOKED: { background: '#fdeceb', text: '#8a231c', label: 'Revoked' },
  EXPIRED: { background: '#f0f1f3', text: '#4b5565', label: 'Expired' },
};

export function PassStatusBadge({ status }: { status: PassStatus }) {
  const style = STATUS_STYLE[status];
  return (
    <View style={[styles.badge, { backgroundColor: style.background }]}>
      <Text style={[styles.text, { color: style.text }]}>{style.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
