import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../../constants/colors';
import { radius, shadow, spacing } from '../../constants/spacing';
import Badge from '../ui/Badge';
import { Product } from '../../types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - spacing.md * 3) / 2;

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  variant?: 'grid' | 'horizontal';
}

export default function ProductCard({ product, onPress, variant = 'grid' }: ProductCardProps) {
  if (variant === 'horizontal') {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <View style={styles.horizontalCard}>
          <Image source={{ uri: product.image }} style={styles.horizontalImage} contentFit="cover" />
          <View style={styles.horizontalContent}>
            <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
            <Text style={styles.farmer}>{product.farmerName}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>₪{product.retailPrice.toFixed(2)}</Text>
              <Text style={styles.unit}>/{product.unit}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <View style={styles.gridCard}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: product.image }} style={styles.gridImage} contentFit="cover" />
          {product.savings > 0 && (
            <View style={styles.savingsBadge}>
              <Badge label={`وفّر ${product.savings}%`} variant="savings" />
            </View>
          )}
        </View>
        <View style={styles.gridContent}>
          <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
          <Text style={styles.farmer} numberOfLines={1}>{product.farmerName}</Text>
          <View style={styles.bottomRow}>
            <Text style={styles.price}>₪{product.retailPrice.toFixed(2)}</Text>
            <TouchableOpacity style={styles.addButton} onPress={onPress}>
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gridCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    ...shadow.card,
    overflow: 'hidden',
  },
  imageContainer: { position: 'relative' },
  gridImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  savingsBadge: { position: 'absolute', top: 8, left: 8 },
  gridContent: { padding: 12 },
  name: {
    fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: colors.textPrimary,
    textAlign: 'right', writingDirection: 'rtl',
  },
  farmer: {
    fontFamily: 'Cairo_400Regular', fontSize: 12, color: colors.textMuted,
    textAlign: 'right', writingDirection: 'rtl', marginTop: 2,
  },
  bottomRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8,
  },
  price: { fontFamily: 'Cairo_700Bold', fontSize: 16, color: colors.success },
  unit: { fontFamily: 'Cairo_400Regular', fontSize: 12, color: colors.textMuted },
  addButton: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  addButtonText: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Cairo_700Bold', marginTop: -2 },
  priceRow: { flexDirection: 'row-reverse', alignItems: 'baseline', gap: 2, marginTop: 6 },
  horizontalCard: {
    flexDirection: 'row-reverse', backgroundColor: colors.surface,
    borderRadius: radius.xl, ...shadow.card, overflow: 'hidden', marginBottom: spacing.sm,
  },
  horizontalImage: { width: 80, height: 80 },
  horizontalContent: { flex: 1, padding: 12, justifyContent: 'center' },
});
