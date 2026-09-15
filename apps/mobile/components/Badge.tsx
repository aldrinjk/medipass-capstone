import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'neutral' }) => {
  return (
    <View style={[styles.badge, styles[variant]]}>
      <Text style={[styles.text, styles[`text_${variant}`]]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  success: {
    backgroundColor: '#DEF7EC',
  },
  text_success: {
    color: '#03543F',
  },
  warning: {
    backgroundColor: '#FEF08A',
  },
  text_warning: {
    color: '#713F12',
  },
  danger: {
    backgroundColor: '#FDE8E8',
  },
  text_danger: {
    color: '#9B1C1C',
  },
  info: {
    backgroundColor: '#E1EFFE',
  },
  text_info: {
    color: '#1E429F',
  },
  neutral: {
    backgroundColor: '#F3F4F6',
  },
  text_neutral: {
    color: '#374151',
  },
});
