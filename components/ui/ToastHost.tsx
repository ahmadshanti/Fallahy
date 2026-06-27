import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useToastStore } from '../../store/toastStore';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';

export default function ToastHost() {
  const message = useToastStore((s) => s.message);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (message) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 20, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [message, opacity, translateY]);

  if (!message) return null;

  return (
    <Animated.View style={[styles.wrap, { opacity, transform: [{ translateY }] }]} pointerEvents="none">
      <View style={styles.toast}>
        <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  toast: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  text: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});
