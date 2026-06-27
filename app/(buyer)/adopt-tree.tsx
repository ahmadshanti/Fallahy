import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { useT, useLanguage } from '../../lib/i18n';
import { generateTreeImage, replicateConfigured } from '../../lib/replicate';
import { useProducts } from '../../hooks/useProducts';

type Season = 'spring' | 'summer' | 'autumn' | 'winter';

interface Tree {
  id: string;
  nameAr: string;
  nameEn: string;
  ageAr: string;
  ageEn: string;
  price: number;
  image: string;
  yieldAr: string;
  yieldEn: string;
}

const trees: Tree[] = [
  {
    id: '1',
    nameAr: 'شجرة زيتون رومي',
    nameEn: 'Roman olive tree',
    ageAr: '200 سنة',
    ageEn: '200 years',
    price: 150,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800',
    yieldAr: '15-20 لتر زيت سنوياً',
    yieldEn: '15-20 L of oil per year',
  },
  {
    id: '2',
    nameAr: 'شجرة تين بلدي',
    nameEn: 'Local fig tree',
    ageAr: '50 سنة',
    ageEn: '50 years',
    price: 80,
    image: 'https://images.unsplash.com/photo-1601379760883-1bb497c558ee?w=800',
    yieldAr: '30 كغ تين موسمياً',
    yieldEn: '30 kg of figs per season',
  },
  {
    id: '3',
    nameAr: 'شجرة موز',
    nameEn: 'Banana tree',
    ageAr: '5 سنوات',
    ageEn: '5 years',
    price: 100,
    image: 'https://images.unsplash.com/photo-1574226516831-e1dff420e562?w=800',
    yieldAr: '40 كغ موز سنوياً',
    yieldEn: '40 kg of bananas per year',
  },
  {
    id: '4',
    nameAr: 'شجرة رمان',
    nameEn: 'Pomegranate tree',
    ageAr: '30 سنة',
    ageEn: '30 years',
    price: 120,
    image: 'https://images.unsplash.com/photo-1542833008-2c7a3859c4b1?w=800',
    yieldAr: '25 كغ رمان موسمياً',
    yieldEn: '25 kg per season',
  },
];

