import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Badge from '../../../components/ui/Badge';
import QuantityStepper from '../../../components/ui/QuantityStepper';
import RatingStars from '../../../components/ui/RatingStars';
import Avatar from '../../../components/ui/Avatar';
import Button from '../../../components/ui/Button';
import { colors } from '../../../constants/colors';
import { radius, spacing } from '../../../constants/spacing';
import { useProduct } from '../../../hooks/useProducts';
import { useCartStore } from '../../../store/cartStore';

const { width, height } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const addItem = useCartStore((s) => s.addItem);
  const { data: product, isLoading } = useProduct(id as string);
  const [quantity, setQuantity] = useState(1);
  const [priceType, setPriceType] = useState<'retail' | 'wholesale'>('retail');

  if (isLoading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Ionicons name="alert-circle-outline" size={60} color={colors.textMuted} />
        <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 18, color: colors.textMuted, marginTop: spacing.md }}>المنتج غير موجود</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: spacing.md }}>
          <Text style={{ fontFamily: 'Cairo_600SemiBold', fontSize: 16, color: colors.primary }}>العودة</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const currentPrice = priceType === 'wholesale' ? product.wholesalePrice : product.retailPrice;

  const handleAddToCart = () => {
    addItem(product, quantity, priceType);
    router.back();
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: product.image }} style={styles.heroImage} contentFit="cover" />
          <LinearGradient colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.5)']} style={StyleSheet.absoluteFillObject} />
          <SafeAreaView style={styles.imageOverlay}>
            <View style={styles.imageTopRow}>
              <View style={styles.imageActions}>
                <TouchableOpacity style={styles.iconCircle}><Ionicons name="heart-outline" size={20} color={colors.textPrimary} /></TouchableOpacity>
                <TouchableOpacity style={styles.iconCircle}><Ionicons name="share-outline" size={20} color={colors.textPrimary} /></TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.iconCircle} onPress={() => router.back()}>
                <Ionicons name="arrow-forward" size={18} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
          <Text style={styles.imageTitle}>{product.name}</Text>
        </View>

        {/* Content Card */}
        <View style={styles.contentCard}>
          {/* Tags Row */}
          <View style={styles.tagsRow}>
            {product.isFresh && <Badge label="قُطف اليوم" variant="fresh" />}
            {product.isOrganic && <Badge label="عضوي" variant="organic" />}
            <Badge label="فلسطيني المنشأ 🇵🇸" variant="status" />
          </View>

          {/* Price Block */}
          <View style={styles.priceBlock}>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>السعر في السوق</Text>
              <Text style={styles.marketPrice}>₪{product.marketPrice}</Text>
            </View>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>سعر الفلاحي</Text>
              <Text style={styles.ourPrice}>₪{currentPrice}</Text>
            </View>
            <Badge label={`وفّرت ${product.savings}%`} variant="savings" />
          </View>

          {/* Price Type Toggle */}
          <View style={styles.toggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, priceType === 'retail' && styles.toggleActive]}
              onPress={() => setPriceType('retail')}
            >
              <Text style={[styles.toggleText, priceType === 'retail' && styles.toggleTextActive]}>مفرق</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, priceType === 'wholesale' && styles.toggleActive]}
              onPress={() => setPriceType('wholesale')}
            >
              <Text style={[styles.toggleText, priceType === 'wholesale' && styles.toggleTextActive]}>جملة</Text>
            </TouchableOpacity>
          </View>

          {/* Farmer Card */}
          <TouchableOpacity
            style={styles.farmerCard}
            onPress={() => router.push(`/(buyer)/farmer/${product.farmerId}`)}
          >
            <Avatar uri={product.farmerAvatar} size={40} />
            <View style={styles.farmerInfo}>
              <Text style={styles.farmerName}>{product.farmerName}</Text>
              <RatingStars rating={product.rating} reviewCount={product.reviewCount} size={12} />
            </View>
            <Text style={styles.mapLink}>المزرعة على الخريطة</Text>
          </TouchableOpacity>

          {/* Special Actions */}
          <View style={styles.specialActions}>
            <TouchableOpacity style={styles.specialBtn} onPress={() => router.push('/(buyer)/adopt-tree')}>
              <Text style={styles.specialBtnText}>تبنّى شجرة</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.specialBtn} onPress={() => router.push('/(buyer)/pick-your-own')}>
              <Text style={styles.specialBtnText}>اجي قطف بنفسك</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <Button title="أضف للسلة" onPress={handleAddToCart} size="lg" style={{ flex: 1 }} />
        <QuantityStepper
          value={quantity}
          onIncrement={() => setQuantity(quantity + 1)}
          onDecrement={() => setQuantity(quantity - 1)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  imageContainer: { height: height * 0.55, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  imageOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  imageTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  imageActions: { flexDirection: 'row', gap: spacing.sm },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { fontSize: 18, color: colors.textPrimary },
  imageTitle: {
    position: 'absolute',
    bottom: 40,
    left: spacing.md,
    right: spacing.md,
    fontFamily: 'Cairo_700Bold',
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'right',
  },
  contentCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    padding: 20,
    minHeight: 400,
  },
  tagsRow: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  priceBlock: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceDim,
    borderRadius: radius.lg,
  },
  priceItem: { alignItems: 'center' },
  priceLabel: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 2,
  },
  marketPrice: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 18,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  ourPrice: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 24,
    color: colors.success,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceDim,
    borderRadius: radius.lg,
    padding: 3,
    marginBottom: spacing.md,
  },
  toggleBtn: {
    flex: 1,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleActive: { backgroundColor: colors.primary },
  toggleText: { fontFamily: 'Cairo_600SemiBold', fontSize: 15, color: colors.textSecondary },
  toggleTextActive: { color: '#FFFFFF' },
  farmerCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.surfaceDim,
    borderRadius: radius.lg,
    padding: 12,
    marginBottom: spacing.md,
  },
  farmerInfo: { flex: 1, marginRight: spacing.sm },
  farmerName: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 15,
    color: colors.textPrimary,
    textAlign: 'right',
  },
  mapLink: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 12,
    color: colors.primary,
  },
  specialActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  specialBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 12,
    alignItems: 'center',
  },
  specialBtnText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: colors.primary,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingBottom: 30,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
});
