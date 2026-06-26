import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import Button from '../../components/ui/Button';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { useAuthStore } from '../../store/authStore';
import { useFarmerProducts } from '../../hooks/useProducts';

export default function FarmerProductsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: myProducts = [], isLoading } = useFarmerProducts(user?.id || '');

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>منتجاتي</Text>
          <Button
            title="+ إضافة منتج"
            onPress={() => router.push('/(farmer)/add-product')}
            size="sm"
          />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>منتجاتي</Text>
        <Button
          title="+ إضافة منتج"
          onPress={() => router.push('/(farmer)/add-product')}
          size="sm"
        />
      </View>

      <View style={styles.listContainer}>
        <FlashList
          data={myProducts}

          renderItem={({ item }) => (
            <View style={styles.productCard}>
              <Image source={{ uri: item.image }} style={styles.productImage} contentFit="cover" />
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productMeta}>
                  مفرق: ₪{item.retailPrice} | جملة: ₪{item.wholesalePrice}
                </Text>
                <Text style={styles.productStock}>المخزون: {item.available} {item.unit}</Text>
              </View>
              <TouchableOpacity style={styles.editBtn}>
                <Text style={styles.editText}>تعديل</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="cube-outline" size={60} color={colors.textMuted} />
              <Text style={styles.emptyText}>لم تضف أي منتج بعد</Text>
              <Button title="أضف منتجك الأول" onPress={() => router.push('/(farmer)/add-product')} />
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  headerTitle: { fontFamily: 'Cairo_700Bold', fontSize: 22, color: colors.textPrimary },
  listContainer: { flex: 1, paddingHorizontal: spacing.md },
  productCard: {
    flexDirection: 'row-reverse', backgroundColor: colors.surface,
    borderRadius: radius.xl, padding: spacing.sm, marginBottom: spacing.sm,
    alignItems: 'center',
  },
  productImage: { width: 70, height: 70, borderRadius: radius.md },
  productInfo: {
    flex: 1, marginRight: spacing.sm, marginLeft: spacing.sm,
  },
  productName: {
    fontFamily: 'Cairo_600SemiBold', fontSize: 15, color: colors.textPrimary,
    textAlign: 'right', writingDirection: 'rtl',
  },
  productMeta: {
    fontFamily: 'Cairo_400Regular', fontSize: 12, color: colors.textMuted,
    textAlign: 'right', marginTop: 2,
  },
  productStock: {
    fontFamily: 'Cairo_400Regular', fontSize: 12, color: colors.success,
    textAlign: 'right', marginTop: 2,
  },
  editBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.primary,
  },
  editText: { fontFamily: 'Cairo_600SemiBold', fontSize: 12, color: colors.primary },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 60 },
  emptyText: {
    fontFamily: 'Cairo_600SemiBold', fontSize: 16, color: colors.textMuted,
    marginVertical: spacing.md,
  },
});
