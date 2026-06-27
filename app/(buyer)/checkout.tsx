import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { createOrder } from '../../lib/orders';
import { getOrCreateConversation, sendMessage } from '../../lib/chat';
import { sendNotification } from '../../lib/notifications';
import { isDevMode } from '../../lib/devMode';
import { useDevOrdersStore } from '../../store/devOrdersStore';

export default function CheckoutScreen() {
  const router = useRouter();
  const { user, buyerId } = useAuthStore();
  const items = useCartStore((s) => s.items);
  const getTotal = useCartStore((s) => s.getTotal);
  const getFarmerId = useCartStore((s) => s.getFarmerId);
  const clear = useCartStore((s) => s.clear);

  const [address, setAddress] = useState(user?.city || '');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const createDevOrder = useDevOrdersStore((s) => s.create);

  const total = getTotal();
  const farmerId = getFarmerId();

  const handleConfirm = async () => {
    if (!buyerId || !farmerId) {
      Alert.alert('خطأ', 'يرجى تسجيل الدخول أولا');
      return;
    }
    if (!address.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال عنوان التوصيل');
      return;
    }
    if (items.length === 0) {
      Alert.alert('خطأ', 'السلة فارغة');
      return;
    }

    try {
      setSubmitting(true);

      const orderItems = items.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price:
          item.saleType === 'wholesale'
            ? item.product.wholesale_price || 0
            : item.product.retail_price || 0,
        sale_type: item.saleType,
      }));

      let orderId: string;
      if (isDevMode) {
        const devOrder = createDevOrder({
          buyer_id: buyerId,
          farmer_id: farmerId,
          total_price: total,
          delivery_address: address.trim(),
          notes: notes.trim() || undefined,
          items: orderItems.map((i, idx) => ({
            ...i,
            product_name: items[idx]?.product.name,
          })),
        });
        orderId = devOrder.id;
      } else {
        const order = await createOrder({
          buyer_id: buyerId,
          farmer_id: farmerId,
          total_price: total,
          delivery_address: address.trim(),
          notes: notes.trim() || undefined,
          items: orderItems,
        });
        orderId = order.id;

        // Auto-message + notification (real mode only — dev mode skips DB writes)
        try {
          const itemsList = items.map((i) => `${i.product.name} x${i.quantity}`).join(', ');
          const conv = await getOrCreateConversation(buyerId, farmerId, orderId);
          await sendMessage(conv.id, buyerId, 'buyer', `طلب جديد: ${itemsList}`);
        } catch {
          // Non-critical
        }
        try {
          await sendNotification(
            farmerId,
            'new_order',
            'طلب جديد',
            `لديك طلب جديد بقيمة ${total.toFixed(2)} د.أ`,
            { order_id: orderId }
          );
        } catch {
          // Non-critical
        }
      }

      clear();
      Alert.alert('تم', 'تم إرسال الطلب بنجاح');
      router.replace('/(buyer)/orders');
    } catch (err: any) {
      console.error('Checkout error:', err);
      Alert.alert('خطأ', err?.message || 'تعذر إنشاء الطلب. حاول مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>إتمام الطلب</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ملخص الطلب</Text>
          {items.map((item) => {
            const price =
              item.saleType === 'wholesale'
                ? item.product.wholesale_price || 0
                : item.product.retail_price || 0;
            return (
              <View key={item.id + item.saleType} style={styles.summaryItem}>
                <Text style={styles.summaryPrice}>{(price * item.quantity).toFixed(2)} د.أ</Text>
                <View style={styles.summaryRight}>
                  {item.product.image_url ? (
                    <Image source={{ uri: item.product.image_url }} style={styles.summaryImage} />
                  ) : (
                    <View style={[styles.summaryImage, styles.placeholderImg]}>
                      <Ionicons name="image-outline" size={16} color={colors.textMuted} />
                    </View>
                  )}
                  <View style={styles.summaryInfo}>
                    <Text style={styles.summaryName} numberOfLines={1}>{item.product.name}</Text>
                    <Text style={styles.summaryQty}>
                      {item.quantity} x {price.toFixed(2)} ({item.saleType === 'wholesale' ? 'جملة' : 'مفرق'})
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
          <View style={styles.totalRow}>
            <Text style={styles.totalPrice}>{total.toFixed(2)} د.أ</Text>
            <Text style={styles.totalLabel}>الإجمالي</Text>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>عنوان التوصيل</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="أدخل عنوان التوصيل الكامل"
            placeholderTextColor={colors.textMuted}
            textAlign="right"
            multiline
          />
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ملاحظات (اختياري)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="أضف ملاحظات للمزارع..."
            placeholderTextColor={colors.textMuted}
            textAlign="right"
            multiline
          />
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>طريقة الدفع</Text>
          <View style={styles.paymentCard}>
            <View style={styles.paymentRight}>
              <View style={styles.paymentIcon}>
                <Ionicons name="cash-outline" size={24} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.paymentTitle}>الدفع عند الاستلام</Text>
                <Text style={styles.paymentDesc}>ادفع نقدا عند تسليم الطلب</Text>
              </View>
            </View>
            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Confirm */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.confirmBtn, submitting && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.confirmBtnText}>تأكيد الطلب</Text>
            </>
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
  },
  backBtn: {
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 10,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  summaryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  summaryImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  placeholderImg: {
    backgroundColor: colors.surfaceDim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  summaryName: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  summaryQty: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 11,
    color: colors.textMuted,
    writingDirection: 'rtl',
  },
  summaryPrice: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
    color: colors.primary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 4,
  },
  totalLabel: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 16,
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  totalPrice: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 20,
    color: colors.primary,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: colors.textPrimary,
    writingDirection: 'rtl',
    minHeight: 50,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  paymentRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentTitle: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  paymentDesc: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 16,
    color: '#fff',
  },
});
