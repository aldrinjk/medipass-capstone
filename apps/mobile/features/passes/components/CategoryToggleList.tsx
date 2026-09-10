import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ALL_CATEGORIES, CATEGORY_DESCRIPTIONS, CATEGORY_LABELS } from '../utils/categories';
import type { ShareCategory } from '../../../types/pass';

interface CategoryToggleListProps {
  selected: ShareCategory[];
  onToggle: (category: ShareCategory) => void;
}

export function CategoryToggleList({ selected, onToggle }: CategoryToggleListProps) {
  return (
    <View style={styles.list}>
      {ALL_CATEGORIES.map((category) => {
        const isSelected = selected.includes(category);
        return (
          <Pressable
            key={category}
            onPress={() => onToggle(category)}
            style={[styles.row, isSelected && styles.rowSelected]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={CATEGORY_LABELS[category]}
          >
            <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
              {isSelected ? <Text style={styles.checkmark}>✓</Text> : null}
            </View>
            <View style={styles.textGroup}>
              <Text style={styles.label}>{CATEGORY_LABELS[category]}</Text>
              <Text style={styles.description}>{CATEGORY_DESCRIPTIONS[category]}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d7dce2',
    backgroundColor: '#ffffff',
  },
  rowSelected: {
    borderColor: '#0a4d8c',
    backgroundColor: '#eaf2fa',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#9aa4b2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: '#0a4d8c',
    backgroundColor: '#0a4d8c',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  textGroup: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0b1220',
  },
  description: {
    fontSize: 13,
    color: '#4b5565',
  },
});
