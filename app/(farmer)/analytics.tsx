import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MetricCard from '../../components/farmer/MetricCard';
import EarningsChart from '../../components/farmer/EarningsChart';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { useAuthStore } from '../../store/authStore';
import { useFarmerMetrics } from '../../hooks/useEarnings';

export default function AnalyticsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: metrics, isLoading } = useFarmerMetrics(user?.id || '');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>التحليلات</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}>
        {isLoading ? (
          <View style={{ padding: spacing.xl, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View style={styles.metricsRow}>
            <MetricCard icon="eye-outline" value={`${metrics?.totalProducts || 0}`} label="منتجات" />
            <MetricCard icon="cart-outline" value={`${metrics?.ordersToday || 0}`} label="طلبات اليوم" />
            <MetricCard icon="star-outline" value="4.8" label="تقييم" />
          </View>
        )}

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>اتجاه المبيعات</Text>
          <EarningsChart />
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>رؤى ذكية</Text>
          <Text style={styles.insightText}>• البندورة هي المنتج الأكثر مبيعاً هذا الأسبوع</Text>
          <Text style={styles.insightText}>• الطلب يرتفع 30% أيام الخميس والجمعة</Text>
          <Text style={styles.insightText}>• 85% من عملائك عملاء متكررون</Text>
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
  metricsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  chartCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl, marginBottom: spacing.md,
  },
  chartTitle: {
    fontFamily: 'Cairo_700Bold', fontSize: 16, color: colors.textPrimary,
    textAlign: 'right', writingDirection: 'rtl', padding: spacing.md, paddingBottom: 0,
  },
  insightCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.md,
  },
  insightTitle: {
    fontFamily: 'Cairo_700Bold', fontSize: 16, color: colors.textPrimary,
    textAlign: 'right', writingDirection: 'rtl', marginBottom: spacing.sm,
  },
  insightText: {
    fontFamily: 'Cairo_400Regular', fontSize: 14, color: colors.textSecondary,
    textAlign: 'right', writingDirection: 'rtl', lineHeight: 24,
  },
});
