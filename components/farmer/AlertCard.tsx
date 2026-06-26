import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { Alert } from '../../types';

interface AlertCardProps {
  alert: Alert;
  onAction?: () => void;
}

const typeStyles = {
  warning: { bg: '#FFF8E7', border: colors.secondary, icon: 'warning-outline' },
  info: { bg: '#F0F7E8', border: colors.success, icon: 'trending-down-outline' },
  success: { bg: '#E8F5E1', border: colors.success, icon: 'checkmark-circle-outline' },
};

export default function AlertCard({ alert, onAction }: AlertCardProps) {
  const style = typeStyles[alert.type];

  return (
    <View style={[styles.card, { backgroundColor: style.bg, borderLeftColor: style.border }]}>
      <View style={styles.row}>
        <Ionicons name={style.icon as any} size={18} color={style.border} />
        <Text style={styles.message}>{alert.message}</Text>
      </View>
      <TouchableOpacity onPress={onAction}>
        <Text style={[styles.action, { color: style.border }]}>{alert.action}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderLeftWidth: 3,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 8,
  },
  icon: {
    fontSize: 16,
  },
  message: {
    flex: 1,
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 22,
  },
  action: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    textAlign: 'right',
    marginTop: 8,
  },
});
