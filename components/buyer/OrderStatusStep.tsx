import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';

type StepStatus = 'done' | 'active' | 'pending';

interface OrderStatusStepProps {
  stepNumber: number;
  title: string;
  subtitle: string;
  status: StepStatus;
  timestamp?: string;
  isLast?: boolean;
}

export default function OrderStatusStep({
  stepNumber,
  title,
  subtitle,
  status,
  timestamp,
  isLast = false,
}: OrderStatusStepProps) {
  const pulseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === 'active') {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseScale, {
            toValue: 1.2,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseScale, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [status]);

  const circleColor =
    status === 'done' ? colors.primary :
    status === 'active' ? colors.secondary :
    colors.border;

  const lineColor = status === 'done' ? colors.primary : colors.border;

  return (
    <View style={styles.container}>
      <View style={styles.indicator}>
        {status === 'active' ? (
          <Animated.View style={[styles.circle, { backgroundColor: circleColor, transform: [{ scale: pulseScale }] }]}>
            <Text style={styles.circleText}>●</Text>
          </Animated.View>
        ) : (
          <View style={[styles.circle, { backgroundColor: circleColor }]}>
            {status === 'done' ? (
              <Text style={styles.checkmark}>✓</Text>
            ) : (
              <Text style={styles.circleEmpty}> </Text>
            )}
          </View>
        )}
        {!isLast && <View style={[styles.line, { backgroundColor: lineColor }]} />}
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, status === 'pending' && styles.pendingText]}>{title}</Text>
        <Text style={[styles.subtitle, status === 'pending' && styles.pendingText]}>{subtitle}</Text>
        {timestamp && <Text style={styles.timestamp}>{timestamp}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row-reverse', minHeight: 80 },
  indicator: { alignItems: 'center', width: 40 },
  circle: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  circleText: { color: '#FFFFFF', fontSize: 12 },
  checkmark: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  circleEmpty: { fontSize: 14 },
  line: { width: 2, flex: 1, marginVertical: 4 },
  content: { flex: 1, paddingRight: spacing.sm, paddingBottom: spacing.md },
  title: {
    fontFamily: 'Cairo_700Bold', fontSize: 15, color: colors.textPrimary,
    textAlign: 'right', writingDirection: 'rtl',
  },
  subtitle: {
    fontFamily: 'Cairo_400Regular', fontSize: 13, color: colors.textSecondary,
    textAlign: 'right', writingDirection: 'rtl', marginTop: 2,
  },
  timestamp: {
    fontFamily: 'Cairo_400Regular', fontSize: 12, color: colors.textMuted,
    textAlign: 'right', marginTop: 4,
  },
  pendingText: { color: colors.textMuted },
});
