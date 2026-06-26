import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../constants/colors';
import { getProducts } from '../../lib/products';
import { useCartStore } from '../../store/cartStore';
import { Product } from '../../types';

const CATEGORIES = [
  { key: 'all', label: 'الكل' },
  { key: 'fruits', label: 'فواكه' },
  { key: 'vegetables', label: 'خضروات' },
  { key: 'olive-oil', label: 'زيت زيتون' },
  { key: 'dairy', label: 'ألبان' },
  { key: 'honey', label: 'عسل' },
  { key: 'herbs', label: 'أعشاب' },
];

export default function ExploreScreen() {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [saleType, setSaleType] = useState<'retail' | 'wholesale'>('retail');
  const [organicOnly, setOrganicOnly] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, searchQuery, selectedCategory, organicOnly, saleType]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      console.error('Explore load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...products];

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.farmers?.farm_name?.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter((p) => {
        const name = p.name.toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const category = selectedCategory.toLowerCase();
        return name.includes(category) || desc.includes(category);
      });
    }

    if (organicOnly) {
      result = result.filter((p) => p.is_organic);
    }

    if (saleType === 'wholesale') {
      result = result.filter((p) => p.wholesale_price && p.wholesale_price > 0);
    }

    setFilteredProducts(result);
  };

  const getPrice = (product: Product) => {
    if (saleType === 'wholesale' && product.wholesale_price) {
      return product.wholesale_price;
    }
    return product.retail_price || 0;
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const price = getPrice(item);
    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => router.push(`/(buyer)/product/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.imageWrapper}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.productImage} />
          ) : (
            <View style={[styles.productImage, styles.placeholderImage]}>
              <Ionicons name="image-outline" size={28} color={colors.textMuted} />
            </View>
          )}
          {item.is_organic && (
            <View style={styles.organicBadge}>
              <Ionicons name="leaf" size={10} color="#fff" />
            </View>
          )}
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => addItem(item, 1, saleType)}
          >
            <Ionicons name="add" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.farmerName} numberOfLines={1}>
            {item.farmers?.farm_name || ''}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.unit}>/{item.unit}</Text>
            <Text style={styles.price}>{price.toFixed(2)} د.أ</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>تصفح المنتجات</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={20} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="ابحث عن منتج أو مزرعة..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          textAlign="right"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters Row */}
      <View style={styles.filtersRow}>
        {/* Sale Type Toggle */}
        <View style={styles.saleToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, saleType === 'retail' && styles.toggleActive]}
            onPress={() => setSaleType('retail')}
          >
            <Text style={[styles.toggleText, saleType === 'retail' && styles.toggleTextActive]}>
              مفرق
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, saleType === 'wholesale' && styles.toggleActive]}
            onPress={() => setSaleType('wholesale')}
          >
            <Text style={[styles.toggleText, saleType === 'wholesale' && styles.toggleTextActive]}>
              جملة
            </Text>
          </TouchableOpacity>
        </View>

        {/* Organic Toggle */}
        <TouchableOpacity
          style={[styles.organicFilter, organicOnly && styles.organicFilterActive]}
          onPress={() => setOrganicOnly(!organicOnly)}
        >
          <Ionicons
            name="leaf"
            size={14}
            color={organicOnly ? '#fff' : colors.success}
          />
          <Text style={[styles.organicFilterText, organicOnly && styles.organicFilterTextActive]}>
            عضوي
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Chips */}
      <FlatList
        data={CATEGORIES}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === item.key && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(item.key)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === item.key && styles.categoryChipTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.key}
        horizontal
        inverted
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesRow}
      />

      {/* Products Grid */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>لا توجد منتجات مطابقة</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.productGrid}
          columnWrapperStyle={styles.gridRow}
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
    paddingTop: 50,
    paddingBottom: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 22,
    color: colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 10,
  },
  saleToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceDim,
    borderRadius: 10,
    overflow: 'hidden',
  },
  toggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  toggleActive: {
    backgroundColor: colors.primary,
    borderRadius: 10,
  },
  toggleText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 12,
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: '#fff',
  },
  organicFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.success,
  },
  organicFilterActive: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  organicFilterText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 12,
    color: colors.success,
  },
  organicFilterTextActive: {
    color: '#fff',
  },
  categoriesRow: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 12,
    color: colors.textSecondary,
    writingDirection: 'rtl',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productGrid: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  gridRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  productCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  imageWrapper: {
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
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtn: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
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
  farmerName: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginTop: 4,
  },
  price: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
    color: colors.primary,
  },
  unit: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 10,
    color: colors.textMuted,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
