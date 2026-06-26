import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeroBanner from '../../components/buyer/HeroBanner';
import PriceTicker from '../../components/buyer/PriceTicker';
import ProductCard from '../../components/buyer/ProductCard';
import FarmerCard from '../../components/buyer/FarmerCard';
import SectionHeader from '../../components/buyer/SectionHeader';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { useProducts } from '../../hooks/useProducts';
import { useFarmers } from '../../hooks/useFarmers';
import { usePriceTicker } from '../../hooks/useSavings';
import { useBuyerSavings } from '../../hooks/useSavings';

const { width } = Dimensions.get('window');

export default function BuyerHomeScreen() {
  const router = useRouter();
  const cartItems = useCartStore((s) => s.items);
  const { user } = useAuthStore();
  const { data: products = [], isLoading: productsLoading } = useProducts({ limit: 10 });
  const { data: farmers = [], isLoading: farmersLoading } = useFarmers();
  const { data: priceTicker = [] } = usePriceTicker();
  const { data: savings } = useBuyerSavings(user?.id || '');

  const savingsAmount = savings?.totalSaved || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={styles.topBarRight}>
            <Ionicons name="location-outline" size={18} color={colors.primary} />
            <Text style={styles.locationText}>{user?.city || 'فلسطين'}</Text>
          </View>
          <View style={styles.topBarLeft}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(buyer)/cart')}>
              <Ionicons name="cart-outline" size={22} color={colors.textPrimary} />
              {cartItems.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartItems.length}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>3</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <TouchableOpacity style={styles.searchBar} onPress={() => router.push('/(buyer)/explore')}>
          <Ionicons name="mic-outline" size={20} color={colors.primary} />
          <Text style={styles.searchPlaceholder}>ابحث عن خضار، فواكه أو مزارعين...</Text>
          <Ionicons name="search-outline" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Hero Banner */}
        <View style={{ marginTop: spacing.md }}>
          <HeroBanner />
        </View>

        {/* Price Ticker */}
        <View style={{ marginTop: spacing.md }}>
          <PriceTicker items={priceTicker} />
        </View>

        {/* Savings Banner */}
        <TouchableOpacity style={styles.savingsBanner} onPress={() => router.push('/(buyer)/profile')}>
          <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.5)" />
          <View style={styles.savingsContent}>
            <Text style={styles.savingsTitle}>
              {savingsAmount > 0 ? `وفّرت ${savingsAmount} شيكل هاد الشهر` : 'ابدأ بالتسوق'}
            </Text>
            <Text style={styles.savingsSubtitle}>أنت بطل الاقتصاد الزراعي!</Text>
          </View>
          <View style={styles.savingsIcon}>
            <Ionicons name="cart-outline" size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* Most Ordered */}
        <SectionHeader title="الأكثر طلباً" actionText="عرض الكل" onAction={() => router.push('/(buyer)/explore')} />
        {productsLoading ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.lg }} />
        ) : products.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
            <Text style={{ fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: colors.textMuted }}>لا توجد منتجات حالياً</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {products.map((product) => (
              <View key={product.id} style={{ marginLeft: spacing.sm }}>
                <ProductCard
                  product={product}
                  onPress={() => router.push(`/(buyer)/product/${product.id}`)}
                />
              </View>
            ))}
          </ScrollView>
        )}

        {/* Nearby Farmers */}
        <SectionHeader title="مزارعون قريبون منك" actionText="عرض الكل" onAction={() => router.push('/(buyer)/map')} />
        {farmersLoading ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.lg }} />
        ) : (
          <View style={styles.farmersList}>
            {farmers.map((farmer) => (
              <FarmerCard
                key={farmer.id}
                farmer={farmer}
                onPress={() => router.push(`/(buyer)/farmer/${farmer.id}`)}
              />
            ))}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  topBarRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  locationIcon: {
    fontSize: 16,
  },
  locationText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
  },
  topBarLeft: {
    flexDirection: 'row',
    gap: 12,
  },
  iconBtn: {
    position: 'relative',
  },
  iconText: {
    fontSize: 22,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: colors.error,
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Cairo_700Bold',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceDim,
    borderRadius: 12,
    height: 48,
    marginHorizontal: spacing.md,
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    fontSize: 18,
    color: colors.primary,
  },
  searchPlaceholder: {
    flex: 1,
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'right',
    marginHorizontal: spacing.sm,
  },
  searchIconLeft: {
    fontSize: 18,
    color: colors.textMuted,
  },
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  savingsChevron: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.5)',
  },
  savingsContent: {
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  savingsTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  savingsSubtitle: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  savingsIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savingsIconText: {
    fontSize: 20,
  },
  horizontalList: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  farmersList: {
    paddingHorizontal: spacing.md,
  },
});
