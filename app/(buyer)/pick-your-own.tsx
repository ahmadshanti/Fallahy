import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  FlatList,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { getAllFarmers } from '../../lib/farmers';
import { getProductsByFarmer } from '../../lib/products';
import { createPickRequest, getPickRequestsByBuyer } from '../../lib/pickRequests';
import { sendNotification } from '../../lib/notifications';
import { isDevMode } from '../../lib/devMode';
import { Farmer, Product, PickRequest } from '../../types';

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00',
];

export default function PickYourOwnScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ farmerId?: string; productId?: string }>();
  const { buyerId } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'new' | 'requests'>('new');
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [myRequests, setMyRequests] = useState<PickRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedFarmer, setSelectedFarmer] = useState<string>(params.farmerId || '');
  const [selectedProduct, setSelectedProduct] = useState<string>(params.productId || '');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [quantity, setQuantity] = useState('1');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedFarmer) {
      loadFarmerProducts(selectedFarmer);
    }
  }, [selectedFarmer]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [farmerList, requests] = await Promise.all([
        getAllFarmers(),
        buyerId ? getPickRequestsByBuyer(buyerId) : Promise.resolve([]),
      ]);
      setFarmers(farmerList);
      setMyRequests(requests);

      if (params.farmerId) {
        await loadFarmerProducts(params.farmerId);
      }
    } catch (err) {
      console.error('Pick your own load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFarmerProducts = async (farmerId: string) => {
    try {
      const prods = await getProductsByFarmer(farmerId);
      setProducts(prods);
    } catch {
      setProducts([]);
    }
  };

  const generateDateOptions = () => {
    const dates = [];
    const now = new Date();
    for (let i = 1; i <= 14; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      dates.push({
        value: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('ar', { weekday: 'short', day: 'numeric', month: 'short' }),
      });
    }
    return dates;
  };

  const dateOptions = generateDateOptions();

  const handleSubmit = async () => {
    if (!buyerId) {
      Alert.alert('خطأ', 'يجب تسجيل الدخول أولا');
      return;
    }
    if (!selectedFarmer) {
      Alert.alert('خطأ', 'يرجى اختيار مزرعة');
      return;
    }
    if (!selectedProduct) {
      Alert.alert('خطأ', 'يرجى اختيار منتج');
      return;
    }
    if (!selectedDate) {
      Alert.alert('خطأ', 'يرجى اختيار تاريخ');
      return;
    }
    if (!selectedTime) {
      Alert.alert('خطأ', 'يرجى اختيار وقت');
      return;
    }

    try {
      setSubmitting(true);
      if (!isDevMode) {
        await createPickRequest({
          buyer_id: buyerId,
          farmer_id: selectedFarmer,
          product_id: selectedProduct,
          requested_date: selectedDate,
          requested_time: selectedTime,
          quantity: parseInt(quantity) || 1,
        });
        try {
          await sendNotification(
            selectedFarmer,
            'pick_request',
            'طلب قطف جديد',
            'لديك طلب قطف جديد',
            { product_id: selectedProduct }
          );
        } catch {
          // Non-critical
        }
      }

      Alert.alert('تم الإرسال', 'تم إرسال طلب القطف بنجاح');
      setSelectedFarmer('');
      setSelectedProduct('');
      setSelectedDate('');
      setSelectedTime('');
      setQuantity('1');
      setProducts([]);

      if (buyerId && !isDevMode) {
        const requests = await getPickRequestsByBuyer(buyerId);
        setMyRequests(requests);
      }
      setActiveTab('requests');
    } catch (err: any) {
      console.error('Pick request error:', err);
      Alert.alert('خطأ', err?.message || 'تعذر إرسال طلب القطف');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      pending: { label: 'قيد الانتظار', color: colors.secondary },
      accepted: { label: 'مقبول', color: colors.success },
      rejected: { label: 'مرفوض', color: colors.error },
      completed: { label: 'مكتمل', color: colors.primary },
    };
    return map[status] || map.pending;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>القطف بنفسك</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>
            طلباتي
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'new' && styles.tabActive]}
          onPress={() => setActiveTab('new')}
        >
          <Text style={[styles.tabText, activeTab === 'new' && styles.tabTextActive]}>
            طلب جديد
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'new' ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.formContent}
        >
          {/* Select Farmer */}
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>اختر المزرعة</Text>
            <FlatList
              data={farmers}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.selectionCard,
                    selectedFarmer === item.id && styles.selectionCardActive,
                  ]}
                  onPress={() => {
                    setSelectedFarmer(item.id);
                    setSelectedProduct('');
                  }}
                >
                  {item.owner_avatar_url ? (
                    <Image source={{ uri: item.owner_avatar_url }} style={styles.selAvatar} />
                  ) : (
                    <View style={[styles.selAvatar, styles.placeholderAvatar]}>
                      <Ionicons name="person" size={16} color={colors.textMuted} />
                    </View>
                  )}
                  <Text style={styles.selName} numberOfLines={1}>{item.farm_name}</Text>
                  <Text style={styles.selCity}>{item.city}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              horizontal
              inverted
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.selectionList}
            />
          </View>

          {/* Select Product */}
          {selectedFarmer && (
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>اختر المنتج</Text>
              {products.length === 0 ? (
                <Text style={styles.noDataText}>لا توجد منتجات لهذه المزرعة</Text>
              ) : (
                <FlatList
                  data={products}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.productChip,
                        selectedProduct === item.id && styles.productChipActive,
                      ]}
                      onPress={() => setSelectedProduct(item.id)}
                    >
                      <Text
                        style={[
                          styles.productChipText,
                          selectedProduct === item.id && styles.productChipTextActive,
                        ]}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item) => item.id}
                  horizontal
                  inverted
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipsRow}
                />
              )}
            </View>
          )}

          {/* Select Date */}
          {selectedProduct && (
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>اختر التاريخ</Text>
              <FlatList
                data={dateOptions}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.dateChip,
                      selectedDate === item.value && styles.dateChipActive,
                    ]}
                    onPress={() => setSelectedDate(item.value)}
                  >
                    <Text
                      style={[
                        styles.dateChipText,
                        selectedDate === item.value && styles.dateChipTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.value}
                horizontal
                inverted
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
              />
            </View>
          )}

          {/* Select Time */}
          {selectedDate && (
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>اختر الوقت</Text>
              <View style={styles.timeGrid}>
                {TIME_SLOTS.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.timeChip, selectedTime === t && styles.timeChipActive]}
                    onPress={() => setSelectedTime(t)}
                  >
                    <Text
                      style={[
                        styles.timeChipText,
                        selectedTime === t && styles.timeChipTextActive,
                      ]}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Quantity */}
          {selectedTime && (
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>الكمية (كغ)</Text>
              <View style={styles.quantityRow}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setQuantity(String(Math.max(1, (parseInt(quantity) || 1) - 1)))}
                >
                  <Ionicons name="remove" size={20} color={colors.primary} />
                </TouchableOpacity>
                <TextInput
                  style={styles.qtyInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  textAlign="center"
                />
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setQuantity(String((parseInt(quantity) || 0) + 1))}
                >
                  <Ionicons name="add" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Submit */}
          {selectedTime && (
            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="hand-left" size={20} color="#fff" />
                  <Text style={styles.submitBtnText}>إرسال طلب القطف</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      ) : (
        /* My Requests */
        myRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="hand-left-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>لا توجد طلبات قطف</Text>
          </View>
        ) : (
          <FlatList
            data={myRequests}
            renderItem={({ item }) => {
              const st = getStatusInfo(item.status);
              return (
                <View style={styles.requestCard}>
                  <View style={styles.requestHeader}>
                    <View style={[styles.reqStatusBadge, { backgroundColor: st.color + '15' }]}>
                      <Text style={[styles.reqStatusText, { color: st.color }]}>{st.label}</Text>
                    </View>
                    <Text style={styles.reqFarm}>
                      {item.farmers?.farm_name || 'مزرعة'}
                    </Text>
                  </View>
                  <Text style={styles.reqProduct}>
                    {item.products?.name || 'منتج'}
                  </Text>
                  <View style={styles.reqDetails}>
                    <View style={styles.reqDetailItem}>
                      <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                      <Text style={styles.reqDetailText}>{item.requested_date}</Text>
                    </View>
                    <View style={styles.reqDetailItem}>
                      <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                      <Text style={styles.reqDetailText}>{item.requested_time}</Text>
                    </View>
                    {item.quantity && (
                      <View style={styles.reqDetailItem}>
                        <Ionicons name="cube-outline" size={14} color={colors.textMuted} />
                        <Text style={styles.reqDetailText}>{item.quantity} كغ</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            }}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.requestsList}
          />
        )
      )}
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
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: colors.surfaceDim,
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#fff',
  },
  formContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 10,
  },
  selectionList: {
    gap: 10,
    paddingHorizontal: 4,
  },
  selectionCard: {
    width: 120,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectionCardActive: {
    borderColor: colors.primary,
  },
  selAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: 6,
  },
  placeholderAvatar: {
    backgroundColor: colors.surfaceDim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selName: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 11,
    color: colors.textPrimary,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  selCity: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 10,
    color: colors.textMuted,
  },
  noDataText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
    paddingVertical: 12,
  },
  chipsRow: {
    gap: 8,
    paddingHorizontal: 4,
  },
  productChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  productChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  productChipText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 12,
    color: colors.textSecondary,
    writingDirection: 'rtl',
  },
  productChipTextActive: {
    color: '#fff',
  },
  dateChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    minWidth: 80,
  },
  dateChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dateChipText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 11,
    color: colors.textSecondary,
    writingDirection: 'rtl',
  },
  dateChipTextActive: {
    color: '#fff',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
  },
  timeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeChipText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: colors.textSecondary,
  },
  timeChipTextActive: {
    color: '#fff',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyInput: {
    width: 60,
    height: 44,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: 'Cairo_700Bold',
    fontSize: 18,
    color: colors.textPrimary,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 16,
    color: '#fff',
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
  requestsList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
  requestCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reqFarm: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  reqStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  reqStatusText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 11,
  },
  reqProduct: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 8,
  },
  reqDetails: {
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'flex-end',
  },
  reqDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reqDetailText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
});
