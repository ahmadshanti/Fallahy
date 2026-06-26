import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  visible: boolean;
  onHide: () => void;
  duration?: number;
}

export default function Toast({ message, type = 'success', visible, onHide, duration = 2000 }: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.delay(duration),
        Animated.timing(translateY, { toValue: -100, duration: 300, useNativeDriver: true }),
      ]).start(() => onHide());
    }
  }, [visible]);

  const bgColor = type === 'success' ? colors.success : type === 'error' ? colors.error : colors.primary;

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { backgroundColor: bgColor, transform: [{ translateY }] }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', top: 60, left: spacing.md, right: spacing.md,
    padding: spacing.md, borderRadius: radius.lg, zIndex: 999, alignItems: 'center',
  },
  text: { fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: '#FFFFFF', textAlign: 'center' },
});
