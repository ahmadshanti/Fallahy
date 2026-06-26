import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';

const tabs = ['جديدة', 'جارية', 'مكتملة'];

const farmerOrders = [
  {
    id: 'ORD-001', buyerName: 'أحمد محمد', buyerAvatar: 'https://i.pravatar.cc/100?img=33',
    items: ['بندورة × 2', 'خيار × 1'], total: 12.0, time: '10:30 AM', status: 'new',
  },
  {
    id: 'ORD-002', buyerName: 'سامي خالد', buyerAvatar: 'https://i.pravatar.cc/100?img=45',
    items: ['بطاطا × 3'], total: 7.5, time: '10:15 AM', status: 'active',
  },
];

export default function FarmerOrdersScreen() {
  const [activeTab, setActiveTab] = useState('جديدة');

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

      <View style={styles.listContainer}>
        <FlashList
          data={farmerOrders}

          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={styles.buyerInfo}>
                  <Text style={styles.buyerName}>{item.buyerName}</Text>
                  <Text style={styles.orderTime}>{item.time}</Text>
                </View>
                <Avatar uri={item.buyerAvatar} size={44} />
              </View>
              <Text style={styles.orderItems}>{item.items.join('، ')}</Text>
              <Text style={styles.orderTotal}>₪{item.total.toFixed(2)}</Text>
              {item.status === 'new' && (
                <View style={styles.actionsRow}>
                  <Button title="رفض ✗" onPress={() => {}} variant="danger" size="sm" style={{ flex: 1 }} />
                  <Button title="قبول ✓" onPress={() => {}} size="sm" style={{ flex: 1 }} />
                </View>
              )}
              <TouchableOpacity style={styles.whatsappLink}>
                <Text style={styles.whatsappText}>تواصل مع المشتري 💬</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
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
