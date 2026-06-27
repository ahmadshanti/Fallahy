import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { useAuthStore } from '../../store/authStore';
import { getOrdersByFarmer } from '../../lib/orders';
import { isDevMode } from '../../lib/devMode';
import { useDevOrdersStore } from '../../store/devOrdersStore';

const periods = ['اليوم', 'الأسبوع', 'الشهر'];

export default function EarningsScreen() {
  const router = useRouter();
  const farmerId = useAuthStore((s) => s.farmerId);
  const devOrders = useDevOrdersStore((s) => s.orders);
  const [period, setPeriod] = useState('اليوم');
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (farmerId) loadEarnings();
  }, [farmerId, period]);

  const loadEarnings = async () => {
    if (!farmerId) return;
    setLoading(true);
    try {
      const orders = isDevMode ? devOrders : await getOrdersByFarmer(farmerId);
      const deliveredOrders = orders.filter((o: any) => o.status === 'delivered');

      const now = new Date();
      let startDate: Date;

      if (period === 'اليوم') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (period === 'الأسبوع') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const filtered = deliveredOrders.filter(
        (o: any) => new Date(o.created_at) >= startDate
      );

      const totalAmount = filtered.reduce((sum: number, o: any) => sum + (o.total_price || 0), 0);
      setTotal(totalAmount);

      // Map to transactions
      const txList = filtered.map((o: any) => ({
        id: o.id,
        buyerName: o.users?.full_name || 'مشتري',
        amount: o.total_price || 0,
        date: new Date(o.created_at).toLocaleDateString('ar-EG', {
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        }),
        items: (o.order_items || []).map((i: any) => i.products?.name || '').filter(Boolean).join(', '),
      }));
      setTransactions(txList);
    } catch (err) {
      console.log('Earnings error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الأرباح</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Period Tabs */}
        <View style={styles.tabsRow}>
          {periods.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.tab, period === p && styles.tabActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.tabText, period === p && styles.tabTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Total */}
        <View style={styles.totalCard}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <>
              <Text style={styles.totalLabel}>إجمالي الأرباح</Text>
              <Text style={styles.totalAmount}>{total.toFixed(2)} ₪</Text>
            </>
          )}
        </View>

        {/* Transactions */}
        <Text style={styles.sectionTitle}>المعاملات الأخيرة</Text>
        {loading ? (
          <View style={{ padding: spacing.lg, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : transactions.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: spacing.xl }}>
            <Ionicons name="wallet-outline" size={50} color={colors.textMuted} />
            <Text style={styles.emptyText}>لا توجد معاملات في هذه الفترة</Text>
          </View>
        ) : (
          transactions.map((tx) => (
            <View key={tx.id} style={styles.txCard}>
              <View style={styles.txRow}>
                <Text style={styles.txAmount}>+{tx.amount.toFixed(2)} ₪</Text>
                <View style={styles.txInfo}>
                  <Text style={styles.txBuyer}>{tx.buyerName}</Text>
                  {tx.items ? <Text style={styles.txItems}>{tx.items}</Text> : null}
                  <Text style={styles.txDate}>{tx.date}</Text>
                </View>
                <View style={styles.txAvatar}>
                  <Ionicons name="person" size={18} color={colors.primary} />
                </View>
              </View>
            </View>
          ))
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
  tabsRow: {
    flexDirection: 'row-reverse', paddingHorizontal: spacing.md, gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: radius.lg,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: colors.textSecondary },
  tabTextActive: { color: '#FFFFFF' },
  totalCard: {
    alignItems: 'center', paddingVertical: spacing.lg, marginHorizontal: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.xl, marginBottom: spacing.md,
  },
  totalLabel: {
    fontFamily: 'Cairo_400Regular', fontSize: 14, color: colors.textMuted, marginBottom: 4,
  },
  totalAmount: {
    fontFamily: 'Cairo_700Bold', fontSize: 36, color: colors.primary,
  },
  sectionTitle: {
    fontFamily: 'Cairo_700Bold', fontSize: 18, color: colors.textPrimary,
    textAlign: 'right', writingDirection: 'rtl',
    paddingHorizontal: spacing.md, marginBottom: spacing.sm,
  },
  emptyText: {
    fontFamily: 'Cairo_400Regular', fontSize: 14, color: colors.textMuted,
    marginTop: spacing.md,
  },
  txCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: spacing.md, marginHorizontal: spacing.md, marginBottom: spacing.sm,
  },
  txRow: {
    flexDirection: 'row', alignItems: 'center',
  },
  txAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#E8F5E1', alignItems: 'center', justifyContent: 'center',
  },
  txInfo: { flex: 1, marginLeft: spacing.sm, marginRight: spacing.sm },
  txBuyer: {
    fontFamily: 'Cairo_600SemiBold', fontSize: 15, color: colors.textPrimary, textAlign: 'right',
  },
  txItems: {
    fontFamily: 'Cairo_400Regular', fontSize: 12, color: colors.textMuted, textAlign: 'right',
  },
  txDate: {
    fontFamily: 'Cairo_400Regular', fontSize: 11, color: colors.textMuted, textAlign: 'right',
  },
  txAmount: {
    fontFamily: 'Cairo_700Bold', fontSize: 18, color: colors.success,
  },
});
