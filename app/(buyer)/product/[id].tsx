import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '../../../constants/colors';
import { getProductById } from '../../../lib/products';
import { getOrCreateConversation } from '../../../lib/chat';
import { useAuthStore } from '../../../store/authStore';
import { useCartStore } from '../../../store/cartStore';
import { Product } from '../../../types';
import { aiServiceConfigured, priceComparison, PriceComparison } from '../../../lib/aiService';

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { buyerId } = useAuthStore();
  const addItem = useCartStore((s) => s.addItem);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [priceComp, setPriceComp] = useState<PriceComparison | null>(null);
  const [saleType, setSaleType] = useState<'retail' | 'wholesale'>('retail');

  useEffect(() => {
    if (id) loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const data = await getProductById(id!);
      setProduct(data);
      // Fire-and-forget: live market vs Fallahy price comparison from AI service
      if (aiServiceConfigured && data?.name) {
        priceComparison(data.name).then(setPriceComp).catch(() => setPriceComp(null));
      }
    } catch (err) {
      console.error('Product load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, quantity, saleType);
    Alert.alert('تمت الإضافة', `تم إضافة ${product.name} إلى السلة`, [{ text: 'حسنا' }]);
  };

  const handleChat = async () => {
    if (!buyerId || !product?.farmer_id) return;
    try {
      const conv = await getOrCreateConversation(buyerId, product.farmer_id);
      router.push(`/(buyer)/chat-thread/${conv.id}`);
    } catch (err) {
      Alert.alert('خطأ', 'تعذر بدء المحادثة');
    }
  };

  const handlePickYourOwn = () => {
    if (!product) return;
    router.push({
      pathname: '/(buyer)/pick-your-own',
      params: { farmerId: product.farmer_id, productId: product.id },
    });
  };

  const currentPrice =
    saleType === 'wholesale' && product?.wholesale_price
      ? product.wholesale_price
      : product?.retail_price || 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
        <Text style={styles.emptyText}>المنتج غير موجود</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnEmpty}>
          <Text style={styles.backBtnEmptyText}>رجوع</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const farmer = product.farmers;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Image */}
      <View style={styles.imageContainer}>
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.productImage} />
        ) : (
          <View style={[styles.productImage, styles.placeholderImage]}>
            <Ionicons name="image-outline" size={60} color={colors.textMuted} />
          </View>
        )}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cartBtn}
          onPress={() => router.push('/(buyer)/cart')}
        >
          <Ionicons name="cart-outline" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Badges */}
        <View style={styles.badgesRow}>
          {product.is_organic && (
            <View style={styles.organicBadge}>
              <Ionicons name="leaf" size={12} color="#fff" />
              <Text style={styles.organicText}>عضوي</Text>
            </View>
          )}
          {product.is_available !== false && (
            <View style={styles.availableBadge}>
              <Ionicons name="checkmark-circle" size={12} color={colors.success} />
              <Text style={styles.availableText}>متوفر</Text>
            </View>
          )}
        </View>

        {/* Name & Price */}
        <Text style={styles.productName}>{product.name}</Text>

        {/* Sale Type Toggle */}
        <View style={styles.saleToggleRow}>
          <TouchableOpacity
            style={[styles.saleToggleBtn, saleType === 'retail' && styles.saleToggleActive]}
            onPress={() => setSaleType('retail')}
          >
            <Text style={[styles.saleToggleText, saleType === 'retail' && styles.saleToggleTextActive]}>
              مفرق
            </Text>
          </TouchableOpacity>
          {product.wholesale_price && product.wholesale_price > 0 && (
            <TouchableOpacity
              style={[styles.saleToggleBtn, saleType === 'wholesale' && styles.saleToggleActive]}
              onPress={() => setSaleType('wholesale')}
            >
              <Text style={[styles.saleToggleText, saleType === 'wholesale' && styles.saleToggleTextActive]}>
                جملة
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceUnit}>/{product.unit}</Text>
          <Text style={styles.price}>{currentPrice.toFixed(2)} د.أ</Text>
        </View>

        {priceComp && (
          <View style={styles.compareCard}>
            <View style={styles.compareLine}>
              <Text style={styles.compareMarketPrice}>₪{priceComp.market_price.toFixed(2)}</Text>
              <Text style={styles.compareLabel}>سعر السوق</Text>
            </View>
            <View style={styles.compareLine}>
              <Text style={styles.compareFallahyPrice}>₪{priceComp.fallahy_price.toFixed(2)}</Text>
              <Text style={styles.compareLabel}>من الأرض</Text>
            </View>
            <View style={styles.compareSavingsBadge}>
              <Ionicons name="trending-down" size={14} color="#FFFFFF" />
              <Text style={styles.compareSavingsText}>وفّر {priceComp.savings_percent}%</Text>
            </View>
          </View>
        )}

        {/* Description */}
        {product.description && (
          <View style={styles.descSection}>
            <Text style={styles.sectionLabel}>الوصف</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>
        )}

        {/* Quantity Stepper */}
        <View style={styles.quantitySection}>
          <Text style={styles.sectionLabel}>الكمية</Text>
          <View style={styles.stepper}>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Ionicons name="remove" size={20} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{quantity}</Text>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => setQuantity(quantity + 1)}
            >
              <Ionicons name="add" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Farmer Card */}
        {farmer && (
          <TouchableOpacity
            style={styles.farmerCard}
            onPress={() => router.push(`/(buyer)/farmer/${farmer.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.farmerCardRight}>
              {farmer.owner_avatar_url ? (
                <Image source={{ uri: farmer.owner_avatar_url }} style={styles.farmerAvatar} />
              ) : (
                <View style={[styles.farmerAvatar, styles.placeholderAvatar]}>
                  <Ionicons name="person" size={20} color={colors.textMuted} />
                </View>
              )}
              <View style={styles.farmerInfo}>
                <View style={styles.farmerNameRow}>
                  <Text style={styles.farmerName}>{farmer.farm_name}</Text>
                  {farmer.is_verified && (
                    <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                  )}
                </View>
                <Text style={styles.farmerCity}>{farmer.city}</Text>
              </View>
            </View>
            <Ionicons name="chevron-back" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.chatButton} onPress={handleChat}>
            <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
            <Text style={styles.chatButtonText}>تواصل مباشر</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pickButton} onPress={handlePickYourOwn}>
            <Ionicons name="hand-left-outline" size={18} color={colors.secondary} />
            <Text style={styles.pickButtonText}>القطف بنفسك</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Add to Cart */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomTotal}>
          <Text style={styles.bottomTotalLabel}>الإجمالي</Text>
          <Text style={styles.bottomTotalPrice}>
            {(currentPrice * quantity).toFixed(2)} د.أ
          </Text>
        </View>
        <TouchableOpacity style={styles.addToCartBtn} onPress={handleAddToCart}>
          <Ionicons name="cart" size={20} color="#fff" />
          <Text style={styles.addToCartText}>أضف للسلة</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    gap: 12,
  },
  emptyText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  backBtnEmpty: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  backBtnEmptyText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: '#fff',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 300,
  },
  productImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  placeholderImage: {
    backgroundColor: colors.surfaceDim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBtn: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: -20,
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 8,
  },
  organicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.success,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  organicText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 11,
    color: '#fff',
  },
  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.success + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availableText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 11,
    color: colors.success,
  },
  productName: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 24,
    color: colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 8,
  },
  saleToggleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 8,
  },
  saleToggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.surfaceDim,
  },
  saleToggleActive: {
    backgroundColor: colors.primary,
  },
  saleToggleText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 12,
    color: colors.textSecondary,
  },
  saleToggleTextActive: {
    color: '#fff',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    gap: 4,
    marginBottom: 16,
  },
  price: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 22,
    color: colors.primary,
  },
  priceUnit: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 13,
    color: colors.textMuted,
  },
  compareCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 6,
  },
  compareLine: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  compareLabel: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: colors.textPrimary },
  compareMarketPrice: { fontFamily: 'Cairo_400Regular', fontSize: 14, color: colors.textMuted, textDecorationLine: 'line-through' },
  compareFallahyPrice: { fontFamily: 'Cairo_700Bold', fontSize: 16, color: colors.success },
  compareSavingsBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.success, borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4, marginTop: 4,
  },
  compareSavingsText: { fontFamily: 'Cairo_700Bold', fontSize: 12, color: '#FFFFFF' },
  descSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 6,
  },
  description: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 22,
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  stepperBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperValue: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 16,
    color: colors.textPrimary,
    minWidth: 40,
    textAlign: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
    lineHeight: 40,
  },
  farmerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  farmerCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  farmerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  placeholderAvatar: {
    backgroundColor: colors.surfaceDim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  farmerInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  farmerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  farmerName: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  farmerCity: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    writingDirection: 'rtl',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  chatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  chatButtonText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: colors.primary,
  },
  pickButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.secondary,
    backgroundColor: colors.secondary + '08',
  },
  pickButtonText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: colors.secondary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  bottomTotal: {
    alignItems: 'flex-end',
  },
  bottomTotalLabel: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    writingDirection: 'rtl',
  },
  bottomTotalPrice: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 18,
    color: colors.primary,
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  addToCartText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 15,
    color: '#fff',
  },
});
