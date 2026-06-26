import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Avatar from '../../components/ui/Avatar';
import MetricCard from '../../components/farmer/MetricCard';
import AlertCard from '../../components/farmer/AlertCard';
import QuickActionCard from '../../components/farmer/QuickActionCard';
import EarningsChart from '../../components/farmer/EarningsChart';
import SectionHeader from '../../components/buyer/SectionHeader';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { useAuthStore } from '../../store/authStore';
import { useFarmerAlerts } from '../../hooks/useAlerts';
import { useFarmerMetrics } from '../../hooks/useEarnings';

export default function FarmerDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: alerts = [] } = useFarmerAlerts(user?.id || '');
  const { data: metrics } = useFarmerMetrics(user?.id || '');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <View style={styles.headerText}>
              <Text style={styles.greeting}>صباح الخير</Text>
              <Text style={styles.farmName}>{user?.name || 'مزرعتي'}</Text>
            </View>
            <Avatar uri={user?.avatar || 'https://i.pravatar.cc/100?img=12'} size={60} />
          </View>
        </View>

        {/* Metrics */}
        <View style={styles.metricsRow}>
          <MetricCard icon="cube-outline" value={`${metrics?.ordersToday || 0}`} label="الطلبات اليوم" />
          <MetricCard icon="wallet-outline" value={`${metrics?.salesToday || 0} ₪`} label="المبيعات" />
          <MetricCard icon="star-outline" value="4.8" label="التقييم" />
        </View>

        {/* Smart Alerts */}
        <SectionHeader title="تنبيهات ذكية" />
        <View style={styles.alertsSection}>
          {alerts.length === 0 ? (
            <Text style={styles.emptyText}>لا توجد تنبيهات حالياً</Text>
          ) : (
            alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onAction={() => alert.actionRoute ? router.push(alert.actionRoute as any) : undefined}
              />
            ))
          )}
        </View>

        {/* Quick Actions */}
        <SectionHeader title="إجراءات سريعة" />
        <View style={styles.actionsGrid}>
          <View style={styles.actionsRow}>
            <QuickActionCard
              icon="add-circle-outline"
              label="إضافة منتج"
              onPress={() => router.push('/(farmer)/add-product')}
              isPrimary
            />
            <QuickActionCard
              icon="clipboard-outline"
              label="طلباتي"
              onPress={() => router.push('/(farmer)/orders')}
            />
          </View>
          <View style={styles.actionsRow}>
            <QuickActionCard
              icon="wallet-outline"
              label="أرباحي"
              onPress={() => router.push('/(farmer)/earnings')}
            />
            <QuickActionCard
              icon="flash-outline"
              label="عرض سريع"
              onPress={() => router.push('/(farmer)/flash-deal')}
            />
          </View>
        </View>

        {/* Analytics Preview */}
        <SectionHeader title="نظرة على أداء المزرعة" />
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsSubtitle}>
            توقعات الطلب للأسبوع القادم مرتفعة بنسبة 15%
          </Text>
          <EarningsChart />
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
  bellIcon: { fontSize: 24 },
  metricsRow: {
    flexDirection: 'row', paddingHorizontal: spacing.md, gap: spacing.sm,
  },
  alertsSection: { paddingHorizontal: spacing.md },
  emptyText: {
    fontFamily: 'Cairo_400Regular', fontSize: 14, color: colors.textMuted,
    textAlign: 'center', paddingVertical: spacing.md,
  },
  actionsGrid: { paddingHorizontal: spacing.md },
  actionsRow: { flexDirection: 'row', marginBottom: spacing.sm },
  analyticsCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    marginHorizontal: spacing.md,
  },
  analyticsSubtitle: {
    fontFamily: 'Cairo_400Regular', fontSize: 13, color: colors.textSecondary,
    textAlign: 'right', writingDirection: 'rtl', padding: spacing.md, paddingBottom: 0,
  },
});
