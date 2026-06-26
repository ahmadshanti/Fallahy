import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { useAuthStore } from '../../store/authStore';
import { getProductsByFarmer } from '../../lib/products';
import { getOrdersByFarmer } from '../../lib/orders';

export default function AnalyticsScreen() {
  const router = useRouter();
  const farmerId = useAuthStore((s) => s.farmerId);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [todayOrders, setTodayOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [topProducts, setTopProducts] = useState<string[]>([]);

  useEffect(() => {
    if (farmerId) loadAnalytics();
  }, [farmerId]);

  const loadAnalytics = async () => {
    if (!farmerId) return;
    setLoading(true);
    try {
      const [products, orders] = await Promise.all([
        getProductsByFarmer(farmerId),
        getOrdersByFarmer(farmerId),
      ]);

      setTotalProducts(products.length);

      const today = new Date().toISOString().split('T')[0];
      const todayList = orders.filter((o: any) => o.created_at?.startsWith(today));
      setTodayOrders(todayList.length);

      const delivered = orders.filter((o: any) => o.status === 'delivered');
      const revenue = delivered.reduce((sum: number, o: any) => sum + (o.total_price || 0), 0);
      setTotalRevenue(revenue);

      // Find top products by order frequency
      const productCounts: Record<string, number> = {};
      orders.forEach((o: any) => {
        (o.order_items || []).forEach((item: any) => {
          const name = item.products?.name || '';
          if (name) {
            productCounts[name] = (productCounts[name] || 0) + item.quantity;
          }
        });
      });
      const sorted = Object.entries(productCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name]) => name);
      setTopProducts(sorted);
    } catch (err) {
      console.log('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

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
        {loading ? (
          <View style={{ padding: spacing.xl, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Ionicons name="cube-outline" size={24} color={colors.primary} />
                <Text style={styles.metricValue}>{totalProducts}</Text>
                <Text style={styles.metricLabel}>منتجات</Text>
              </View>
              <View style={styles.metricCard}>
                <Ionicons name="cart-outline" size={24} color={colors.primary} />
                <Text style={styles.metricValue}>{todayOrders}</Text>
                <Text style={styles.metricLabel}>طلبات اليوم</Text>
              </View>
              <View style={styles.metricCard}>
                <Ionicons name="wallet-outline" size={24} color={colors.primary} />
                <Text style={styles.metricValue}>{totalRevenue} ₪</Text>
                <Text style={styles.metricLabel}>الإيرادات</Text>
              </View>
            </View>

            <View style={styles.insightCard}>
              <Text style={styles.insightTitle}>المنتجات الأكثر مبيعاً</Text>
              {topProducts.length === 0 ? (
                <Text style={styles.insightText}>لا توجد بيانات كافية بعد</Text>
              ) : (
                topProducts.map((name, i) => (
                  <View key={i} style={styles.insightRow}>
                    <Text style={styles.insightText}>{name}</Text>
                    <View style={styles.insightBullet}>
                      <Text style={styles.insightNumber}>{i + 1}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}
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
  headerTitle: { fontFamily: 'Cairo_700Bold', fontSize: 18, color: colors.textPrimary },
  metricsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  metricCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: spacing.md, alignItems: 'center', gap: 4,
  },
  metricValue: { fontFamily: 'Cairo_700Bold', fontSize: 20, color: colors.textPrimary },
  metricLabel: { fontFamily: 'Cairo_400Regular', fontSize: 11, color: colors.textMuted },
  insightCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.md,
  },
  insightTitle: {
    fontFamily: 'Cairo_700Bold', fontSize: 16, color: colors.textPrimary,
    textAlign: 'right', writingDirection: 'rtl', marginBottom: spacing.sm,
  },
  insightRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  insightBullet: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  insightNumber: { fontFamily: 'Cairo_700Bold', fontSize: 12, color: '#FFFFFF' },
  insightText: {
    fontFamily: 'Cairo_400Regular', fontSize: 14, color: colors.textSecondary,
    textAlign: 'right', writingDirection: 'rtl',
  },
});
