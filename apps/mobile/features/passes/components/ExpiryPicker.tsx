import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EXPIRY_OPTIONS } from '../utils/expiry';

interface ExpiryPickerProps {
  selectedHours: number;
  onSelect: (hours: number) => void;
}

export function ExpiryPicker({ selectedHours, onSelect }: ExpiryPickerProps) {
  return (
    <View style={styles.row}>
      {EXPIRY_OPTIONS.map((option) => {
        const isSelected = option.hours === selectedHours;
        return (
          <Pressable
            key={option.hours}
            onPress={() => onSelect(option.hours)}
            style={[styles.chip, isSelected && styles.chipSelected]}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d7dce2',
    backgroundColor: '#ffffff',
  },
  chipSelected: {
    borderColor: '#0a4d8c',
    backgroundColor: '#0a4d8c',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0b1220',
  },
  chipTextSelected: {
    color: '#ffffff',
  },
});
