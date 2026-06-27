import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  StatusBar,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { getAllTrees, adoptTree, getAdoptedTreesByBuyer } from '../../lib/trees';
import { Tree, AdoptedTree } from '../../types';
import { isDevMode } from '../../lib/devMode';
import { useDevAdoptedTreesStore } from '../../store/devAdoptedTreesStore';
import { generateTreeImage, replicateConfigured } from '../../lib/replicate';

export default function TreesScreen() {
  const { buyerId } = useAuthStore();
  const devAdopted = useDevAdoptedTreesStore((s) => s.adopted);
  const adoptInDevStore = useDevAdoptedTreesStore((s) => s.adopt);

  const [activeTab, setActiveTab] = useState<'available' | 'adopted'>('available');
  const [trees, setTrees] = useState<Tree[]>([]);
  const [adoptedTrees, setAdoptedTrees] = useState<AdoptedTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [adoptingId, setAdoptingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedTree, setSelectedTree] = useState<Tree | null>(null);
  const [customName, setCustomName] = useState('');

  // Photo visualizer for adopted trees
  const [photoTree, setPhotoTree] = useState<AdoptedTree | null>(null);
  const [photoSeason, setPhotoSeason] = useState<'Spring' | 'Summer' | 'Autumn' | 'Winter'>('Spring');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allTrees, adopted] = await Promise.all([
        getAllTrees(),
        // In dev mode the buyer doesn't exist in the users table, so skip the
        // DB query (it would 200 with [] anyway under RLS, but cleaner this way).
        buyerId && !isDevMode ? getAdoptedTreesByBuyer(buyerId) : Promise.resolve([]),
      ]);
      setTrees(allTrees);
      setAdoptedTrees(adopted);
    } catch (err) {
      console.error('Trees load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Merge DB-adopted with dev-store-adopted so the "أشجاري المتبناة" tab shows both
  const visibleAdopted = isDevMode ? [...devAdopted, ...adoptedTrees] : adoptedTrees;

  const handleAdoptPress = (tree: Tree) => {
    if (!buyerId) {
      Alert.alert('تسجيل الدخول', 'يجب تسجيل الدخول أولا');
      return;
    }
    setSelectedTree(tree);
    setCustomName(tree.suggested_name || '');
    setShowModal(true);
  };

  const confirmAdopt = async () => {
    if (!selectedTree || !buyerId) return;
    if (!customName.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسم للشجرة');
      return;
    }
    try {
      setAdoptingId(selectedTree.id);
      setShowModal(false);
      if (isDevMode) {
        // Save to local zustand store — DB write would fail because the dev
        // buyer UUID isn't a real row in the users table (FK constraint).
        adoptInDevStore(selectedTree, buyerId, customName.trim());
      } else {
        await adoptTree(selectedTree.id, buyerId, customName.trim());
        await loadData();
      }
      Alert.alert('تم التبني', `تم تبني شجرة "${customName.trim()}" بنجاح`);
    } catch (err: any) {
      console.error('Adopt tree failed:', err);
      Alert.alert('خطأ', err?.message || err?.toString() || 'تعذر تبني الشجرة');
    } finally {
      setAdoptingId(null);
      setSelectedTree(null);
      setCustomName('');
    }
  };

  const renderTreeCard = ({ item }: { item: Tree }) => (
    <View style={styles.treeCard}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.treeImage} />
      ) : (
        <View style={[styles.treeImage, styles.placeholderImage]}>
          <Ionicons name="leaf" size={36} color={colors.textMuted} />
        </View>
      )}
      <View style={styles.treeInfo}>
        <Text style={styles.treeType}>{item.tree_type}</Text>
        <View style={styles.treeDetails}>
          {item.age_years && (
            <View style={styles.detailChip}>
              <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
              <Text style={styles.detailText}>{item.age_years} سنة</Text>
            </View>
          )}
          {item.production_season && (
            <View style={styles.detailChip}>
              <Ionicons name="sunny-outline" size={12} color={colors.textMuted} />
              <Text style={styles.detailText}>{item.production_season}</Text>
            </View>
          )}
        </View>
        <View style={styles.farmerRow}>
          <Ionicons name="location-outline" size={12} color={colors.textMuted} />
          <Text style={styles.farmerText}>
            {item.farmers?.farm_name} - {item.farmers?.city}
          </Text>
        </View>
        <View style={styles.priceAndBtn}>
          <TouchableOpacity
            style={[styles.adoptBtn, adoptingId === item.id && styles.adoptBtnDisabled]}
            onPress={() => handleAdoptPress(item)}
            disabled={adoptingId === item.id}
          >
            {adoptingId === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.adoptBtnText}>تبنّى هذه الشجرة</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.treePrice}>{item.annual_price} د.أ/سنة</Text>
        </View>
        <Text style={styles.availableCount}>
          متبقي: {item.available_count} شجرة
        </Text>
      </View>
    </View>
  );

  const openPhotos = (tree: AdoptedTree, season: 'Spring' | 'Summer' | 'Autumn' | 'Winter' = 'Spring') => {
    setPhotoTree(tree);
    setPhotoSeason(season);
    setPhotoUrl(null);
    setPhotoError(null);
    if (!replicateConfigured) {
      setPhotoError('Replicate غير مهيأ — يتم عرض صورة الشجرة الأصلية');
      setPhotoUrl(tree.trees?.image_url || null);
      return;
    }
    setPhotoLoading(true);
    generateTreeImage(tree.trees?.tree_type || tree.custom_name, season)
      .then((url) => setPhotoUrl(url))
      .catch((err) => {
        setPhotoError(err?.message || 'تعذّر توليد الصورة');
        setPhotoUrl(tree.trees?.image_url || null);
      })
      .finally(() => setPhotoLoading(false));
  };

  const renderAdoptedCard = ({ item }: { item: AdoptedTree }) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      active: { label: 'نشطة', color: colors.success },
      expired: { label: 'منتهية', color: colors.error },
      pending: { label: 'قيد المراجعة', color: colors.secondary },
    };
    const st = statusMap[item.status] || statusMap.active;

    return (
      <TouchableOpacity
        style={styles.adoptedCard}
        onPress={() => openPhotos(item)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`عرض صور ${item.custom_name}`}
      >
        {item.trees?.image_url ? (
          <Image source={{ uri: item.trees.image_url }} style={styles.adoptedImage} />
        ) : (
          <View style={[styles.adoptedImage, styles.placeholderImage]}>
            <Ionicons name="leaf" size={24} color={colors.textMuted} />
          </View>
        )}
        <View style={styles.adoptedInfo}>
          <View style={styles.adoptedHeader}>
            <View style={[styles.statusBadge, { backgroundColor: st.color + '20' }]}>
              <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
            </View>
            <Text style={styles.adoptedName}>{item.custom_name}</Text>
          </View>
          <Text style={styles.adoptedType}>{item.trees?.tree_type}</Text>
          <Text style={styles.adoptedFarm}>
            {item.trees?.farmers?.farm_name} - {item.trees?.farmers?.city}
          </Text>
          <Text style={styles.adoptedDate}>
            تاريخ التبني: {new Date(item.adopted_at).toLocaleDateString('ar')}
          </Text>
          <View style={styles.viewPhotosHint}>
            <Ionicons name="sparkles" size={12} color="#7C3AED" />
            <Text style={styles.viewPhotosHintText}>اضغط لعرض الصور بالذكاء الاصطناعي</Text>
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
        <Text style={styles.headerTitle}>أشجاري</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'adopted' && styles.tabActive]}
          onPress={() => setActiveTab('adopted')}
        >
          <Text style={[styles.tabText, activeTab === 'adopted' && styles.tabTextActive]}>
            أشجاري المتبناة
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'available' && styles.tabActive]}
          onPress={() => setActiveTab('available')}
        >
          <Text style={[styles.tabText, activeTab === 'available' && styles.tabTextActive]}>
            الأشجار المتاحة
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : activeTab === 'available' ? (
        trees.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="leaf-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>لا توجد أشجار متاحة للتبني حاليا</Text>
          </View>
        ) : (
          <FlatList
            data={trees}
            renderItem={renderTreeCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )
      ) : visibleAdopted.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>لم تتبنَّ أي شجرة بعد</Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => setActiveTab('available')}
          >
            <Text style={styles.browseBtnText}>تصفح الأشجار المتاحة</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={visibleAdopted}
          renderItem={renderAdoptedCard}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Adopt Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>تبنّى شجرة</Text>
            <Text style={styles.modalSubtitle}>
              {selectedTree?.tree_type} - {selectedTree?.annual_price} د.أ/سنة
            </Text>
            <Text style={styles.modalLabel}>اختر اسما للشجرة</Text>
            <TextInput
              style={styles.modalInput}
              value={customName}
              onChangeText={setCustomName}
              placeholder="مثال: شجرتي الأولى"
              placeholderTextColor={colors.textMuted}
              textAlign="right"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => {
                  setShowModal(false);
                  setSelectedTree(null);
                  setCustomName('');
                }}
              >
                <Text style={styles.modalCancelText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={confirmAdopt}>
                <Text style={styles.modalConfirmText}>تأكيد التبني</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* AI Photo Visualizer Modal for adopted trees */}
      <Modal visible={!!photoTree} transparent animationType="slide" onRequestClose={() => setPhotoTree(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.photoModal}>
            <View style={styles.photoModalHeader}>
              <TouchableOpacity onPress={() => setPhotoTree(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={styles.photoModalTitle}>{photoTree?.custom_name}</Text>
                <Text style={styles.photoModalSubtitle}>{photoTree?.trees?.tree_type}</Text>
              </View>
            </View>

            <View style={styles.photoFrame}>
              {photoLoading ? (
                <View style={styles.photoLoadingWrap}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.photoLoadingText}>الذكاء الاصطناعي يولّد الصورة...</Text>
                </View>
              ) : photoUrl ? (
                <Image source={{ uri: photoUrl }} style={styles.photoImage} />
              ) : (
                <View style={styles.photoLoadingWrap}>
                  <Ionicons name="image-outline" size={48} color={colors.textMuted} />
                </View>
              )}
              {photoError && (
                <View style={styles.photoErrorBanner}>
                  <Text style={styles.photoErrorText}>{photoError}</Text>
                </View>
              )}
            </View>

            <Text style={styles.seasonLabel}>اختر الموسم</Text>
            <View style={styles.seasonRow}>
              {(['Spring', 'Summer', 'Autumn', 'Winter'] as const).map((s) => {
                const labels = { Spring: 'الربيع', Summer: 'الصيف', Autumn: 'الخريف', Winter: 'الشتاء' };
                const icons = { Spring: 'flower', Summer: 'sunny', Autumn: 'leaf', Winter: 'snow' } as const;
                const active = photoSeason === s;
                return (
                  <TouchableOpacity
                    key={s}
                    style={[styles.seasonBtn, active && styles.seasonBtnActive]}
                    onPress={() => photoTree && openPhotos(photoTree, s)}
                    disabled={photoLoading}
                  >
                    <Ionicons name={icons[s]} size={16} color={active ? '#FFFFFF' : colors.primary} />
                    <Text style={[styles.seasonBtnText, active && styles.seasonBtnTextActive]}>{labels[s]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.regenerateBtn}
              onPress={() => photoTree && openPhotos(photoTree, photoSeason)}
              disabled={photoLoading}
            >
              <Ionicons name="refresh" size={16} color={colors.primary} />
              <Text style={styles.regenerateBtnText}>إعادة التوليد</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: colors.surfaceDim,
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 14,
  },
  treeCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  treeImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  placeholderImage: {
    backgroundColor: colors.surfaceDim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  treeInfo: {
    padding: 14,
    alignItems: 'flex-end',
  },
  treeType: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  treeDetails: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceDim,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  detailText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 11,
    color: colors.textSecondary,
    writingDirection: 'rtl',
  },
  farmerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  farmerText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    writingDirection: 'rtl',
  },
  priceAndBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 12,
  },
  treePrice: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 16,
    color: colors.secondary,
  },
  adoptBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  adoptBtnDisabled: {
    opacity: 0.6,
  },
  adoptBtnText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: '#fff',
  },
  availableCount: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
    writingDirection: 'rtl',
  },
  adoptedCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  adoptedImage: {
    width: 100,
    height: 120,
    resizeMode: 'cover',
  },
  adoptedInfo: {
    flex: 1,
    padding: 12,
    alignItems: 'flex-end',
  },
  adoptedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    justifyContent: 'flex-end',
  },
  adoptedName: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 15,
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 10,
  },
  adoptedType: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    color: colors.textSecondary,
    writingDirection: 'rtl',
    marginTop: 2,
  },
  adoptedFarm: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 11,
    color: colors.textMuted,
    writingDirection: 'rtl',
    marginTop: 2,
  },
  adoptedDate: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 10,
    color: colors.textMuted,
    writingDirection: 'rtl',
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 60,
  },
  emptyText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  browseBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  browseBtnText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    alignItems: 'flex-end',
  },
  modalTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 20,
    color: colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    width: '100%',
  },
  modalSubtitle: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 4,
    marginBottom: 16,
    width: '100%',
  },
  modalLabel: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 8,
    width: '100%',
  },
  modalInput: {
    backgroundColor: colors.surfaceDim,
    borderRadius: 10,
    padding: 12,
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: colors.textPrimary,
    width: '100%',
    writingDirection: 'rtl',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    width: '100%',
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: colors.textSecondary,
  },
  modalConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: '#fff',
  },
  viewPhotosHint: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginTop: 6,
  },
  viewPhotosHintText: {
    fontFamily: 'Cairo_600SemiBold', fontSize: 11, color: '#7C3AED',
  },
  photoModal: {
    width: '92%', maxWidth: 480,
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16,
  },
  photoModalHeader: {
    flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 12, gap: 8,
  },
  photoModalTitle: {
    fontFamily: 'Cairo_700Bold', fontSize: 18, color: colors.textPrimary,
    textAlign: 'right', writingDirection: 'rtl',
  },
  photoModalSubtitle: {
    fontFamily: 'Cairo_400Regular', fontSize: 13, color: colors.textMuted,
    textAlign: 'right', writingDirection: 'rtl',
  },
  photoFrame: {
    aspectRatio: 4 / 5, width: '100%', borderRadius: 14, overflow: 'hidden',
    backgroundColor: '#F1F5F9', marginBottom: 14,
  },
  photoImage: { width: '100%', height: '100%' },
  photoLoadingWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  photoLoadingText: {
    fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: colors.textMuted,
  },
  photoErrorBanner: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', padding: 8,
  },
  photoErrorText: {
    fontFamily: 'Cairo_400Regular', fontSize: 11, color: '#FFFFFF',
    textAlign: 'center', writingDirection: 'rtl',
  },
  seasonLabel: {
    fontFamily: 'Cairo_700Bold', fontSize: 13, color: colors.textPrimary,
    textAlign: 'right', writingDirection: 'rtl', marginBottom: 8,
  },
  seasonRow: {
    flexDirection: 'row-reverse', gap: 6, marginBottom: 12,
  },
  seasonBtn: {
    flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: colors.primary, backgroundColor: '#FFFFFF',
  },
  seasonBtnActive: { backgroundColor: colors.primary },
  seasonBtnText: {
    fontFamily: 'Cairo_600SemiBold', fontSize: 12, color: colors.primary,
  },
  seasonBtnTextActive: { color: '#FFFFFF' },
  regenerateBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  regenerateBtnText: {
    fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: colors.primary,
  },
});
