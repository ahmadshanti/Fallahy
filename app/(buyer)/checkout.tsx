import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { useCartStore } from '../../store/cartStore';

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, total, savings, clear } = useCartStore();
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [deliveryTime, setDeliveryTime] = useState('asap');

  const cartTotal = total();
  const cartSavings = savings();

  const handleConfirm = () => {
    clear();
    router.replace('/(buyer)/order-tracking/ORD-82739');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إتمام الطلب</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.changeLink}>تغيير</Text>
            <Text style={styles.sectionTitle}>عنوان التوصيل</Text>
          </View>
          <View style={styles.addressCard}>
            <Ionicons name="location-outline" size={20} color={colors.primary} />
            <Text style={styles.addressText}>رام الله، شارع الإرسال</Text>
          </View>
        </View>

        {/* Delivery Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>وقت التوصيل</Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[styles.option, deliveryTime === 'asap' && styles.optionActive]}
              onPress={() => setDeliveryTime('asap')}
            >
              <Text style={[styles.optionText, deliveryTime === 'asap' && styles.optionTextActive]}>في أقرب وقت</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.option, deliveryTime === 'scheduled' && styles.optionActive]}
              onPress={() => setDeliveryTime('scheduled')}
            >
              <Text style={[styles.optionText, deliveryTime === 'scheduled' && styles.optionTextActive]}>حدد وقتاً</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>طريقة الدفع</Text>
          {[
            { key: 'cash', label: 'نقداً عند الاستلام', icon: 'cash-outline' as const },
            { key: 'card', label: 'بطاقة ائتمان', icon: 'card-outline' as const },
            { key: 'wallet', label: 'محفظة إلكترونية', icon: 'phone-portrait-outline' as const },
          ].map((method) => (
            <TouchableOpacity
              key={method.key}
              style={[styles.paymentOption, paymentMethod === method.key && styles.paymentOptionActive]}
              onPress={() => setPaymentMethod(method.key)}
            >
              <View style={[styles.radio, paymentMethod === method.key && styles.radioActive]} />
              <Ionicons name={method.icon} size={20} color={colors.textPrimary} />
              <Text style={styles.paymentLabel}>{method.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Savings Highlight */}
        {cartSavings > 0 && (
          <View style={styles.savingsBox}>
            <Text style={styles.savingsText}>ستوفر {cartSavings.toFixed(2)} شيكل بهذا الطلب</Text>
          </View>
        )}

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ملخص الطلب</Text>
          {items.map((item) => {
            const price = item.priceType === 'wholesale' ? item.product.wholesalePrice : item.product.retailPrice;
            return (
              <View key={item.id} style={styles.summaryItem}>
                <Text style={styles.summaryPrice}>₪{(price * item.quantity).toFixed(2)}</Text>
                <Text style={styles.summaryName}>{item.product.name} × {item.quantity}</Text>
              </View>
            );
          })}
          <View style={styles.totalRow}>
            <Text style={styles.totalValue}>₪{cartTotal.toFixed(2)}</Text>
            <Text style={styles.totalLabel}>الإجمالي</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button title="تأكيد الطلب" onPress={handleConfirm} fullWidth size="lg" />
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
  backIcon: { fontSize: 24 },
  headerTitle: { fontFamily: 'Cairo_700Bold', fontSize: 18, color: colors.textPrimary },
  section: { paddingHorizontal: spacing.md, marginTop: spacing.lg },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontFamily: 'Cairo_700Bold', fontSize: 16, color: colors.textPrimary,
    textAlign: 'right', writingDirection: 'rtl', marginBottom: spacing.sm,
  },
  changeLink: { fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: colors.primary },
  addressCard: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.lg,
  },
  addressIcon: { fontSize: 20 },
  addressText: { fontFamily: 'Cairo_400Regular', fontSize: 15, color: colors.textPrimary },
  optionsRow: { flexDirection: 'row', gap: spacing.sm },
  option: {
    flex: 1, height: 44, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  optionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText: { fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: colors.textSecondary },
  optionTextActive: { color: '#FFFFFF' },
  paymentOption: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  paymentOptionActive: { borderColor: colors.primary, backgroundColor: '#F5F9F2' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border },
  radioActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  paymentIcon: { fontSize: 20 },
  paymentLabel: { fontFamily: 'Cairo_600SemiBold', fontSize: 15, color: colors.textPrimary },
  savingsBox: {
    backgroundColor: '#E8F5E1', borderRadius: radius.lg,
    padding: spacing.md, marginHorizontal: spacing.md, marginTop: spacing.lg,
  },
  savingsText: {
    fontFamily: 'Cairo_700Bold', fontSize: 15, color: colors.success,
    textAlign: 'center',
  },
  summaryItem: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6,
  },
  summaryName: { fontFamily: 'Cairo_400Regular', fontSize: 14, color: colors.textSecondary, textAlign: 'right' },
  summaryPrice: { fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: colors.textPrimary },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: colors.border, marginTop: 8, paddingTop: 12,
  },
  totalLabel: { fontFamily: 'Cairo_700Bold', fontSize: 16, color: colors.textPrimary },
  totalValue: { fontFamily: 'Cairo_700Bold', fontSize: 18, color: colors.primary },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: spacing.md, paddingBottom: 30,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
  },
});
