import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { radius } from '../../constants/spacing';

type BadgeVariant = 'fresh' | 'savings' | 'verified' | 'organic' | 'status';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: object;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  fresh: { bg: '#E8F5E1', text: colors.success },
  savings: { bg: '#FFF3D6', text: colors.secondary },
  verified: { bg: colors.primary, text: '#FFFFFF' },
  organic: { bg: '#E8F5E1', text: colors.success },
  status: { bg: colors.surfaceDim, text: colors.textSecondary },
};

export default function Badge({ label, variant = 'status', style }: BadgeProps) {
  const v = variantStyles[variant];
  return (
    <View style={[styles.container, { backgroundColor: v.bg }, style]}>
      <Text style={[styles.text, { color: v.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'right',
  },
});