export default function AdoptTreeScreen() {
  const router = useRouter();
  const t = useT();
  const language = useLanguage();
  const { data: allProducts = [] } = useProducts();

  const farmerPostedTrees: Tree[] = React.useMemo(
    () =>
      allProducts
        .filter((p) => p.isAdoptable)
        .map((p) => ({
          id: `product-${p.id}`,
          nameAr: p.name,
          nameEn: p.name,
          ageAr: 'من المزارع',
          ageEn: 'from farmer',
          price: Math.round(p.retailPrice * 30),
          image: p.image || 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=800',
          yieldAr: `${p.available} ${p.unit} موسمياً`,
          yieldEn: `${p.available} ${p.unit} per season`,
        })),
    [allProducts]
  );

  const allTrees = React.useMemo(() => [...farmerPostedTrees, ...trees], [farmerPostedTrees]);

  const [visualizing, setVisualizing] = useState<Tree | null>(null);
  const [season, setSeason] = useState<Season>('spring');
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const seasonLabel: Record<Season, { ar: string; en: string }> = {
    spring: { ar: 'الربيع', en: 'Spring' },
    summer: { ar: 'الصيف', en: 'Summer' },
    autumn: { ar: 'الخريف', en: 'Autumn' },
    winter: { ar: 'الشتاء', en: 'Winter' },
  };

  const handleVisualize = async (tree: Tree) => {
    setVisualizing(tree);
    setGeneratedUrl(null);
    setError(null);
    if (!replicateConfigured) {
      setError(
        language === 'ar'
          ? 'مفتاح Replicate غير مهيأ — يتم عرض الصورة الافتراضية.'
          : 'Replicate API key not configured — showing default image.'
      );
      setGeneratedUrl(tree.image);
      return;
    }
    setLoading(true);
    try {
      const url = await generateTreeImage(
        language === 'ar' ? tree.nameAr : tree.nameEn,
        seasonLabel[season].en
      );
      setGeneratedUrl(url);
    } catch (err: any) {
      setError(err?.message || 'Generation failed');
      setGeneratedUrl(tree.image);
    } finally {
      setLoading(false);
    }
  };

  const regenerate = () => {
    if (visualizing) handleVisualize(visualizing);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('adopt.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Ionicons name="leaf" size={32} color={colors.primary} />
          <Text style={styles.heroTitle}>{t('adopt.title')}</Text>
          <Text style={styles.heroSubtitle}>{t('adopt.subtitle')}</Text>
        </View>

        {allTrees.map((tree) => (
          <View key={tree.id} style={styles.treeCard}>
            <Image source={{ uri: tree.image }} style={styles.treeImage} contentFit="cover" />
            <View style={styles.treeInfo}>
              <Text style={styles.treeName}>{language === 'ar' ? tree.nameAr : tree.nameEn}</Text>
              <View style={styles.metaRow}>
                <Badge label={language === 'ar' ? tree.ageAr : tree.ageEn} variant="status" />
              </View>
              <Text style={styles.treeYield}>{language === 'ar' ? tree.yieldAr : tree.yieldEn}</Text>
              <Text style={styles.treePrice}>₪{tree.price} {language === 'ar' ? '/ سنوياً' : '/ year'}</Text>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.visualizeBtn}
                  onPress={() => handleVisualize(tree)}
                  accessibilityRole="button"
                  accessibilityLabel={t('adopt.visualize')}
                >
                  <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
                  <Text style={styles.visualizeText}>{t('adopt.visualize')}</Text>
                </TouchableOpacity>
                <Button
                  title={t('adopt.cta')}
                  onPress={() =>
                    Alert.alert(
                      t('adopt.cta'),
                      language === 'ar' ? 'سنرسل تأكيدك قريباً' : 'We will confirm shortly'
                    )
                  }
                  size="sm"
                />
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={!!visualizing} animationType="slide" onRequestClose={() => setVisualizing(null)}>
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setVisualizing(null)}>
              <Ionicons name="close" size={26} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {visualizing && (language === 'ar' ? visualizing.nameAr : visualizing.nameEn)}
            </Text>
            <View style={{ width: 26 }} />
          </View>

          <View style={styles.seasonRow}>
            {(Object.keys(seasonLabel) as Season[]).map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.seasonChip, season === s && styles.seasonChipActive]}
                onPress={() => {
                  setSeason(s);
                  if (visualizing) handleVisualize(visualizing);
                }}
              >
                <Text style={[styles.seasonText, season === s && styles.seasonTextActive]}>
                  {language === 'ar' ? seasonLabel[s].ar : seasonLabel[s].en}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.imagePane}>
            {loading ? (
              <View style={styles.loadingPane}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>{t('adopt.generating')}</Text>
              </View>
            ) : generatedUrl ? (
              <Image source={{ uri: generatedUrl }} style={styles.generatedImage} contentFit="cover" />
            ) : null}
            <TouchableOpacity
              style={styles.imageCloseBtn}
              onPress={() => setVisualizing(null)}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.modalActions}>
            <Button
              title={language === 'ar' ? 'إعادة التوليد' : 'Regenerate'}
              onPress={regenerate}
              variant="outlined"
              size="md"
              icon={<Ionicons name="refresh" size={16} color={colors.primary} />}
              fullWidth
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  headerTitle: { fontFamily: 'Cairo_700Bold', fontSize: 18, color: colors.textPrimary },
  content: { padding: spacing.md, paddingBottom: 40 },
  hero: {
    backgroundColor: '#E8F5E1', borderRadius: radius.xl,
    padding: spacing.lg, marginBottom: spacing.md, alignItems: 'center',
  },
  heroTitle: {
    fontFamily: 'Cairo_700Bold', fontSize: 22, color: colors.primary,
    marginTop: 8, textAlign: 'center',
  },
  heroSubtitle: {
    fontFamily: 'Cairo_400Regular', fontSize: 14, color: colors.textSecondary,
    marginTop: 4, textAlign: 'center',
  },
  treeCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    overflow: 'hidden', marginBottom: spacing.md,
  },
  treeImage: { width: '100%', height: 180 },
  treeInfo: { padding: spacing.md },
  treeName: {
    fontFamily: 'Cairo_700Bold', fontSize: 18, color: colors.textPrimary,
    textAlign: 'right',
  },
  metaRow: { flexDirection: 'row-reverse', marginTop: 6 },
  treeYield: {
    fontFamily: 'Cairo_400Regular', fontSize: 13, color: colors.textSecondary,
    textAlign: 'right', marginTop: 6,
  },
  treePrice: {
    fontFamily: 'Cairo_700Bold', fontSize: 18, color: colors.success,
    textAlign: 'right', marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    marginTop: spacing.sm, gap: spacing.sm,
  },
  visualizeBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.primary,
  },
  visualizeText: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: colors.primary },

  // Modal
  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  modalTitle: { fontFamily: 'Cairo_700Bold', fontSize: 17, color: colors.textPrimary },
  seasonRow: {
    flexDirection: 'row-reverse', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  seasonChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  seasonChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  seasonText: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: colors.textSecondary },
  seasonTextActive: { color: '#FFFFFF' },
  imagePane: {
    flex: 1, marginHorizontal: spacing.md, marginVertical: spacing.sm,
    borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.surfaceDim,
    position: 'relative',
  },
  generatedImage: { width: '100%', height: '100%' },
  imageCloseBtn: {
    position: 'absolute', top: 12, end: 12,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
  },
  loadingPane: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  loadingText: {
    fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: colors.textMuted,
  },
  errorText: {
    fontFamily: 'Cairo_400Regular', fontSize: 12, color: colors.error,
    textAlign: 'center', paddingHorizontal: spacing.md,
  },
  modalActions: { padding: spacing.md },
});
