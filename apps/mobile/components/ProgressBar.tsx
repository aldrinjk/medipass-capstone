import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressBarProps {
  percentage: number;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  label = 'Profile Completeness',
}) => {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  const getColor = (pct: number) => {
    if (pct < 40) return '#EF4444';
    if (pct < 80) return '#F59E0B';
    return '#10B981';
  };

  const barColor = getColor(clampedPercentage);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.percentageText, { color: barColor }]}>
          {clampedPercentage}%
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${clampedPercentage}%`, backgroundColor: barColor },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '700',
  },
  track: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 5,
  },
});
