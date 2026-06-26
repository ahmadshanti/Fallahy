import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import QuantityStepper from '../../components/ui/QuantityStepper';
import Button from '../../components/ui/Button';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { useCartStore } from '../../store/cartStore';

export default function CartScreen() {
  const router = useRouter();
  const { items, removeItem, updateQty, total, savings, clear } = useCartStore();
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup' | 'self'>('delivery');

  const cartTotal = total();
  const cartSavings = savings();

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>سلتي</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.empty}>
          <Ionicons name="cart-outline" size={60} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>السلة فارغة</Text>
          <Text style={styles.emptySubtitle}>ابدأ بإضافة منتجات طازجة!</Text>
          <Button title="تصفح المنتجات" onPress={() => router.push('/(buyer)/explore')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>سلتي ({items.length})</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {items.map((item) => {
          const price = item.priceType === 'wholesale' ? item.product.wholesalePrice : item.product.retailPrice;
          return (
            <View key={item.id} style={styles.cartItem}>
              <Image source={{ uri: item.product.image }} style={styles.itemImage} contentFit="cover" />
              <View style={styles.itemContent}>
                <Text style={styles.itemName}>{item.product.name}</Text>
                <Text style={styles.itemFarmer}>{item.product.farmerName}</Text>
                <View style={styles.itemBottom}>
                  <Text style={styles.itemPrice}>₪{(price * item.quantity).toFixed(2)}</Text>
                  <QuantityStepper
                    value={item.quantity}
                    onIncrement={() => updateQty(item.id, item.quantity + 1)}
                    onDecrement={() => updateQty(item.id, item.quantity - 1)}
                  />
                </View>
              </View>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => removeItem(item.id)}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Order Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryValue}>₪{cartTotal.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>المجموع الفرعي</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryValue}>مجاني</Text>
            <Text style={styles.summaryLabel}>التوصيل</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalValue}>₪{cartTotal.toFixed(2)}</Text>
            <Text style={styles.totalLabel}>الإجمالي</Text>
          </View>
          {cartSavings > 0 && (
            <Text style={styles.savingsText}>وفّرت {cartSavings.toFixed(2)} شيكل مقارنة بالسوق</Text>
          )}
        </View>

        {/* Delivery Type */}
        <View style={styles.deliverySection}>
          <Text style={styles.deliverySectionTitle}>طريقة الاستلام</Text>
          {[
            { key: 'delivery', label: 'توصيل' },
            { key: 'pickup', label: 'استلام ذاتي' },
            { key: 'self', label: 'قطف بنفسك' },
          ].map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.deliveryOption, deliveryType === opt.key && styles.deliveryOptionActive]}
              onPress={() => setDeliveryType(opt.key as typeof deliveryType)}
            >
              <View style={[styles.radio, deliveryType === opt.key && styles.radioActive]} />
              <Text style={styles.deliveryOptionText}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <Button title="إتمام الطلب" onPress={() => router.push('/(buyer)/checkout')} fullWidth size="lg" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  backIcon: { fontSize: 24, color: colors.textPrimary },
  headerTitle: { fontFamily: 'Cairo_700Bold', fontSize: 18, color: colors.textPrimary },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyEmoji: { fontSize: 60 },
  emptyTitle: { fontFamily: 'Cairo_700Bold', fontSize: 20, color: colors.textPrimary, marginTop: spacing.md },
  emptySubtitle: { fontFamily: 'Cairo_400Regular', fontSize: 15, color: colors.textMuted, marginBottom: spacing.lg },
  cartItem: {
    flexDirection: 'row-reverse', padding: spacing.md,
    backgroundColor: colors.surface, marginHorizontal: spacing.md, marginBottom: spacing.sm,
    borderRadius: radius.xl,
  },
  itemImage: { width: 60, height: 60, borderRadius: radius.md },
  itemContent: { flex: 1, marginRight: spacing.sm, marginLeft: spacing.sm },
  itemName: {
    fontFamily: 'Cairo_600SemiBold', fontSize: 15, color: colors.textPrimary,
    textAlign: 'right', writingDirection: 'rtl',
  },
  itemFarmer: {
    fontFamily: 'Cairo_400Regular', fontSize: 12, color: colors.textMuted,
    textAlign: 'right', writingDirection: 'rtl',
  },
  itemBottom: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8,
  },
  itemPrice: { fontFamily: 'Cairo_700Bold', fontSize: 16, color: colors.success },
  deleteBtn: { padding: 4 },
  deleteIcon: { fontSize: 18 },
  summary: {
    backgroundColor: colors.surface, marginHorizontal: spacing.md, marginTop: spacing.md,
    borderRadius: radius.xl, padding: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: { fontFamily: 'Cairo_400Regular', fontSize: 14, color: colors.textSecondary, textAlign: 'right' },
  summaryValue: { fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: colors.textPrimary },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 8, paddingTop: 12 },
  totalLabel: { fontFamily: 'Cairo_700Bold', fontSize: 16, color: colors.textPrimary, textAlign: 'right' },
  totalValue: { fontFamily: 'Cairo_700Bold', fontSize: 18, color: colors.primary },
  savingsText: {
    fontFamily: 'Cairo_700Bold', fontSize: 14, color: colors.success,
    textAlign: 'center', marginTop: spacing.sm,
  },
  deliverySection: { paddingHorizontal: spacing.md, marginTop: spacing.md },
  deliverySectionTitle: {
    fontFamily: 'Cairo_700Bold', fontSize: 16, color: colors.textPrimary,
    textAlign: 'right', writingDirection: 'rtl', marginBottom: spacing.sm,
  },
  deliveryOption: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  deliveryOptionActive: { borderColor: colors.primary, backgroundColor: '#F5F9F2' },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: colors.border,
  },
  radioActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  deliveryOptionText: { fontFamily: 'Cairo_600SemiBold', fontSize: 15, color: colors.textPrimary },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: spacing.md, paddingBottom: 30,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
  },
});
