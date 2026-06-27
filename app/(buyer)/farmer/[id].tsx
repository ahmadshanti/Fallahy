import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Linking,
  FlatList,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '../../../constants/colors';
import { getFarmerById } from '../../../lib/farmers';
import { getProductsByFarmer } from '../../../lib/products';
import { getTreesByFarmer } from '../../../lib/trees';
import { getOrCreateConversation } from '../../../lib/chat';
import { useAuthStore } from '../../../store/authStore';
import { useCartStore } from '../../../store/cartStore';
import { Farmer, Product, Tree } from '../../../types';

export default function FarmerProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { buyerId } = useAuthStore();
  const addItem = useCartStore((s) => s.addItem);

  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [trees, setTrees] = useState<Tree[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadFarmer();
  }, [id]);

  const loadFarmer = async () => {
    try {
      setLoading(true);
      const [farmerData, farmerProducts, farmerTrees] = await Promise.all([
        getFarmerById(id!),
        getProductsByFarmer(id!),
        getTreesByFarmer(id!),
      ]);
      setFarmer(farmerData);
      setProducts(farmerProducts);
      setTrees(farmerTrees);
    } catch (err) {
      console.error('Farmer load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChat = () => {
    if (!farmer) return;
    // New messaging system (uses zustand useMessagesStore — instant, no DB round-trip)
    router.push(`/(buyer)/messages/${farmer.id}`);
  };

  const handleWhatsApp = () => {
    if (!farmer?.whatsapp_number) {
      Alert.alert('غير متوفر', 'لا يوجد رقم واتساب لهذا المزارع');
      return;
    }
    const num = farmer.whatsapp_number.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/${num}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!farmer) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
        <Text style={styles.emptyText}>المزرعة غير موجودة</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.goBackBtn}>
          <Text style={styles.goBackText}>رجوع</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Farm Images Gallery */}
        <View style={styles.galleryContainer}>
          {farmer.farm_images && farmer.farm_images.length > 0 ? (
            <FlatList
              data={farmer.farm_images}
              renderItem={({ item }) => (
                <Image source={{ uri: item }} style={styles.galleryImage} />
              )}
              keyExtractor={(_, i) => i.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
            />
          ) : farmer.owner_avatar_url ? (
            <Image source={{ uri: farmer.owner_avatar_url }} style={styles.galleryImage} />
          ) : (
            <View style={[styles.galleryImage, styles.placeholderGallery]}>
              <Ionicons name="image-outline" size={60} color={colors.textMuted} />
            </View>
          )}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Farm Info */}
          <View style={styles.farmHeader}>
            <View style={styles.farmNameRow}>
              <Text style={styles.farmName}>{farmer.farm_name}</Text>
              {farmer.is_verified && (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              )}
            </View>
            <View style={styles.cityRow}>
              <Text style={styles.cityText}>{farmer.city}</Text>
              <Ionicons name="location" size={14} color={colors.secondary} />
            </View>
          </View>

          {/* About */}
          {farmer.about && (
            <View style={styles.aboutSection}>
              <Text style={styles.sectionTitle}>عن المزرعة</Text>
              <Text style={styles.aboutText}>{farmer.about}</Text>
            </View>
          )}

          {/* Contact Buttons */}
          <View style={styles.contactRow}>
            <TouchableOpacity style={styles.chatBtn} onPress={handleChat}>
              <Ionicons name="chatbubble-outline" size={18} color="#fff" />
              <Text style={styles.chatBtnText}>تواصل مباشر</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsApp}>
              <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
              <Text style={styles.whatsappBtnText}>واتساب</Text>
            </TouchableOpacity>
          </View>

          {/* Products */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>منتجات المزرعة</Text>
            {products.length === 0 ? (
              <View style={styles.emptySection}>
                <Ionicons name="basket-outline" size={32} color={colors.textMuted} />
                <Text style={styles.emptySectionText}>لا توجد منتجات حاليا</Text>
              </View>
            ) : (
              <FlatList
                data={products}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.productCard}
                    onPress={() => router.push(`/(buyer)/product/${item.id}`)}
                    activeOpacity={0.7}
                  >
                    {item.image_url ? (
                      <Image source={{ uri: item.image_url }} style={styles.productImage} />
                    ) : (
                      <View style={[styles.productImage, styles.placeholderImg]}>
                        <Ionicons name="image-outline" size={24} color={colors.textMuted} />
                      </View>
                    )}
                    <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.productPrice}>
                      {(item.retail_price || 0).toFixed(2)} د.أ
                    </Text>
                    <TouchableOpacity
                      style={styles.addCartMini}
                      onPress={() => addItem(item, 1, 'retail')}
                    >
                      <Ionicons name="add" size={16} color="#fff" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id}
                horizontal
                inverted
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              />
            )}
          </View>

          {/* Trees */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>أشجار للتبني</Text>
            {trees.length === 0 ? (
              <View style={styles.emptySection}>
                <Ionicons name="leaf-outline" size={32} color={colors.textMuted} />
                <Text style={styles.emptySectionText}>لا توجد أشجار للتبني</Text>
              </View>
            ) : (
              <FlatList
                data={trees}
                renderItem={({ item }) => (
                  <View style={styles.treeCard}>
                    {item.image_url ? (
                      <Image source={{ uri: item.image_url }} style={styles.treeImage} />
                    ) : (
                      <View style={[styles.treeImage, styles.placeholderImg]}>
                        <Ionicons name="leaf" size={24} color={colors.textMuted} />
                      </View>
                    )}
                    <Text style={styles.treeName}>{item.tree_type}</Text>
                    <Text style={styles.treePrice}>{item.annual_price} د.أ/سنة</Text>
                    <TouchableOpacity
                      style={styles.adoptMiniBtn}
                      onPress={() => router.push('/(buyer)/trees')}
                    >
                      <Text style={styles.adoptMiniBtnText}>تبنّى</Text>
                    </TouchableOpacity>
                  </View>
                )}
                keyExtractor={(item) => item.id}
                horizontal
                inverted
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              />
            )}
          </View>

          <View style={{ height: 30 }} />
        </View>
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
  galleryContainer: {
    position: 'relative',
    height: 260,
  },
  galleryImage: {
    width: 400,
    height: 260,
    resizeMode: 'cover',
  },
  placeholderGallery: {
    width: '100%',
    backgroundColor: colors.surfaceDim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 16,
    marginTop: -20,
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
  },
  farmHeader: {
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  farmNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  farmName: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 24,
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  cityText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
    writingDirection: 'rtl',
  },
  aboutSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 8,
  },
  aboutText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 22,
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
    paddingVertical: 12,
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
    paddingVertical: 12,
    borderRadius: 12,
  },
  whatsappBtnText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: '#25D366',
  },
  section: {
    marginBottom: 20,
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  emptySectionText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    writingDirection: 'rtl',
  },
  horizontalList: {
    gap: 12,
    paddingHorizontal: 4,
  },
  productCard: {
    width: 140,
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 100,
    resizeMode: 'cover',
  },
  placeholderImg: {
    backgroundColor: colors.surfaceDim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productName: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 12,
    color: colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    paddingHorizontal: 8,
    marginTop: 6,
  },
  productPrice: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 13,
    color: colors.primary,
    textAlign: 'right',
    writingDirection: 'rtl',
    paddingHorizontal: 8,
    paddingBottom: 8,
    marginTop: 2,
  },
  addCartMini: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  treeCard: {
    width: 150,
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  treeImage: {
    width: '100%',
    height: 100,
    resizeMode: 'cover',
  },
  treeName: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 12,
    color: colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    paddingHorizontal: 8,
    marginTop: 6,
  },
  treePrice: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 12,
    color: colors.secondary,
    textAlign: 'right',
    writingDirection: 'rtl',
    paddingHorizontal: 8,
    marginTop: 2,
  },
  adoptMiniBtn: {
    backgroundColor: colors.secondary + '20',
    marginHorizontal: 8,
    marginVertical: 8,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  adoptMiniBtnText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 12,
    color: colors.secondary,
  },
});
