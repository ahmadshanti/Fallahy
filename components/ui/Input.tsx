import React from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';

interface InputProps extends TextInputProps {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
}

export default function Input({ label, icon, error, style, ...props }: InputProps) {
  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.container, error && styles.errorBorder]}>
        {icon && <View style={styles.icon}>{icon}</View>}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textMuted}
          textAlign="right"
          {...props}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  container: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.surfaceDim,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    height: 48,
    paddingHorizontal: spacing.md,
  },
  errorBorder: { borderColor: colors.error },
  icon: { marginLeft: spacing.sm },
  input: {
    flex: 1,
    fontFamily: 'Cairo_400Regular',
    fontSize: 15,
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  error: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    color: colors.error,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
});
