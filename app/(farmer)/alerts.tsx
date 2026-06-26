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
import { getPickRequestsByFarmer } from '../../lib/pickRequests';

interface AlertItem {
  id: string;
  type: 'low_stock' | 'pending_order' | 'pick_request';
  title: string;
  body: string;
  icon: string;
  iconColor: string;
  bgColor: string;
  route?: string;
}

export default function FarmerAlertsScreen() {
  const router = useRouter();
  const farmerId = useAuthStore((s) => s.farmerId);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (farmerId) loadAlerts();
  }, [farmerId]);

  const loadAlerts = async () => {
    if (!farmerId) return;
    setLoading(true);
    try {
      const [products, orders, pickRequests] = await Promise.all([
        getProductsByFarmer(farmerId),
        getOrdersByFarmer(farmerId),
        getPickRequestsByFarmer(farmerId),
      ]);

      const alertsList: AlertItem[] = [];

      // Low stock products
      const lowStock = products.filter((p: any) => p.quantity_available < 5);
      lowStock.forEach((p: any) => {
        alertsList.push({
          id: `stock-${p.id}`,
          type: 'low_stock',
          title: 'مخزون منخفض',
          body: `${p.name} - الكمية المتبقية: ${p.quantity_available} ${p.unit}`,
          icon: 'warning-outline',
          iconColor: '#F57C00',
          bgColor: '#FFF3E0',
          route: '/(farmer)/products',
        });
      });

      // Pending orders
      const pendingOrders = orders.filter((o: any) => o.status === 'pending');
      pendingOrders.forEach((o: any) => {
        alertsList.push({
          id: `order-${o.id}`,
          type: 'pending_order',
          title: 'طلب جديد بانتظار الرد',
          body: `من ${o.users?.full_name || 'مشتري'} - ${o.total_price?.toFixed(2)} ₪`,
          icon: 'bag-outline',
          iconColor: '#1976D2',
          bgColor: '#E3F2FD',
          route: '/(farmer)/orders',
        });
      });

      // Pending pick requests
      const pendingPicks = pickRequests.filter((r: any) => r.status === 'pending');
      pendingPicks.forEach((r: any) => {
        alertsList.push({
          id: `pick-${r.id}`,
          type: 'pick_request',
          title: 'طلب قطف جديد',
          body: `من ${r.users?.full_name || 'مشتري'} - ${r.products?.name || 'منتج'}`,
          icon: 'hand-left-outline',
          iconColor: '#7B1FA2',
          bgColor: '#F3E5F5',
          route: '/(farmer)/pick-requests',
        });
      });

      setAlerts(alertsList);
    } catch (err) {
      console.log('Alerts error:', err);
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
        <Text style={styles.headerTitle}>التنبيهات الذكية</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {alerts.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 80 }}>
              <Ionicons name="checkmark-circle-outline" size={60} color={colors.success} />
              <Text style={styles.emptyText}>لا توجد تنبيهات حالياً</Text>
              <Text style={styles.emptySubText}>كل شيء على ما يرام</Text>
            </View>
          ) : (
            alerts.map((alert) => (
              <TouchableOpacity
                key={alert.id}
                style={styles.alertCard}
                onPress={() => alert.route && router.push(alert.route as any)}
              >
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertBody}>{alert.body}</Text>
                </View>
                <View style={[styles.alertIcon, { backgroundColor: alert.bgColor }]}>
                  <Ionicons name={alert.icon as any} size={22} color={alert.iconColor} />
                </View>
              </TouchableOpacity>
            ))
          )}
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
  headerTitle: { fontFamily: 'Cairo_700Bold', fontSize: 18, color: colors.textPrimary },
  list: { padding: spacing.md, paddingBottom: 40 },
  alertCard: {
    flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: spacing.md, marginBottom: spacing.sm, alignItems: 'center',
  },
  alertIcon: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
  },
  alertContent: { flex: 1, marginHorizontal: spacing.sm },
  alertTitle: {
    fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: colors.textPrimary,
    textAlign: 'right', writingDirection: 'rtl',
  },
  alertBody: {
    fontFamily: 'Cairo_400Regular', fontSize: 12, color: colors.textMuted,
    textAlign: 'right', writingDirection: 'rtl', marginTop: 2,
  },
  emptyText: {
    fontFamily: 'Cairo_600SemiBold', fontSize: 16, color: colors.textMuted, marginTop: spacing.md,
  },
  emptySubText: {
    fontFamily: 'Cairo_400Regular', fontSize: 14, color: colors.textMuted, marginTop: spacing.xs,
  },
});
