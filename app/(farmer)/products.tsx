import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, FlatList, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Button from '../../components/ui/Button';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { useAuthStore } from '../../store/authStore';
import { getProductsByFarmer, updateProduct, deleteProduct } from '../../lib/products';

export default function FarmerProductsScreen() {
  const router = useRouter();
  const farmerId = useAuthStore((s) => s.farmerId);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = async () => {
    if (!farmerId) return;
    setLoading(true);
    try {
      const data = await getProductsByFarmer(farmerId);
      setProducts(data);
    } catch (err) {
      console.log('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [farmerId])
  );

  const handleToggleAvailability = async (productId: string, currentValue: boolean) => {
    try {
      await updateProduct(productId, { is_available: !currentValue });
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, is_available: !currentValue } : p))
      );
    } catch (err: any) {
      Alert.alert('خطأ', err?.message || 'فشل تحديث المنتج');
    }
  };

  const handleDelete = (productId: string, productName: string) => {
    Alert.alert(
      'حذف المنتج',
      `هل أنت متأكد من حذف "${productName}"؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(productId);
              setProducts((prev) => prev.filter((p) => p.id !== productId));
            } catch (err: any) {
              Alert.alert('خطأ', err?.message || 'فشل حذف المنتج');
            }
          },
        },
      ]
    );
  };

  const handleEdit = (product: any) => {
    router.push({
      pathname: '/(farmer)/add-product',
      params: {
        editId: product.id,
        editName: product.name,
        editImage: product.image_url || '',
        editQuantity: String(product.quantity_available || 0),
        editUnit: product.unit || 'كغ',
        editSaleType: product.sale_type || 'مفرق',
        editRetailPrice: String(product.retail_price || 0),
        editWholesalePrice: String(product.wholesale_price || 0),
        editDiscount: String(product.discount_percent || 0),
        editOrganic: product.is_organic ? 'true' : 'false',
        editDescription: product.description || '',
      },
    });
  };

  const renderProduct = ({ item }: { item: any }) => (
    <View style={styles.productCard}>
      <View style={styles.cardTop}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.productImage} contentFit="cover" />
        ) : (
          <View style={[styles.productImage, styles.noImage]}>
            <Ionicons name="image-outline" size={30} color={colors.textMuted} />
          </View>
        )}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productPrice}>
            {item.retail_price ? `مفرق: ${item.retail_price} ₪` : ''}
            {item.wholesale_price ? ` | جملة: ${item.wholesale_price} ₪` : ''}
          </Text>
          <Text style={styles.productStock}>
            الكمية: {item.quantity_available} {item.unit}
          </Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>متاح</Text>
          <Switch
            value={item.is_available !== false}
            onValueChange={() => handleToggleAvailability(item.id, item.is_available !== false)}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={item.is_available !== false ? colors.primary : '#f4f3f4'}
          />
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(item)}>
            <Ionicons name="create-outline" size={16} color={colors.primary} />
            <Text style={styles.editText}>تعديل</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id, item.name)}>
            <Ionicons name="trash-outline" size={16} color={colors.error} />
            <Text style={styles.deleteText}>حذف</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>منتجاتي</Text>
        <Button
          title="إضافة منتج"
          onPress={() => router.push('/(farmer)/add-product')}
          size="sm"
          icon={<Ionicons name="add" size={18} color="#FFFFFF" />}
        />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 20 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="cube-outline" size={60} color={colors.textMuted} />
              <Text style={styles.emptyText}>لم تضف أي منتج بعد</Text>
              <Button title="أضف منتجك الأول" onPress={() => router.push('/(farmer)/add-product')} />
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  headerTitle: { fontFamily: 'Cairo_700Bold', fontSize: 22, color: colors.textPrimary },
  productCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  cardTop: {
    flexDirection: 'row-reverse', alignItems: 'center',
  },
  productImage: { width: 70, height: 70, borderRadius: radius.md },
  noImage: {
    backgroundColor: colors.surfaceDim, alignItems: 'center', justifyContent: 'center',
  },
  productInfo: {
    flex: 1, marginRight: spacing.sm, marginLeft: spacing.sm,
  },
  productName: {
    fontFamily: 'Cairo_600SemiBold', fontSize: 15, color: colors.textPrimary,
    textAlign: 'right', writingDirection: 'rtl',
  },
  productPrice: {
    fontFamily: 'Cairo_400Regular', fontSize: 12, color: colors.textMuted,
    textAlign: 'right', marginTop: 2,
  },
  productStock: {
    fontFamily: 'Cairo_400Regular', fontSize: 12, color: colors.success,
    textAlign: 'right', marginTop: 2,
  },
  cardActions: {
    marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  toggleLabel: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: colors.textSecondary },
  buttonRow: { flexDirection: 'row-reverse', gap: spacing.sm },
  editBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.primary,
  },
  editText: { fontFamily: 'Cairo_600SemiBold', fontSize: 12, color: colors.primary },
  deleteBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.error,
  },
  deleteText: { fontFamily: 'Cairo_600SemiBold', fontSize: 12, color: colors.error },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: {
    fontFamily: 'Cairo_600SemiBold', fontSize: 16, color: colors.textMuted,
    marginVertical: spacing.md,
  },
});
