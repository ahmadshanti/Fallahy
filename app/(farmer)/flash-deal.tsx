import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { useAuthStore } from '../../store/authStore';
import { getProductsByFarmer, updateProduct } from '../../lib/products';
import { isDevMode } from '../../lib/devMode';
import { useDevProductsStore } from '../../store/devProductsStore';

const durations = ['ساعة واحدة', '3 ساعات', 'يوم كامل'];

export default function FlashDealScreen() {
  const router = useRouter();
  const farmerId = useAuthStore((s) => s.farmerId);
  const devProducts = useDevProductsStore((s) => s.created);
  const updateDevProduct = useDevProductsStore((s) => s.updateProduct);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [dealPrice, setDealPrice] = useState('');
  const [duration, setDuration] = useState('ساعة واحدة');
  const [published, setPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (farmerId) loadProducts();
  }, [farmerId]);

  const loadProducts = async () => {
    if (!farmerId) return;
    setLoading(true);
    try {
      const data = isDevMode ? devProducts : await getProductsByFarmer(farmerId);
      setProducts(data);
      if (data.length > 0) {
        setSelectedProduct(data[0]);
      }
    } catch (err) {
      console.log('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedProduct || !dealPrice) return;
    setPublishing(true);
    try {
      const discount = Math.round((1 - Number(dealPrice) / (selectedProduct.retail_price || 1)) * 100);
      if (isDevMode || selectedProduct.id?.startsWith('dev-')) {
        updateDevProduct(selectedProduct.id, { discount_percent: discount });
      } else {
        await updateProduct(selectedProduct.id, { discount_percent: discount });
      }
      setPublished(true);
    } catch (err: any) {
      Alert.alert('خطأ', err?.message || 'حدث خطأ في نشر العرض');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (published && selectedProduct) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={80} color={colors.primary} />
          <Text style={styles.successTitle}>تم نشر العرض بنجاح</Text>
          <Text style={styles.successSubtitle}>
            عرض {selectedProduct.name} بسعر {dealPrice} ₪ لمدة {duration}
          </Text>
          <Button title="العودة للرئيسية" onPress={() => router.back()} style={{ marginTop: spacing.lg }} />
        </View>
      </SafeAreaView>
    );
  }

  if (products.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>عرض سريع</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg }}>
          <Ionicons name="flash-outline" size={60} color={colors.textMuted} />
          <Text style={{ fontFamily: 'Cairo_600SemiBold', fontSize: 16, color: colors.textMuted, marginTop: spacing.md, textAlign: 'center' }}>
            أضف منتجات أولاً لإنشاء عرض سريع
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>عرض سريع</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Product Selector */}
        <Text style={styles.label}>اختر المنتج</Text>
        <View style={styles.productList}>
          {products.map((product: any) => (
            <TouchableOpacity
              key={product.id}
              style={[styles.productChip, selectedProduct?.id === product.id && styles.productChipActive]}
              onPress={() => setSelectedProduct(product)}
            >
              <Text style={[styles.productChipText, selectedProduct?.id === product.id && styles.productChipTextActive]}>
                {product.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Deal Price */}
        <Input
          label="سعر العرض"
          value={dealPrice}
          onChangeText={setDealPrice}
          keyboardType="numeric"
          placeholder={`أقل من ${selectedProduct?.retail_price || 0} ₪`}
        />

        {/* Duration */}
        <Text style={styles.label}>مدة العرض</Text>
        <View style={styles.durationRow}>
          {durations.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.durationBtn, duration === d && styles.durationBtnActive]}
              onPress={() => setDuration(d)}
            >
              <Text style={[styles.durationText, duration === d && styles.durationTextActive]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Preview */}
        <Text style={styles.label}>معاينة العرض</Text>
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <View style={styles.flashBadge}>
              <Ionicons name="flash" size={14} color={colors.secondary} />
              <Text style={styles.flashBadgeText}>عرض سريع</Text>
            </View>
            <Text style={styles.previewName}>{selectedProduct?.name || ''}</Text>
          </View>
          <View style={styles.previewPriceRow}>
            {dealPrice ? <Text style={styles.previewDealPrice}>{dealPrice} ₪</Text> : null}
            <Text style={styles.previewOriginalPrice}>{selectedProduct?.retail_price || 0} ₪</Text>
          </View>
          <Text style={styles.previewDuration}>ينتهي خلال: {duration}</Text>
        </View>

        <Button
          title="نشر العرض الآن"
          onPress={handlePublish}
          fullWidth
          size="lg"
          disabled={!dealPrice || !selectedProduct || Number(dealPrice) >= (selectedProduct?.retail_price || 0)}
          loading={publishing}
        />
      </ScrollView>
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
  scroll: { padding: spacing.md, paddingBottom: 40 },
  label: {
    fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: colors.textPrimary,
    textAlign: 'right', writingDirection: 'rtl', marginBottom: spacing.sm,
  },
  productList: {
    flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm,
    marginBottom: spacing.md,
  },
  productChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  productChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  productChipText: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: colors.textSecondary },
  productChipTextActive: { color: '#FFFFFF' },
  durationRow: { flexDirection: 'row-reverse', gap: spacing.sm, marginBottom: spacing.lg },
  durationBtn: {
    flex: 1, paddingVertical: 10, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
    backgroundColor: colors.surface,
  },
  durationBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  durationText: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: colors.textSecondary },
  durationTextActive: { color: '#FFFFFF' },
  previewCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: spacing.md, marginBottom: spacing.lg,
    borderWidth: 2, borderColor: colors.secondary, borderStyle: 'dashed',
  },
  previewHeader: {
    flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center',
  },
  previewName: { fontFamily: 'Cairo_700Bold', fontSize: 16, color: colors.textPrimary },
  flashBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFF8E1', borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  flashBadgeText: { fontFamily: 'Cairo_600SemiBold', fontSize: 11, color: colors.secondary },
  previewPriceRow: {
    flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.sm, alignItems: 'baseline',
  },
  previewOriginalPrice: {
    fontFamily: 'Cairo_400Regular', fontSize: 14, color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  previewDealPrice: { fontFamily: 'Cairo_700Bold', fontSize: 24, color: colors.success },
  previewDuration: {
    fontFamily: 'Cairo_400Regular', fontSize: 13, color: colors.secondary,
    textAlign: 'right', marginTop: spacing.sm,
  },
  successContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg,
  },
  successTitle: {
    fontFamily: 'Cairo_700Bold', fontSize: 24, color: colors.primary,
    marginTop: spacing.md,
  },
  successSubtitle: {
    fontFamily: 'Cairo_400Regular', fontSize: 16, color: colors.textSecondary,
    textAlign: 'center', marginTop: spacing.sm,
  },
});
