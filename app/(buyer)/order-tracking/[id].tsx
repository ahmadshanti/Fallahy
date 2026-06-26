import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '../../../constants/colors';
import { useAuthStore } from '../../../store/authStore';
import { getOrderById, subscribeToOrder } from '../../../lib/orders';
import { getOrCreateConversation } from '../../../lib/chat';
import { Order } from '../../../types';

const STEPS = [
  { key: 'accepted', label: 'تم قبول الطلب', icon: 'checkmark-circle-outline' },
  { key: 'preparing', label: 'قيد التحضير', icon: 'construct-outline' },
  { key: 'out_for_delivery', label: 'في الطريق', icon: 'bicycle-outline' },
  { key: 'delivered', label: 'تم التسليم', icon: 'checkmark-done-outline' },
];

const STATUS_ORDER = ['pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered'];

export default function OrderTrackingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { buyerId } = useAuthStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadOrder();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const channel = subscribeToOrder(id, (updated) => {
      setOrder((prev) => (prev ? { ...prev, ...updated } : prev));
    });
    return () => {
      channel.unsubscribe();
    };
  }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const data = await getOrderById(id!);
      setOrder(data);
    } catch (err) {
      console.error('Order tracking load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    if (!buyerId || !order?.farmer_id) return;
    try {
      const conv = await getOrCreateConversation(buyerId, order.farmer_id);
      router.push(`/(buyer)/chat-thread/${conv.id}`);
    } catch {
      // Ignore
    }
  };

  const handleWhatsApp = () => {
    const whatsapp = (order?.farmers as any)?.whatsapp_number;
    if (!whatsapp) return;
    const num = whatsapp.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/${num}`);
  };

  const getStepStatus = (stepKey: string): 'done' | 'active' | 'pending' => {
    if (!order) return 'pending';
    const status = order.status;

    if (status === 'rejected' || status === 'cancelled') return 'pending';

    const currentIndex = STATUS_ORDER.indexOf(status);
    const stepIndex = STATUS_ORDER.indexOf(stepKey);

    if (stepIndex < 0 || currentIndex < 0) return 'pending';

    // pending counts as step 0 before accepted
    if (status === 'pending') {
      return 'pending'; // all steps pending when just submitted
    }

    if (stepIndex < currentIndex) return 'done';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
        <Text style={styles.emptyText}>الطلب غير موجود</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.goBackBtn}>
          <Text style={styles.goBackText}>رجوع</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isRejected = order.status === 'rejected' || order.status === 'cancelled';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>تتبع الطلب</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Rejection Notice */}
        {isRejected && (
          <View style={styles.rejectionBox}>
            <Ionicons name="close-circle" size={24} color={colors.error} />
            <Text style={styles.rejectionText}>
              تم {order.status === 'rejected' ? 'رفض' : 'إلغاء'} هذا الطلب
            </Text>
          </View>
        )}

        {/* Order Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>
              {new Date(order.created_at).toLocaleDateString('ar')}
            </Text>
            <Text style={styles.infoLabel}>تاريخ الطلب</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{order.farmers?.farm_name || 'مزرعة'}</Text>
            <Text style={styles.infoLabel}>المزرعة</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoValue, { color: colors.primary }]}>
              {order.total_price.toFixed(2)} د.أ
            </Text>
            <Text style={styles.infoLabel}>الإجمالي</Text>
          </View>
          {order.delivery_address && (
            <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{order.delivery_address}</Text>
              <Text style={styles.infoLabel}>العنوان</Text>
            </View>
          )}
        </View>

        {/* Timeline */}
        {!isRejected && (
          <View style={styles.timelineSection}>
            <Text style={styles.sectionTitle}>حالة الطلب</Text>
            <View style={styles.timeline}>
              {STEPS.map((step, index) => {
                const stepStatus = getStepStatus(step.key);
                const lineColor =
                  stepStatus === 'done'
                    ? colors.primary
                    : stepStatus === 'active'
                    ? colors.primary
                    : colors.border;
                const iconColor =
                  stepStatus === 'done'
                    ? colors.primary
                    : stepStatus === 'active'
                    ? colors.secondary
                    : colors.textMuted;
                const bgColor =
                  stepStatus === 'done'
                    ? colors.primary + '15'
                    : stepStatus === 'active'
                    ? colors.secondary + '15'
                    : colors.surfaceDim;

                return (
                  <View key={step.key} style={styles.timelineItem}>
                    <View style={styles.timelineLeft}>
                      {index < STEPS.length - 1 && (
                        <View style={[styles.timelineLine, { backgroundColor: lineColor }]} />
                      )}
                      <View style={[styles.timelineDot, { backgroundColor: bgColor }]}>
                        <Ionicons name={step.icon as any} size={20} color={iconColor} />
                      </View>
                    </View>
                    <View style={styles.timelineContent}>
                      <Text
                        style={[
                          styles.timelineLabel,
                          stepStatus === 'active' && styles.timelineLabelActive,
                          stepStatus === 'done' && styles.timelineLabelDone,
                        ]}
                      >
                        {step.label}
                      </Text>
                      {stepStatus === 'active' && (
                        <Text style={styles.timelineActive}>الحالة الحالية</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Order Items */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>عناصر الطلب</Text>
          {(order.order_items || []).map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <Text style={styles.orderItemPrice}>
                {(item.unit_price * item.quantity).toFixed(2)} د.أ
              </Text>
              <View style={styles.orderItemInfo}>
                <Text style={styles.orderItemName}>
                  {item.products?.name || 'منتج'}
                </Text>
                <Text style={styles.orderItemQty}>
                  {item.quantity} x {item.unit_price.toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Contact Buttons */}
        <View style={styles.contactRow}>
          <TouchableOpacity style={styles.chatBtn} onPress={handleChat}>
            <Ionicons name="chatbubble-outline" size={18} color="#fff" />
            <Text style={styles.chatBtnText}>دردشة</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsApp}>
            <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
            <Text style={styles.whatsappBtnText}>واتساب</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    gap: 12,
  },
  emptyText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 16,
    color: colors.textMuted,
    writingDirection: 'rtl',
  },
  goBackBtn: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  goBackText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: '#fff',
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  rejectionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    backgroundColor: colors.error + '10',
    borderWidth: 1,
    borderColor: colors.error + '30',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  rejectionText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 15,
    color: colors.error,
    writingDirection: 'rtl',
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: colors.textSecondary,
    writingDirection: 'rtl',
  },
  infoValue: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 13,
    color: colors.textPrimary,
    writingDirection: 'rtl',
    flex: 1,
    textAlign: 'left',
  },
  sectionTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 17,
    color: colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 12,
  },
  timelineSection: {
    marginBottom: 20,
  },
  timeline: {
    paddingRight: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 60,
  },
  timelineLeft: {
    width: 44,
    alignItems: 'center',
    position: 'relative',
  },
  timelineDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  timelineLine: {
    position: 'absolute',
    width: 2,
    top: 40,
    bottom: -20,
    left: 21,
  },
  timelineContent: {
    flex: 1,
    paddingRight: 12,
    paddingTop: 8,
    alignItems: 'flex-end',
  },
  timelineLabel: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: colors.textMuted,
    writingDirection: 'rtl',
  },
  timelineLabelActive: {
    color: colors.secondary,
    fontFamily: 'Cairo_700Bold',
  },
  timelineLabelDone: {
    color: colors.primary,
  },
  timelineActive: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 11,
    color: colors.secondary,
    writingDirection: 'rtl',
    marginTop: 2,
  },
  itemsSection: {
    marginBottom: 20,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  orderItemInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  orderItemName: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  orderItemQty: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 11,
    color: colors.textMuted,
    writingDirection: 'rtl',
  },
  orderItemPrice: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
    color: colors.primary,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  chatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  chatBtnText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: '#fff',
  },
  whatsappBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#25D366' + '15',
    borderWidth: 1.5,
    borderColor: '#25D366',
    paddingVertical: 14,
    borderRadius: 12,
  },
  whatsappBtnText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: '#25D366',
  },
});
