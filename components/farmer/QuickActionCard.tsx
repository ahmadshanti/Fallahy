import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { radius, shadow, spacing } from '../../constants/spacing';

interface QuickActionCardProps {
  icon: string;
  label: string;
  onPress: () => void;
  isPrimary?: boolean;
}

export default function QuickActionCard({ icon, label, onPress, isPrimary = false }: QuickActionCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, isPrimary ? styles.primary : styles.secondary]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name={icon as any} size={28} color={isPrimary ? '#FFFFFF' : colors.primary} />
      <Text style={[styles.label, isPrimary ? styles.labelPrimary : styles.labelSecondary]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    height: 120,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
    margin: 4,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: {
    fontSize: 28,
    marginBottom: 8,
  },
  label: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    textAlign: 'center',
  },
  labelPrimary: {
    color: '#FFFFFF',
  },
  labelSecondary: {
    color: colors.primary,
  },
});
