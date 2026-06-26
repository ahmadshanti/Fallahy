import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Avatar from '../../components/ui/Avatar';
import EarningsChart from '../../components/farmer/EarningsChart';
import Badge from '../../components/ui/Badge';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { useAuthStore } from '../../store/authStore';
import { useFarmerEarnings, useFarmerTransactions } from '../../hooks/useEarnings';

const periods = ['اليوم', 'الأسبوع', 'الشهر'];

export default function EarningsScreen() {
  const [period, setPeriod] = useState('اليوم');
  const { user } = useAuthStore();
  const { data: earnings, isLoading: earningsLoading } = useFarmerEarnings(user?.id || '', period);
  const { data: transactions = [], isLoading: txLoading } = useFarmerTransactions(user?.id || '');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.pageTitle}>أرباحي</Text>

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
          {earningsLoading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <>
              <Text style={styles.totalAmount}>{earnings?.total || 0} ₪</Text>
              <Badge label="↑ 23% مقارنة بالفترة السابقة" variant="fresh" />
            </>
          )}
        </View>

        {/* Chart */}
        <View style={styles.chartCard}>
          <EarningsChart />
        </View>

        {/* Transactions */}
        <Text style={styles.sectionTitle}>المعاملات الأخيرة</Text>
        {txLoading ? (
          <View style={{ padding: spacing.lg, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : transactions.length === 0 ? (
          <Text style={styles.emptyText}>لا توجد معاملات بعد</Text>
        ) : (
          transactions.map((tx: any) => (
            <View key={tx.id} style={styles.txCard}>
              <View style={styles.txRow}>
                <Text style={styles.txAmount}>+₪{tx.amount}</Text>
                <View style={styles.txInfo}>
                  <Text style={styles.txBuyer}>{tx.buyer}</Text>
                  <Text style={styles.txItems}>{tx.items}</Text>
                  <Text style={styles.txDate}>{tx.date}</Text>
                </View>
                <Avatar uri={tx.avatar || ''} size={40} />
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
  pageTitle: {
    fontFamily: 'Cairo_700Bold', fontSize: 22, color: colors.textPrimary,
    textAlign: 'right', paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    writingDirection: 'rtl',
  },
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
  totalAmount: {
    fontFamily: 'Cairo_700Bold', fontSize: 36, color: colors.primary, marginBottom: 8,
  },
  chartCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    marginHorizontal: spacing.md, marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: 'Cairo_700Bold', fontSize: 18, color: colors.textPrimary,
    textAlign: 'right', writingDirection: 'rtl',
    paddingHorizontal: spacing.md, marginBottom: spacing.sm,
  },
  emptyText: {
    fontFamily: 'Cairo_400Regular', fontSize: 14, color: colors.textMuted,
    textAlign: 'center', paddingVertical: spacing.lg,
  },
  txCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: spacing.md, marginHorizontal: spacing.md, marginBottom: spacing.sm,
  },
  txRow: {
    flexDirection: 'row', alignItems: 'center',
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
