import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { useAuthStore } from '../../store/authStore';
import { usePriceAlerts } from '../../hooks/useAlerts';

export default function AlertsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: priceAlerts = [], isLoading } = usePriceAlerts(user?.id || '');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تنبيهات الأسعار</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
      ) : priceAlerts.length === 0 ? (
        <View style={{ alignItems: 'center', paddingTop: 80 }}>
          <Ionicons name="notifications-off-outline" size={60} color={colors.textMuted} />
          <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 18, color: colors.textMuted, marginTop: spacing.md }}>لا توجد تنبيهات</Text>
          <Text style={{ fontFamily: 'Cairo_400Regular', fontSize: 14, color: colors.textMuted, marginTop: spacing.xs }}>أضف تنبيهات لمتابعة أسعار المنتجات</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {priceAlerts.map((alert) => (
            <View key={alert.id} style={styles.alertCard}>
              <View style={styles.alertRow}>
                <Text style={styles.alertProduct}>{alert.product}</Text>
                <Ionicons name="notifications-outline" size={20} color={colors.secondary} />
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>السعر الحالي: ₪{alert.currentPrice}</Text>
                <Text style={styles.priceLabel}>السعر المطلوب: ₪{alert.targetPrice}</Text>
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: alert.status === 'triggered' ? '#E8F5E1' : '#FFF3D6' }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: alert.status === 'triggered' ? colors.success : colors.secondary }
                ]}>
                  {alert.status === 'triggered' ? 'وصل السعر المطلوب!' : 'قيد الانتظار'}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
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
  list: { padding: spacing.md },
  alertCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  alertRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  alertIcon: { fontSize: 20 },
  alertProduct: {
    fontFamily: 'Cairo_700Bold', fontSize: 16, color: colors.textPrimary, textAlign: 'right',
  },
  priceRow: {
    flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: spacing.sm,
  },
  priceLabel: {
    fontFamily: 'Cairo_400Regular', fontSize: 13, color: colors.textSecondary,
  },
  statusBadge: {
    alignSelf: 'flex-end', paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: radius.full, marginTop: spacing.sm,
  },
  statusText: { fontFamily: 'Cairo_600SemiBold', fontSize: 12 },
});
