import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import OrderStatusStep from '../../../components/buyer/OrderStatusStep';
import Button from '../../../components/ui/Button';
import { colors } from '../../../constants/colors';
import { radius, spacing } from '../../../constants/spacing';
import { mockOrders } from '../../../constants/mockData';

export default function OrderTrackingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = mockOrders[0];

  const steps = [
    { title: 'تم استلام طلبك', subtitle: 'تم تأكيد الطلب بنجاح', status: 'done' as const, timestamp: '10:30 AM' },
    { title: 'المزارع يجهّز طلبك', subtitle: 'أبو أحمد يقوم بتغليف الخضروات الآن', status: 'active' as const },
    { title: 'في الطريق إليك', subtitle: 'يتم تعيين مندوب التوصيل', status: 'pending' as const },
    { title: 'وصل', subtitle: 'بالهناء والشفاء', status: 'pending' as const },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(buyer)/orders')}>
          <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تتبع الطلب</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.orderId}>#{order.id}</Text>
            <Text style={styles.statusTitle}>تتبع حالة طلبك</Text>
          </View>
          <View style={styles.arrivalRow}>
            <Text style={styles.arrivalTime}>{order.estimatedArrival}</Text>
            <Text style={styles.arrivalLabel}>وقت الوصول المتوقع</Text>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.timeline}>
          {steps.map((step, index) => (
            <OrderStatusStep
              key={index}
              stepNumber={index + 1}
              title={step.title}
              subtitle={step.subtitle}
              status={step.status}
              timestamp={step.timestamp}
              isLast={index === steps.length - 1}
            />
          ))}
        </View>

        {/* Map Card */}
        <View style={styles.mapCard}>
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={40} color={colors.primary} />
            <Text style={styles.mapText}>تتبع الموقع على الخريطة</Text>
          </View>
          <View style={styles.distanceChip}>
            <Text style={styles.distanceText}>على بعد 2.4 كم</Text>
          </View>
        </View>

        {/* Contact Buttons */}
        <View style={styles.contactSection}>
          <Button title="اتصل بالمزارع" onPress={() => {}} fullWidth icon={<Ionicons name="call-outline" size={18} color="#FFFFFF" />} />
          <View style={{ height: spacing.sm }} />
          <Button title="واتساب" onPress={() => {}} variant="outlined" fullWidth icon={<Ionicons name="logo-whatsapp" size={18} color={colors.primary} />} />
        </View>

        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>ملخص الطلب</Text>
          {order.items.map((item, i) => (
            <View key={i} style={styles.summaryRow}>
              <Text style={styles.summaryPrice}>₪{(item.price * item.qty).toFixed(2)}</Text>
              <Text style={styles.summaryName}>{item.name} × {item.qty}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalValue}>₪{order.total.toFixed(2)}</Text>
            <Text style={styles.totalLabel}>الإجمالي</Text>
          </View>
        </View>
      </ScrollView>
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
  statusCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.md,
    marginHorizontal: spacing.md, marginTop: spacing.md,
  },
  statusRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  statusTitle: { fontFamily: 'Cairo_700Bold', fontSize: 16, color: colors.textPrimary, textAlign: 'right' },
  orderId: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: colors.textMuted },
  arrivalRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  arrivalLabel: { fontFamily: 'Cairo_400Regular', fontSize: 13, color: colors.textMuted },
  arrivalTime: { fontFamily: 'Cairo_700Bold', fontSize: 18, color: colors.secondary },
  timeline: {
    paddingHorizontal: spacing.md, marginTop: spacing.lg,
  },
  mapCard: {
    height: 180, marginHorizontal: spacing.md, marginTop: spacing.md,
    borderRadius: radius.xl, overflow: 'hidden', position: 'relative',
  },
  mapPlaceholder: {
    flex: 1, backgroundColor: '#E8F0E2',
    alignItems: 'center', justifyContent: 'center',
  },
  mapEmoji: { fontSize: 40 },
  mapText: { fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: colors.primary, marginTop: 8 },
  distanceChip: {
    position: 'absolute', bottom: 12, alignSelf: 'center',
    backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: radius.full, elevation: 2,
  },
  distanceText: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: colors.primary },
  contactSection: { paddingHorizontal: spacing.md, marginTop: spacing.lg },
  summaryCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.md,
    marginHorizontal: spacing.md, marginTop: spacing.lg,
  },
  summaryTitle: {
    fontFamily: 'Cairo_700Bold', fontSize: 16, color: colors.textPrimary,
    textAlign: 'right', marginBottom: spacing.sm,
  },
  summaryRow: {
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
});
