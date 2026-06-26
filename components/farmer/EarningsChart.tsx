import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';

const barData = [
  { label: 'سبت', value: 60 },
  { label: 'أحد', value: 80 },
  { label: 'اثنين', value: 45 },
  { label: 'ثلاثاء', value: 90 },
  { label: 'أربعاء', value: 70 },
  { label: 'خميس', value: 100 },
];

export default function EarningsChart() {
  const maxValue = Math.max(...barData.map((d) => d.value));

  return (
    <View style={styles.container}>
      <View style={styles.barsContainer}>
        {barData.map((item, index) => {
          const height = (item.value / maxValue) * 120;
          const isActive = index === barData.length - 1;
          return (
            <View key={index} style={styles.barWrapper}>
              <View
                style={[
                  styles.bar,
                  {
                    height,
                    backgroundColor: isActive ? colors.primary : '#C3C9B9',
                  },
                ]}
              />
              <Text style={styles.barLabel}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
  },
  barWrapper: {
    alignItems: 'center',
  },
  bar: {
    width: 24,
    borderRadius: radius.sm,
    marginBottom: 6,
  },
  barLabel: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 11,
    color: colors.textMuted,
  },
});
