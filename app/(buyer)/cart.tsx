import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../constants/colors';
import { useCartStore } from '../../store/cartStore';

export default function CartScreen() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQty = useCartStore((s) => s.updateQty);
  const getTotal = useCartStore((s) => s.getTotal);

  const total = getTotal();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>سلة التسوق</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cart-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>السلة فارغة</Text>
          <Text style={styles.emptySubtitle}>ابدأ بتصفح المنتجات وأضف ما تحتاجه</Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => router.push('/(buyer)/explore')}
          >
            <Text style={styles.browseBtnText}>تصفح المنتجات</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >
            {items.map((item) => {
              const price =
                item.saleType === 'wholesale'
                  ? item.product.wholesale_price || 0
                  : item.product.retail_price || 0;
              return (
                <View key={item.id + item.saleType} style={styles.cartItem}>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => removeItem(item.id)}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </TouchableOpacity>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.product.name}
                    </Text>
                    <Text style={styles.itemSaleType}>
                      {item.saleType === 'wholesale' ? 'جملة' : 'مفرق'}
                    </Text>
                    <Text style={styles.itemPrice}>
                      {(price * item.quantity).toFixed(2)} د.أ
                    </Text>
                    {/* Quantity Stepper */}
                    <View style={styles.stepper}>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => updateQty(item.id, item.quantity - 1)}
                      >
                        <Ionicons name="remove" size={16} color={colors.primary} />
                      </TouchableOpacity>
                      <Text style={styles.stepperValue}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => updateQty(item.id, item.quantity + 1)}
                      >
                        <Ionicons name="add" size={16} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {item.product.image_url ? (
                    <Image
                      source={{ uri: item.product.image_url }}
                      style={styles.itemImage}
                    />
                  ) : (
                    <View style={[styles.itemImage, styles.placeholderImage]}>
                      <Ionicons name="image-outline" size={24} color={colors.textMuted} />
                    </View>
                  )}
                </View>
              );
            })}
            <View style={{ height: 120 }} />
          </ScrollView>

          {/* Bottom Bar */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={() => router.push('/(buyer)/checkout')}
            >
              <Ionicons name="arrow-back" size={18} color="#fff" />
              <Text style={styles.checkoutBtnText}>إتمام الطلب</Text>
            </TouchableOpacity>
            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>الإجمالي</Text>
              <Text style={styles.totalPrice}>{total.toFixed(2)} د.أ</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 20,
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 18,
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  emptySubtitle: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: colors.textMuted,
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  browseBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  browseBtnText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  placeholderImage: {
    backgroundColor: colors.surfaceDim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    alignItems: 'flex-end',
    paddingHorizontal: 12,
  },
  itemName: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  itemSaleType: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 11,
    color: colors.textMuted,
    writingDirection: 'rtl',
    marginTop: 2,
  },
  itemPrice: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 15,
    color: colors.primary,
    marginTop: 4,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceDim,
    borderRadius: 8,
    marginTop: 8,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperValue: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
    color: colors.textPrimary,
    minWidth: 30,
    textAlign: 'center',
  },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.error + '10',
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingVertical: 14,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  totalSection: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    writingDirection: 'rtl',
  },
  totalPrice: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 20,
    color: colors.primary,
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  checkoutBtnText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 15,
    color: '#fff',
  },
});
