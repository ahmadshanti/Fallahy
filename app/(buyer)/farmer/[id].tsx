import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Avatar from '../../../components/ui/Avatar';
import Badge from '../../../components/ui/Badge';
import RatingStars from '../../../components/ui/RatingStars';
import Button from '../../../components/ui/Button';
import ProductCard from '../../../components/buyer/ProductCard';
import { colors } from '../../../constants/colors';
import { radius, spacing } from '../../../constants/spacing';
import { useFarmer } from '../../../hooks/useFarmers';
import { useFarmerProducts } from '../../../hooks/useProducts';

const { width } = Dimensions.get('window');

export default function FarmerProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: farmer, isLoading: farmerLoading } = useFarmer(id as string);
  const { data: farmerProducts = [] } = useFarmerProducts(id as string);
  const [showFullStory, setShowFullStory] = useState(false);

  if (farmerLoading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!farmer) {
    return (
      <SafeAreaView style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Ionicons name="alert-circle-outline" size={60} color={colors.textMuted} />
        <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 18, color: colors.textMuted, marginTop: spacing.md }}>المزارع غير موجود</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: spacing.md }}>
          <Text style={{ fontFamily: 'Cairo_600SemiBold', fontSize: 16, color: colors.primary }}>العودة</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Image
            source={{ uri: farmer?.avatar || '' }}
            style={styles.coverImage}
            contentFit="cover"
          />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={StyleSheet.absoluteFillObject} />
          <SafeAreaView style={styles.heroOverlay}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-forward" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </SafeAreaView>
          <View style={styles.heroBottom}>
            <Text style={styles.farmerName}>{farmer.name}</Text>
            {farmer.isVerified && <Badge label="موثّق ✓" variant="verified" />}
          </View>
        </View>

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <Avatar uri={farmer.avatar} size={80} style={styles.avatar} />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{farmer.totalProducts}</Text>
            <Text style={styles.statLabel}>منتج</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{farmer.rating}</Text>
            <Text style={styles.statLabel}>التقييم</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{farmer.reviewCount}</Text>
            <Text style={styles.statLabel}>تقييم</Text>
          </View>
        </View>

        {/* Story */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>قصة المزرعة</Text>
          <Text style={styles.storyText} numberOfLines={showFullStory ? undefined : 2}>
            {farmer.story}
          </Text>
          <TouchableOpacity onPress={() => setShowFullStory(!showFullStory)}>
            <Text style={styles.showMore}>{showFullStory ? 'عرض أقل' : 'عرض المزيد'}</Text>
          </TouchableOpacity>
        </View>

        {/* Map Preview */}
        <TouchableOpacity style={styles.mapPreview} onPress={() => router.push('/(buyer)/map')}>
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={40} color={colors.primary} />
            <Text style={styles.mapText}>المزرعة على الخريطة</Text>
          </View>
        </TouchableOpacity>

        {/* Specialties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>التخصص</Text>
          <View style={styles.chipsRow}>
            {farmer.specialty?.map((s: string) => (
              <Badge key={s} label={s} variant="organic" />
            ))}
          </View>
        </View>

        {/* Products */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>منتجاته</Text>
          {farmerProducts.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
              <Text style={{ fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: colors.textMuted }}>لا توجد منتجات حالياً</Text>
            </View>
          ) : (
            <View style={styles.productsGrid}>
              {farmerProducts.map((product) => (
                <View key={product.id} style={styles.productItem}>
                  <ProductCard
                    product={product}
                    onPress={() => router.push(`/(buyer)/product/${product.id}`)}
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <Button title="تواصل مباشر" onPress={() => {}} size="md" style={{ flex: 1, backgroundColor: '#25D366' }} />
        <Button title="متابعة المزرعة" onPress={() => {}} variant="outlined" size="md" style={{ flex: 1 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hero: { height: 280, position: 'relative' },
  coverImage: { width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
    margin: spacing.md,
    alignSelf: 'flex-end',
  },
  backArrow: { fontSize: 18 },
  heroBottom: {
    position: 'absolute', bottom: 20, left: spacing.md, right: spacing.md,
    flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm,
  },
  farmerName: {
    fontFamily: 'Cairo_700Bold', fontSize: 22, color: '#FFFFFF',
    textAlign: 'right', writingDirection: 'rtl',
  },
  avatarContainer: { alignItems: 'center', marginTop: -40, zIndex: 10 },
  avatar: { borderWidth: 3, borderColor: '#FFFFFF' },
  statsRow: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: spacing.md, marginHorizontal: spacing.lg,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: 'Cairo_700Bold', fontSize: 20, color: colors.textPrimary },
  statLabel: { fontFamily: 'Cairo_400Regular', fontSize: 13, color: colors.textMuted },
  statDivider: { width: 1, height: 30, backgroundColor: colors.border },
  section: { paddingHorizontal: spacing.md, marginTop: spacing.md },
  sectionTitle: {
    fontFamily: 'Cairo_700Bold', fontSize: 18, color: colors.textPrimary,
    textAlign: 'right', writingDirection: 'rtl', marginBottom: spacing.sm,
  },
  storyText: {
    fontFamily: 'Cairo_400Regular', fontSize: 15, color: colors.textSecondary,
    textAlign: 'right', writingDirection: 'rtl', lineHeight: 24,
  },
  showMore: {
    fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: colors.primary,
    textAlign: 'right', marginTop: 4,
  },
  mapPreview: {
    marginHorizontal: spacing.md, marginTop: spacing.md,
    height: 150, borderRadius: radius.lg, overflow: 'hidden',
  },
  mapPlaceholder: {
    flex: 1, backgroundColor: colors.surfaceDim,
    alignItems: 'center', justifyContent: 'center',
  },
  mapIcon: { fontSize: 40 },
  mapText: { fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: colors.primary, marginTop: 8 },
  chipsRow: { flexDirection: 'row-reverse', gap: spacing.sm, flexWrap: 'wrap' },
  productsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm },
  productItem: { width: (width - spacing.md * 3) / 2 },
  bottomBar: {
    flexDirection: 'row-reverse', padding: spacing.md, paddingBottom: 30, gap: spacing.sm,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
  },
});
