import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { getProducts } from '../../lib/products';
import { getFarmersByCity, getAllFarmers } from '../../lib/farmers';
import { getUnreadCount } from '../../lib/notifications';
import { Product, Farmer } from '../../types';

export default function BuyerHome() {
  const router = useRouter();
  const { user, buyerId } = useAuthStore();
  const cartItems = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);

  const [products, setProducts] = useState<Product[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prods, notifCount] = await Promise.all([
        getProducts({ limit: 8 }),
        buyerId ? getUnreadCount(buyerId) : Promise.resolve(0),
      ]);
      setProducts(prods);
      setUnreadNotifs(notifCount);

      let farmerList: Farmer[] = [];
      if (user?.city) {
        farmerList = await getFarmersByCity(user.city);
      }
      if (farmerList.length === 0) {
        farmerList = await getAllFarmers();
      }
      setFarmers(farmerList.slice(0, 6));
    } catch (err) {
      console.error('Home load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderProductCard = (product: Product) => {
    const price = product.retail_price || 0;
    const farmerName = product.farmers?.farm_name || '';
    return (
      <TouchableOpacity
        key={product.id}
        style={styles.productCard}
        onPress={() => router.push(`/(buyer)/product/${product.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.productImageWrapper}>
          {product.image_url ? (
            <Image source={{ uri: product.image_url }} style={styles.productImage} />
          ) : (
            <View style={[styles.productImage, styles.placeholderImage]}>
              <Ionicons name="image-outline" size={32} color={colors.textMuted} />
            </View>
          )}
          {product.is_organic && (
            <View style={styles.organicBadge}>
              <Ionicons name="leaf" size={10} color="#fff" />
              <Text style={styles.organicBadgeText}>عضوي</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.addToCartBtn}
            onPress={() => addItem(product, 1, 'retail')}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
          <Text style={styles.productFarmer} numberOfLines={1}>{farmerName}</Text>
          <Text style={styles.productPrice}>{price.toFixed(2)} د.أ</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFarmerCard = (farmer: Farmer) => (
    <TouchableOpacity
      key={farmer.id}
      style={styles.farmerCard}
      onPress={() => router.push(`/(buyer)/farmer/${farmer.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.farmerAvatarWrapper}>
        {farmer.owner_avatar_url ? (
          <Image source={{ uri: farmer.owner_avatar_url }} style={styles.farmerAvatar} />
        ) : (
          <View style={[styles.farmerAvatar, styles.placeholderAvatar]}>
            <Ionicons name="person" size={24} color={colors.textMuted} />
          </View>
        )}
        {farmer.is_verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
          </View>
        )}
      </View>
      <Text style={styles.farmerName} numberOfLines={1}>{farmer.farm_name}</Text>
      <View style={styles.farmerCityRow}>
        <Ionicons name="location-outline" size={12} color={colors.textMuted} />
        <Text style={styles.farmerCity}>{farmer.city}</Text>
      </View>
      <TouchableOpacity
        style={styles.visitBtn}
        onPress={() => router.push(`/(buyer)/farmer/${farmer.id}`)}
      >
        <Text style={styles.visitBtnText}>زيارة</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

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
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.push('/(buyer)/cart')} style={styles.iconBtn}>
          <Ionicons name="cart-outline" size={26} color={colors.textPrimary} />
          {cartItems.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartItems.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <Text style={styles.greeting}>مرحبا، {user?.full_name || 'ضيف'}</Text>
          <View style={styles.cityRow}>
            <Ionicons name="location" size={14} color={colors.secondary} />
            <Text style={styles.cityText}>{user?.city || 'حدد موقعك'}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.push('/(buyer)/orders')} style={styles.iconBtn}>
          <Ionicons name="notifications-outline" size={26} color={colors.textPrimary} />
          {unreadNotifs > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadNotifs > 9 ? '9+' : unreadNotifs}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero Banner */}
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBanner}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>من المزرعة إلى بيتك</Text>
            <Text style={styles.heroSubtitle}>منتجات طازجة وعضوية مباشرة من المزارعين</Text>
            <TouchableOpacity
              style={styles.heroBtn}
              onPress={() => router.push('/(buyer)/explore')}
            >
              <Text style={styles.heroBtnText}>تصفح المنتجات</Text>
              <Ionicons name="arrow-back" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.heroIconWrapper}>
            <Ionicons name="leaf" size={80} color="rgba(255,255,255,0.15)" />
          </View>
        </LinearGradient>

        {/* Most Requested Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TouchableOpacity onPress={() => router.push('/(buyer)/explore')}>
              <Text style={styles.seeAll}>عرض الكل</Text>
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>الأكثر طلبا</Text>
          </View>
          {products.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="basket-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>لا توجد منتجات حاليا</Text>
            </View>
          ) : (
            <FlatList
              data={products}
              renderItem={({ item }) => renderProductCard(item)}
              keyExtractor={(item) => item.id}
              horizontal
              inverted
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          )}
        </View>

        {/* Nearby Farmers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View />
            <Text style={styles.sectionTitle}>مزارعون قريبون</Text>
          </View>
          {farmers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>لا يوجد مزارعون حاليا</Text>
            </View>
          ) : (
            <FlatList
              data={farmers}
              renderItem={({ item }) => renderFarmerCard(item)}
              keyExtractor={(item) => item.id}
              horizontal
              inverted
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          )}
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
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: colors.background,
  },
  topBarCenter: {
    alignItems: 'center',
    flex: 1,
  },
  greeting: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cityText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    color: colors.textSecondary,
    writingDirection: 'rtl',
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 10,
    color: '#fff',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  heroBanner: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: 140,
  },
  heroContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  heroTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 22,
    color: '#fff',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  heroSubtitle: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 4,
    marginBottom: 12,
  },
  heroBtn: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  heroBtnText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: colors.primary,
  },
  heroIconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  seeAll: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: colors.secondary,
  },
  horizontalList: {
    paddingHorizontal: 12,
    gap: 12,
  },
  productCard: {
    width: 160,
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  productImageWrapper: {
    position: 'relative',
    width: '100%',
    height: 120,
  },
  productImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  placeholderImage: {
    backgroundColor: colors.surfaceDim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  organicBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  organicBadgeText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 9,
    color: '#fff',
  },
  addToCartBtn: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 10,
    alignItems: 'flex-end',
  },
  productName: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  productFarmer: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 2,
  },
  productPrice: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
    color: colors.primary,
    marginTop: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  farmerCard: {
    width: 140,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  farmerAvatarWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  farmerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  placeholderAvatar: {
    backgroundColor: colors.surfaceDim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  farmerName: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: colors.textPrimary,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  farmerCityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
    marginBottom: 8,
  },
  farmerCity: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 11,
    color: colors.textMuted,
  },
  visitBtn: {
    backgroundColor: colors.primaryLight + '30',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 16,
  },
  visitBtnText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 12,
    color: colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    gap: 8,
  },
  emptyText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
