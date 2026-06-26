import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { useAuthStore } from '../../store/authStore';
import { useFarmerOrders, useUpdateOrderStatus } from '../../hooks/useOrders';

const tabs = ['جديدة', 'جارية', 'مكتملة'];

const statusMap: Record<string, string> = {
  'جديدة': 'received',
  'جارية': 'preparing',
  'مكتملة': 'delivered',
};

export default function FarmerOrdersScreen() {
  const [activeTab, setActiveTab] = useState('جديدة');
  const { user } = useAuthStore();
  const { data: orders = [], isLoading } = useFarmerOrders(user?.id || '');
  const updateStatus = useUpdateOrderStatus();

  const filteredOrders = orders.filter((order: any) => {
    const tabStatus = statusMap[activeTab];
    if (activeTab === 'جديدة') return order.status === 'received';
    if (activeTab === 'جارية') return order.status === 'preparing' || order.status === 'on_the_way';
    if (activeTab === 'مكتملة') return order.status === 'delivered' || order.status === 'cancelled';
    return true;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.pageTitle}>إدارة الطلبات</Text>

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

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.listContainer}>
          <FlashList
            data={filteredOrders}

            renderItem={({ item }: { item: any }) => (
              <View style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View style={styles.buyerInfo}>
                    <Text style={styles.buyerName}>{item.buyerName || 'مشتري'}</Text>
                    <Text style={styles.orderTime}>{item.placedAt}</Text>
                  </View>
                  <Avatar uri={item.buyerAvatar || ''} size={44} />
                </View>
                <Text style={styles.orderItems}>
                  {(item.items || []).map((i: any) => `${i.name} × ${i.qty}`).join('، ')}
                </Text>
                <Text style={styles.orderTotal}>₪{(item.total || 0).toFixed(2)}</Text>
                {item.status === 'received' && (
                  <View style={styles.actionsRow}>
                    <Button
                      title="رفض ✗"
                      onPress={() => updateStatus.mutate({ orderId: item.orderUuid, status: 'cancelled' })}
                      variant="danger"
                      size="sm"
                      style={{ flex: 1 }}
                    />
                    <Button
                      title="قبول ✓"
                      onPress={() => updateStatus.mutate({ orderId: item.orderUuid, status: 'preparing' })}
                      size="sm"
                      style={{ flex: 1 }}
                    />
                  </View>
                )}
                <TouchableOpacity style={styles.whatsappLink}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                    <Text style={styles.whatsappText}>تواصل مع المشتري</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingTop: 80 }}>
                <Ionicons name="clipboard-outline" size={60} color={colors.textMuted} />
                <Text style={{ fontFamily: 'Cairo_600SemiBold', fontSize: 16, color: colors.textMuted, marginTop: spacing.md }}>
                  لا توجد طلبات في هذا القسم
                </Text>
              </View>
            }
          />
        </View>
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
  listContainer: { flex: 1, paddingHorizontal: spacing.md },
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
  whatsappLink: { marginTop: spacing.sm, alignItems: 'flex-end' },
  whatsappText: {
    fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: '#25D366',
  },
});
