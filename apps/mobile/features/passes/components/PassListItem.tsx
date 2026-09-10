import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PassStatusBadge } from './PassStatusBadge';
import { formatCategoryList } from '../utils/categories';
import { formatExpiresAt } from '../utils/expiry';
import type { PassMetadata } from '../../../types/pass';

interface PassListItemProps {
  pass: PassMetadata;
  onPress: (passId: string) => void;
}

export function PassListItem({ pass, onPress }: PassListItemProps) {
  return (
    <Pressable
      onPress={() => onPress(pass.passId)}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Pass sharing ${formatCategoryList(pass.categories)}, ${pass.status.toLowerCase()}`}
    >
      <View style={styles.info}>
        <Text style={styles.categories} numberOfLines={1}>
          {formatCategoryList(pass.categories)}
        </Text>
        <Text style={styles.expiry}>Expires {formatExpiresAt(pass.expiresAt)}</Text>
      </View>
      <PassStatusBadge status={pass.status} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    gap: 12,
  },
  rowPressed: {
    opacity: 0.7,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  categories: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0b1220',
  },
  expiry: {
    fontSize: 13,
    color: '#4b5565',
  },
});
