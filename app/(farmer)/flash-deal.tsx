import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { mockProducts } from '../../constants/mockData';

const durations = ['ساعة واحدة', '3 ساعات', 'يوم كامل'];

export default function FlashDealScreen() {
  const router = useRouter();
  const myProducts = mockProducts.filter((p) => p.farmerId === 'f1');
  const [selectedProduct, setSelectedProduct] = useState(myProducts[0]);
  const [dealPrice, setDealPrice] = useState('');
  const [duration, setDuration] = useState('ساعة واحدة');
  const [published, setPublished] = useState(false);

  if (published) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={styles.successTitle}>تم نشر العرض بنجاح!</Text>
          <Text style={styles.successSubtitle}>
            عرض {selectedProduct.name} بسعر ₪{dealPrice} لمدة {duration}
          </Text>
          <Button title="العودة للرئيسية" onPress={() => router.back()} style={{ marginTop: spacing.lg }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backIcon}>→</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>عرض سريع ⚡</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Product Selector */}
        <Text style={styles.label}>اختر المنتج</Text>
        <View style={styles.productList}>
          {myProducts.map((product) => (
            <TouchableOpacity
              key={product.id}
              style={[styles.productChip, selectedProduct.id === product.id && styles.productChipActive]}
              onPress={() => setSelectedProduct(product)}
            >
              <Text style={[styles.productChipText, selectedProduct.id === product.id && styles.productChipTextActive]}>
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
          placeholder={`أقل من ₪${selectedProduct.retailPrice}`}
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
            <Badge label="⚡ عرض سريع" variant="savings" />
            <Text style={styles.previewName}>{selectedProduct.name}</Text>
          </View>
          <View style={styles.previewPriceRow}>
            {dealPrice && <Text style={styles.previewDealPrice}>₪{dealPrice}</Text>}
            <Text style={styles.previewOriginalPrice}>₪{selectedProduct.retailPrice}</Text>
          </View>
          <Text style={styles.previewDuration}>ينتهي خلال: {duration}</Text>
        </View>

        <Button
          title="نشر العرض الآن"
          onPress={() => setPublished(true)}
          fullWidth
          size="lg"
          disabled={!dealPrice || Number(dealPrice) >= selectedProduct.retailPrice}
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
  backIcon: { fontSize: 24 },
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
  successEmoji: { fontSize: 80 },
  successTitle: {
    fontFamily: 'Cairo_700Bold', fontSize: 24, color: colors.primary,
    marginTop: spacing.md,
  },
  successSubtitle: {
    fontFamily: 'Cairo_400Regular', fontSize: 16, color: colors.textSecondary,
    textAlign: 'center', marginTop: spacing.sm,
  },
});
