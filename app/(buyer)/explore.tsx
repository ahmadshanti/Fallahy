import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import CategoryFilter from '../../components/buyer/CategoryFilter';
import ProductCard from '../../components/buyer/ProductCard';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { mockProducts } from '../../constants/mockData';

const categories = ['الكل', 'خضار', 'فواكه', 'زيوت', 'أعشاب', 'بقوليات'];

export default function ExploreScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [priceType, setPriceType] = useState<'retail' | 'wholesale'>('retail');
  const [organicOnly, setOrganicOnly] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);

  const filteredProducts = useMemo(() => {
    let filtered = mockProducts;
    if (selectedCategory !== 'الكل') {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }
    if (organicOnly) {
      filtered = filtered.filter((p) => p.isOrganic);
    }
    if (availableOnly) {
      filtered = filtered.filter((p) => p.available > 0);
    }
    if (search) {
      filtered = filtered.filter((p) => p.name.includes(search) || p.farmerName.includes(search));
    }
    return filtered;
  }, [selectedCategory, organicOnly, availableOnly, search]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تصفح المنتجات</Text>
        <TouchableOpacity>
          <Ionicons name="options-outline" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="ابحث عن خضار، فواكه أو مزارعين..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          autoFocus
          textAlign="right"
        />
        <Ionicons name="search-outline" size={20} color={colors.textMuted} />
      </View>

      {/* Categories */}
      <CategoryFilter categories={categories} selected={selectedCategory} onSelect={setSelectedCategory} />

      {/* Price Type Toggle */}
      <View style={styles.toggleContainer}>
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, priceType === 'retail' && styles.toggleActive]}
            onPress={() => setPriceType('retail')}
          >
            <Text style={[styles.toggleText, priceType === 'retail' && styles.toggleTextActive]}>مفرق</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, priceType === 'wholesale' && styles.toggleActive]}
            onPress={() => setPriceType('wholesale')}
          >
            <Text style={[styles.toggleText, priceType === 'wholesale' && styles.toggleTextActive]}>جملة</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Pills */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterPill, organicOnly && styles.filterPillActive]}
          onPress={() => setOrganicOnly(!organicOnly)}
        >
          <Text style={[styles.filterPillText, organicOnly && styles.filterPillTextActive]}>عضوي فقط</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterPill, availableOnly && styles.filterPillActive]}
          onPress={() => setAvailableOnly(!availableOnly)}
        >
          <Text style={[styles.filterPillText, availableOnly && styles.filterPillTextActive]}>متاح الآن</Text>
        </TouchableOpacity>
      </View>

      {/* Products Grid */}
      <View style={styles.listContainer}>
        <FlashList
          data={filteredProducts}
          numColumns={2}


          contentContainerStyle={{ paddingHorizontal: spacing.md }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item }) => (
            <View style={{ flex: 1, paddingHorizontal: 4 }}>
              <ProductCard
                product={item}
                onPress={() => router.push(`/(buyer)/product/${item.id}`)}
              />
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>لا توجد منتجات مطابقة</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backIcon: { fontSize: 24, color: colors.textPrimary },
  headerTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 18,
    color: colors.textPrimary,
  },
  filterIcon: { fontSize: 22 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceDim,
    borderRadius: 12,
    height: 48,
    marginHorizontal: spacing.md,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  searchIcon: { fontSize: 18, color: colors.textMuted },
  toggleContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceDim,
    borderRadius: radius.lg,
    padding: 3,
  },
  toggleBtn: {
    flex: 1,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleActive: { backgroundColor: colors.primary },
  toggleText: { fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: colors.textSecondary },
  toggleTextActive: { color: '#FFFFFF' },
  filterRow: {
    flexDirection: 'row-reverse',
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterPillText: { fontFamily: 'Cairo_600SemiBold', fontSize: 12, color: colors.textSecondary },
  filterPillTextActive: { color: '#FFFFFF' },
  listContainer: {
    flex: 1,
    marginTop: spacing.md,
  },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { fontFamily: 'Cairo_600SemiBold', fontSize: 16, color: colors.textMuted },
});
