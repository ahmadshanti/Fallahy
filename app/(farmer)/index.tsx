import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { useAuthStore } from '../../store/authStore';
import { getOrdersByFarmer } from '../../lib/orders';
import { getProductsByFarmer } from '../../lib/products';

export default function FarmerDashboard() {
  const router = useRouter();
  const { farmer, user } = useAuthStore();
  const farmerId = useAuthStore((s) => s.farmerId);

  const [loading, setLoading] = useState(true);
  const [todayOrders, setTodayOrders] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!farmerId) return;
    loadDashboard();
  }, [farmerId]);

  const loadDashboard = async () => {
    if (!farmerId) return;
    setLoading(true);
    try {
      const [orders, products] = await Promise.all([
        getOrdersByFarmer(farmerId),
        getProductsByFarmer(farmerId),
      ]);

      // Today's orders
      const today = new Date().toISOString().split('T')[0];
      const todayList = orders.filter((o: any) => o.created_at?.startsWith(today));
      setTodayOrders(todayList.length);

      // Pending orders
      const pending = orders.filter((o: any) => o.status === 'pending');
      setPendingOrders(pending.length);

      // Revenue: sum total_price of delivered orders this month
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const deliveredThisMonth = orders.filter(
        (o: any) => o.status === 'delivered' && o.created_at >= monthStart
      );
      const revenue = deliveredThisMonth.reduce((sum: number, o: any) => sum + (o.total_price || 0), 0);
      setMonthRevenue(revenue);

      // Low stock alerts
      const lowStock = products.filter((p: any) => p.quantity_available < 5);
      setLowStockProducts(lowStock);
    } catch (err) {
      console.log('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'صباح الخير';
    if (hour < 17) return 'مساء الخير';
    return 'مساء النور';
  };

  const farmerName = farmer?.owner_name || farmer?.farm_name || user?.full_name || 'مزرعتي';

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(farmer)/alerts')}>
            <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <View style={styles.headerText}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.farmName}>{farmerName}</Text>
            </View>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={28} color={colors.primary} />
            </View>
          </View>
        </View>

        {/* Metrics */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Ionicons name="bag-outline" size={24} color={colors.primary} />
            <Text style={styles.metricValue}>{todayOrders}</Text>
            <Text style={styles.metricLabel}>طلبات اليوم</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="wallet-outline" size={24} color={colors.primary} />
            <Text style={styles.metricValue}>{monthRevenue} ₪</Text>
            <Text style={styles.metricLabel}>إيرادات الشهر</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="time-outline" size={24} color={colors.secondary} />
            <Text style={styles.metricValue}>{pendingOrders}</Text>
            <Text style={styles.metricLabel}>بانتظار الرد</Text>
          </View>
        </View>

        {/* Smart Alerts */}
        <Text style={styles.sectionTitle}>تنبيهات ذكية</Text>
        <View style={styles.alertsSection}>
          {lowStockProducts.length === 0 && pendingOrders === 0 ? (
            <View style={styles.emptyAlert}>
              <Ionicons name="checkmark-circle-outline" size={24} color={colors.success} />
              <Text style={styles.emptyAlertText}>لا توجد تنبيهات حالياً</Text>
            </View>
          ) : (
            <>
              {lowStockProducts.map((p: any) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.alertCard}
                  onPress={() => router.push('/(farmer)/products')}
                >
                  <View style={styles.alertContent}>
                    <Text style={styles.alertText}>
                      {p.name} - الكمية المتبقية: {p.quantity_available} {p.unit}
                    </Text>
                    <Text style={styles.alertTitle}>مخزون منخفض</Text>
                  </View>
                  <View style={[styles.alertIcon, { backgroundColor: '#FFF3E0' }]}>
                    <Ionicons name="warning-outline" size={20} color="#F57C00" />
                  </View>
                </TouchableOpacity>
              ))}
              {pendingOrders > 0 && (
                <TouchableOpacity
                  style={styles.alertCard}
                  onPress={() => router.push('/(farmer)/orders')}
                >
                  <View style={styles.alertContent}>
                    <Text style={styles.alertText}>
                      لديك {pendingOrders} طلبات بانتظار الموافقة
                    </Text>
                    <Text style={styles.alertTitle}>طلبات جديدة</Text>
                  </View>
                  <View style={[styles.alertIcon, { backgroundColor: '#E3F2FD' }]}>
                    <Ionicons name="bag-outline" size={20} color="#1976D2" />
                  </View>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
        <View style={styles.actionsGrid}>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionCard, styles.actionCardPrimary]}
              onPress={() => router.push('/(farmer)/add-product')}
            >
              <Ionicons name="add-circle-outline" size={28} color="#FFFFFF" />
              <Text style={[styles.actionLabel, { color: '#FFFFFF' }]}>إضافة منتج</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(farmer)/orders')}
            >
              <Ionicons name="clipboard-outline" size={28} color={colors.primary} />
              <Text style={styles.actionLabel}>طلباتي</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(farmer)/earnings')}
            >
              <Ionicons name="wallet-outline" size={28} color={colors.primary} />
              <Text style={styles.actionLabel}>الأرباح</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(farmer)/trees')}
            >
              <Ionicons name="leaf-outline" size={28} color={colors.primary} />
              <Text style={styles.actionLabel}>أشجاري</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
  },
  headerRight: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  headerText: { alignItems: 'flex-end' },
  greeting: { fontFamily: 'Cairo_400Regular', fontSize: 14, color: colors.textMuted },
  farmName: {
    fontFamily: 'Cairo_700Bold', fontSize: 18, color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  avatarCircle: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#E8F5E1', alignItems: 'center', justifyContent: 'center',
  },
  metricsRow: {
    flexDirection: 'row', paddingHorizontal: spacing.md, gap: spacing.sm,
  },
  metricCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: spacing.md, alignItems: 'center', gap: 4,
  },
  metricValue: { fontFamily: 'Cairo_700Bold', fontSize: 20, color: colors.textPrimary },
  metricLabel: { fontFamily: 'Cairo_400Regular', fontSize: 11, color: colors.textMuted, textAlign: 'center' },
  sectionTitle: {
    fontFamily: 'Cairo_700Bold', fontSize: 18, color: colors.textPrimary,
    textAlign: 'right', writingDirection: 'rtl',
    paddingHorizontal: spacing.md, marginTop: spacing.lg, marginBottom: spacing.sm,
  },
  alertsSection: { paddingHorizontal: spacing.md },
  emptyAlert: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.md,
  },
  emptyAlertText: { fontFamily: 'Cairo_400Regular', fontSize: 14, color: colors.textMuted },
  alertCard: {
    flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: spacing.md, marginBottom: spacing.sm, alignItems: 'center',
  },
  alertIcon: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
  },
  alertContent: { flex: 1, marginHorizontal: spacing.sm },
  alertTitle: {
    fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: colors.textPrimary,
    textAlign: 'right', writingDirection: 'rtl',
  },
  alertText: {
    fontFamily: 'Cairo_400Regular', fontSize: 12, color: colors.textMuted,
    textAlign: 'right', writingDirection: 'rtl', marginTop: 2,
  },
  actionsGrid: { paddingHorizontal: spacing.md },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  actionCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: spacing.md, alignItems: 'center', gap: spacing.sm,
    minHeight: 90, justifyContent: 'center',
  },
  actionCardPrimary: { backgroundColor: colors.primary },
  actionLabel: {
    fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: colors.textPrimary,
  },
});
