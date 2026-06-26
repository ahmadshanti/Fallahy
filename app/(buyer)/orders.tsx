import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  StatusBar,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { getOrdersByBuyer } from '../../lib/orders';
import { Order } from '../../types';

const FILTER_TABS = [
  { key: 'all', label: 'الكل' },
  { key: 'active', label: 'جارية' },
  { key: 'completed', label: 'مكتملة' },
  { key: 'rejected', label: 'مرفوضة' },
];

const STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: 'قيد الانتظار', color: colors.secondary, icon: 'time-outline' },
  accepted: { label: 'تم القبول', color: colors.primary, icon: 'checkmark-circle-outline' },
  preparing: { label: 'قيد التحضير', color: '#2196F3', icon: 'construct-outline' },
  out_for_delivery: { label: 'في الطريق', color: '#9C27B0', icon: 'bicycle-outline' },
  delivered: { label: 'تم التسليم', color: colors.success, icon: 'checkmark-done-outline' },
  rejected: { label: 'مرفوض', color: colors.error, icon: 'close-circle-outline' },
  cancelled: { label: 'ملغي', color: colors.textMuted, icon: 'ban-outline' },
};

export default function OrdersScreen() {
  const router = useRouter();
  const { buyerId } = useAuthStore();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    if (!buyerId) return;
    try {
      setLoading(true);
      const data = await getOrdersByBuyer(buyerId);
      setOrders(data);
    } catch (err) {
      console.error('Orders load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'active') {
      return ['pending', 'accepted', 'preparing', 'out_for_delivery'].includes(order.status);
    }
    if (activeFilter === 'completed') return order.status === 'delivered';
    if (activeFilter === 'rejected') return ['rejected', 'cancelled'].includes(order.status);
    return true;
  });

  const renderOrderCard = ({ item }: { item: Order }) => {
    const st = STATUS_MAP[item.status] || STATUS_MAP.pending;
    const itemNames = (item.order_items || [])
      .map((oi) => oi.products?.name || '')
      .filter(Boolean)
      .join(', ');
    const firstItemImage = item.order_items?.[0]?.products?.image_url;

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => router.push(`/(buyer)/order-tracking/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          <View style={[styles.statusBadge, { backgroundColor: st.color + '15' }]}>
            <Ionicons name={st.icon as any} size={14} color={st.color} />
            <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
          </View>
          <Text style={styles.orderDate}>
            {new Date(item.created_at).toLocaleDateString('ar')}
          </Text>
        </View>

        <View style={styles.orderBody}>
          <View style={styles.orderInfoRight}>
            <Text style={styles.farmName}>
              {item.farmers?.farm_name || 'مزرعة'}
            </Text>
            <Text style={styles.orderItems} numberOfLines={2}>
              {itemNames || 'بدون عناصر'}
            </Text>
          </View>
          {firstItemImage ? (
            <Image source={{ uri: firstItemImage }} style={styles.orderImage} />
          ) : (
            <View style={[styles.orderImage, styles.placeholderImg]}>
              <Ionicons name="bag-outline" size={24} color={colors.textMuted} />
            </View>
          )}
        </View>

        <View style={styles.orderFooter}>
          <Ionicons name="chevron-back" size={18} color={colors.textMuted} />
          <Text style={styles.orderTotal}>{item.total_price.toFixed(2)} د.أ</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>طلباتي</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {FILTER_TABS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.filterTab, activeFilter === item.key && styles.filterTabActive]}
            onPress={() => setActiveFilter(item.key)}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === item.key && styles.filterTabTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bag-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>لا توجد طلبات</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 20,
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  filterRow: {
    flexDirection: 'row-reverse',
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 12,
  },
  filterTab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterTabText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: colors.textSecondary,
  },
  filterTabTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 11,
  },
  orderDate: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  orderBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  orderImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  placeholderImg: {
    backgroundColor: colors.surfaceDim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderInfoRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  farmName: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  orderItems: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 2,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  orderTotal: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 16,
    color: colors.primary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 60,
  },
  emptyText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 15,
    color: colors.textMuted,
    writingDirection: 'rtl',
  },
});
