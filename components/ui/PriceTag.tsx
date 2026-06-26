import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

interface PriceTagProps {
  price: number;
  originalPrice?: number;
  size?: 'sm' | 'md' | 'lg';
  showCurrency?: boolean;
}

export default function PriceTag({ price, originalPrice, size = 'md', showCurrency = true }: PriceTagProps) {
  const fontSize = size === 'sm' ? 14 : size === 'md' ? 18 : 28;
  const originalSize = size === 'sm' ? 11 : size === 'md' ? 13 : 16;

  return (
    <View style={styles.container}>
      <Text style={[styles.price, { fontSize }]}>
        {showCurrency ? '₪' : ''}{price.toFixed(2)}
      </Text>
      {originalPrice && (
        <Text style={[styles.original, { fontSize: originalSize }]}>
          ₪{originalPrice.toFixed(2)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    alignItems: 'baseline',
    gap: 6,
  },
  price: {
    fontFamily: 'Cairo_700Bold',
    color: colors.success,
  },
  original: {
    fontFamily: 'Cairo_400Regular',
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
});
