import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { useAuthStore } from '../../store/authStore';
import { getPickRequestsByFarmer, updatePickRequestStatus } from '../../lib/pickRequests';
import { sendNotification } from '../../lib/notifications';
import { getOrCreateConversation } from '../../lib/chat';

export default function FarmerPickRequestsScreen() {
  const router = useRouter();
  const farmerId = useAuthStore((s) => s.farmerId);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadRequests = async () => {
    if (!farmerId) return;
    setLoading(true);
    try {
      const data = await getPickRequestsByFarmer(farmerId);
      setRequests(data);
    } catch (err) {
      console.log('Error loading pick requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [farmerId])
  );

  const handleStatusUpdate = async (requestId: string, status: string, buyerId: string) => {
    setActionLoading(requestId);
    try {
      await updatePickRequestStatus(requestId, status);

      // Notify buyer
      const message = status === 'accepted'
        ? 'تم قبول طلب القطف الخاص بك'
        : 'تم رفض طلب القطف الخاص بك';
      await sendNotification(buyerId, 'pick_request', 'تحديث طلب القطف', message).catch(() => {});

      await loadRequests();
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
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-EG', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return { text: 'بانتظار الرد', color: colors.secondary };
      case 'accepted': return { text: 'مقبول', color: colors.success };
      case 'rejected': return { text: 'مرفوض', color: colors.error };
      default: return { text: status, color: colors.textMuted };
    }
  };

  const renderRequest = ({ item }: { item: any }) => {
    const buyer = item.users;
    const product = item.products;
    const status = getStatusLabel(item.status);
    const isLoading = actionLoading === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
          </View>
          <View style={styles.buyerRow}>
            <View>
              <Text style={styles.buyerName}>{buyer?.full_name || 'مشتري'}</Text>
              <Text style={styles.productName}>{product?.name || 'منتج'}</Text>
            </View>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={18} color={colors.primary} />
            </View>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
            <Text style={styles.detailText}>{formatDate(item.requested_date)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={14} color={colors.textMuted} />
            <Text style={styles.detailText}>{item.requested_time || '--'}</Text>
          </View>
          {item.quantity && (
            <View style={styles.detailItem}>
              <Ionicons name="scale-outline" size={14} color={colors.textMuted} />
              <Text style={styles.detailText}>{item.quantity}</Text>
            </View>
          )}
        </View>

        {item.status === 'pending' && (
          <View style={styles.actionsRow}>
            <Button
              title="رفض"
              onPress={() => handleStatusUpdate(item.id, 'rejected', item.buyer_id)}
              variant="danger"
              size="sm"
              style={{ flex: 1 }}
              loading={isLoading}
            />
            <Button
              title="قبول"
              onPress={() => handleStatusUpdate(item.id, 'accepted', item.buyer_id)}
              size="sm"
              style={{ flex: 1 }}
              loading={isLoading}
            />
          </View>
        )}

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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>طلبات القطف</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderRequest}
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 20 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 80 }}>
              <Ionicons name="hand-left-outline" size={60} color={colors.textMuted} />
              <Text style={styles.emptyText}>لا توجد طلبات قطف</Text>
            </View>
          }
        />
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
  card: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  buyerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatarCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#E8F5E1', alignItems: 'center', justifyContent: 'center',
  },
  buyerName: {
    fontFamily: 'Cairo_600SemiBold', fontSize: 15, color: colors.textPrimary, textAlign: 'right',
  },
  productName: {
    fontFamily: 'Cairo_400Regular', fontSize: 13, color: colors.textMuted, textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full,
  },
  statusText: { fontFamily: 'Cairo_600SemiBold', fontSize: 11 },
  detailsRow: {
    flexDirection: 'row-reverse', gap: spacing.md, marginTop: spacing.sm,
    paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border,
  },
  detailItem: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 4,
  },
  detailText: { fontFamily: 'Cairo_400Regular', fontSize: 12, color: colors.textMuted },
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
