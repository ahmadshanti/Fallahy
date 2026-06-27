import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { useAuthStore } from '../../store/authStore';
import { getOrdersByFarmer, updateOrderStatus } from '../../lib/orders';
import { sendNotification } from '../../lib/notifications';
import { getOrCreateConversation } from '../../lib/chat';
import { supabase } from '../../lib/supabase';
import { isDevMode } from '../../lib/devMode';
import { useDevOrdersStore } from '../../store/devOrdersStore';

const tabs = [
  { key: 'pending', label: 'جديدة' },
  { key: 'active', label: 'جارية' },
  { key: 'delivered', label: 'مكتملة' },
  { key: 'rejected', label: 'مرفوضة' },
];

export default function FarmerOrdersScreen() {
  const router = useRouter();
  const farmerId = useAuthStore((s) => s.farmerId);
  const devOrders = useDevOrdersStore((s) => s.orders);
  const updateDevOrderStatus = useDevOrdersStore((s) => s.updateStatus);
  const [activeTab, setActiveTab] = useState('pending');
  const [dbOrders, setDbOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadOrders = async () => {
    if (!farmerId) return;
    setLoading(true);
    try {
      if (isDevMode) {
        setDbOrders([]);
        return;
      }
      const data = await getOrdersByFarmer(farmerId);
      setDbOrders(data);
    } catch (err) {
      console.log('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // In dev mode show ALL dev orders (so we can test approval end-to-end
  // even when the buyer ordered from a real farmer's product, not our fake one)
  const orders = isDevMode
    ? [
        ...devOrders.map((o) => ({
          id: o.id,
          buyer_id: o.buyer_id,
          farmer_id: o.farmer_id,
          status: o.status,
          total_price: o.total_price,
          delivery_address: o.delivery_address,
          notes: o.notes,
          created_at: o.created_at,
          order_items: o.items.map((it, idx) => ({
            id: `${o.id}-${idx}`,
            order_id: o.id,
            product_id: it.product_id,
            quantity: it.quantity,
            unit_price: it.unit_price,
            sale_type: it.sale_type,
            products: { name: it.product_name || '' },
          })),
          users: { full_name: 'مستخدم تجريبي', phone: '+970590000001' },
        })),
        ...dbOrders,
      ]
    : dbOrders;

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [farmerId])
  );

  // Subscribe to realtime new orders (skip in dev mode — no DB rows)
  useEffect(() => {
    if (!farmerId || isDevMode) return;
    const channel = supabase
      .channel(`farmer-orders-${farmerId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `farmer_id=eq.${farmerId}`,
      }, () => {
        loadOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [farmerId]);

  const filteredOrders = orders.filter((order: any) => {
    if (activeTab === 'pending') return order.status === 'pending';
    if (activeTab === 'active') return ['accepted', 'preparing', 'out_for_delivery'].includes(order.status);
    if (activeTab === 'delivered') return order.status === 'delivered';
    if (activeTab === 'rejected') return order.status === 'rejected';
    return true;
  });

  const handleStatusUpdate = async (orderId: string, newStatus: string, buyerId?: string) => {
    setActionLoading(orderId);
    try {
      if (isDevMode || orderId.startsWith('dev-order-')) {
        // Dev order — update local store (buyer's view reacts via zustand)
        updateDevOrderStatus(orderId, newStatus);
      } else {
        await updateOrderStatus(orderId, newStatus);
        if (buyerId) {
          const statusMessages: Record<string, string> = {
            accepted: 'تم قبول طلبك',
            rejected: 'تم رفض طلبك',
            preparing: 'بدأ تجهيز طلبك',
            out_for_delivery: 'طلبك خرج من المزرعة',
            delivered: 'تم تسليم طلبك',
          };
          const message = statusMessages[newStatus] || 'تم تحديث حالة طلبك';
          await sendNotification(buyerId, 'order_update', 'تحديث الطلب', message).catch(() => {});
        }
        await loadOrders();
      }
    } catch (err: any) {
      Alert.alert('خطأ', err?.message || 'فشل تحديث الطلب');
    } finally {
      setActionLoading(null);
    }
  };

  const handleChat = async (buyerId: string) => {
    if (!farmerId) return;
    try {
      const conversation = await getOrCreateConversation(buyerId, farmerId);
      router.push(`/(farmer)/chat-thread/${conversation.id}`);
    } catch (err: any) {
      Alert.alert('خطأ', err?.message || 'فشل فتح المحادثة');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusActions = (order: any) => {
    const isLoading = actionLoading === order.id;
    switch (order.status) {
      case 'pending':
        return (
          <View style={styles.actionsRow}>
            <Button
              title="رفض"
              onPress={() => handleStatusUpdate(order.id, 'rejected', order.buyer_id)}
              variant="danger"
              size="sm"
              style={{ flex: 1 }}
              loading={isLoading}
              icon={<Ionicons name="close" size={16} color="#FFFFFF" />}
            />
            <Button
              title="قبول"
              onPress={() => handleStatusUpdate(order.id, 'accepted', order.buyer_id)}
              size="sm"
              style={{ flex: 1 }}
              loading={isLoading}
              icon={<Ionicons name="checkmark" size={16} color="#FFFFFF" />}
            />
          </View>
        );
      case 'accepted':
        return (
          <Button
            title="بدأت التجهيز"
            onPress={() => handleStatusUpdate(order.id, 'preparing', order.buyer_id)}
            size="sm"
            fullWidth
            loading={isLoading}
          />
        );
      case 'preparing':
        return (
          <Button
            title="خرج من المزرعة"
            onPress={() => handleStatusUpdate(order.id, 'out_for_delivery', order.buyer_id)}
            size="sm"
            fullWidth
            loading={isLoading}
          />
        );
      case 'out_for_delivery':
        return (
          <Button
            title="تم التسليم"
            onPress={() => handleStatusUpdate(order.id, 'delivered', order.buyer_id)}
            size="sm"
            fullWidth
            loading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  const renderOrder = ({ item }: { item: any }) => {
    const buyer = item.users;
    const items = item.order_items || [];

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={styles.buyerInfo}>
            <Text style={styles.buyerName}>{buyer?.full_name || 'مشتري'}</Text>
            <Text style={styles.orderTime}>{formatDate(item.created_at)}</Text>
          </View>
          <View style={styles.buyerAvatar}>
            <Ionicons name="person" size={20} color={colors.primary} />
          </View>
        </View>

        <Text style={styles.orderItems}>
          {items.map((i: any) => `${i.products?.name || 'منتج'} x ${i.quantity}`).join(' ، ')}
        </Text>

        <Text style={styles.orderTotal}>{item.total_price?.toFixed(2)} ₪</Text>

        {getStatusActions(item)}

        <TouchableOpacity
          style={styles.chatLink}
          onPress={() => handleChat(item.buyer_id)}
        >
          <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
          <Text style={styles.chatLinkText}>دردشة مع المشتري</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.pageTitle}>إدارة الطلبات</Text>

      <View style={styles.tabsRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrder}
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 20 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 80 }}>
              <Ionicons name="clipboard-outline" size={60} color={colors.textMuted} />
              <Text style={styles.emptyText}>لا توجد طلبات في هذا القسم</Text>
            </View>
          }
        />
      )}
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
    flexDirection: 'row-reverse', paddingHorizontal: spacing.md, gap: spacing.xs,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: radius.lg,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: colors.textSecondary },
  tabTextActive: { color: '#FFFFFF' },
  orderCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  orderHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  buyerInfo: { flex: 1, marginLeft: spacing.sm },
  buyerName: {
    fontFamily: 'Cairo_700Bold', fontSize: 16, color: colors.textPrimary, textAlign: 'right',
  },
  orderTime: {
    fontFamily: 'Cairo_400Regular', fontSize: 12, color: colors.textMuted, textAlign: 'right',
  },
  buyerAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#E8F5E1', alignItems: 'center', justifyContent: 'center',
  },
  orderItems: {
    fontFamily: 'Cairo_400Regular', fontSize: 14, color: colors.textSecondary,
    textAlign: 'right', writingDirection: 'rtl', marginTop: spacing.sm,
  },
  orderTotal: {
    fontFamily: 'Cairo_700Bold', fontSize: 18, color: colors.primary,
    textAlign: 'right', marginTop: spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm,
  },
  chatLink: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 4,
    marginTop: spacing.sm, alignSelf: 'flex-end',
  },
  chatLinkText: {
    fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: colors.primary,
  },
  emptyText: {
    fontFamily: 'Cairo_600SemiBold', fontSize: 16, color: colors.textMuted, marginTop: spacing.md,
  },
});
