import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { useAuthStore } from '../../store/authStore';
import { useBuyerOrders } from '../../hooks/useOrders';

const tabs = ['الكل', 'جارية', 'مكتملة', 'ملغية'];

const statusLabels: Record<string, string> = {
  received: 'تم الاستلام',
  preparing: 'جارية',
  on_the_way: 'في الطريق',
  delivered: 'مكتملة',
};

const statusColors: Record<string, string> = {
  received: '#2196F3',
  preparing: '#2196F3',
  on_the_way: '#FF9800',
  delivered: colors.success,
};

export default function OrdersScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('الكل');
  const { user } = useAuthStore();
  const { data: orders = [], isLoading } = useBuyerOrders(user?.id || '');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.pageTitle}>طلباتي</Text>

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.listContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
        ) : (
          <FlashList
            data={orders}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.orderCard}
                onPress={() => router.push(`/(buyer)/order-tracking/${item.id}`)}
              >
                <View style={styles.orderHeader}>
                  <View style={[styles.statusBadge, { backgroundColor: (statusColors[item.status] || '#999') + '20' }]}>
                    <Text style={[styles.statusText, { color: statusColors[item.status] || '#999' }]}>
                      {statusLabels[item.status] || item.status}
                    </Text>
                  </View>
                  <Text style={styles.orderId}>#{item.id}</Text>
                </View>
                <Text style={styles.orderItems}>
                  {item.items.map((i: any) => `${i.name} × ${i.qty}`).join('، ')}
                </Text>
                <View style={styles.orderFooter}>
                  <Button title="إعادة الطلب" onPress={() => {}} variant="outlined" size="sm" />
                  <Text style={styles.orderTotal}>₪{item.total.toFixed(2)}</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="cube-outline" size={60} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>لا توجد طلبات</Text>
                <Text style={styles.emptySubtitle}>ابدأ بطلب خضار طازجة!</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  pageTitle: {
    fontFamily: 'Cairo_700Bold', fontSize: 24, color: colors.textPrimary,
    textAlign: 'right', paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    writingDirection: 'rtl',
  },
  tabsRow: {
    flexDirection: 'row-reverse', paddingHorizontal: spacing.md, gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.full,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: colors.textSecondary },
  tabTextActive: { color: '#FFFFFF' },
  listContainer: { flex: 1, paddingHorizontal: spacing.md },
  orderCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  orderHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.sm,
  },
  orderId: { fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: colors.textPrimary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full },
  statusText: { fontFamily: 'Cairo_600SemiBold', fontSize: 12 },
  orderItems: {
    fontFamily: 'Cairo_400Regular', fontSize: 14, color: colors.textSecondary,
    textAlign: 'right', writingDirection: 'rtl', marginBottom: spacing.sm,
  },
  orderFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  orderTotal: { fontFamily: 'Cairo_700Bold', fontSize: 16, color: colors.primary },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 60 },
  emptyTitle: { fontFamily: 'Cairo_700Bold', fontSize: 18, color: colors.textPrimary, marginTop: spacing.md },
  emptySubtitle: { fontFamily: 'Cairo_400Regular', fontSize: 14, color: colors.textMuted },
});
