import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList, Alert,
  ScrollView, Image as RNImage,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { useAuthStore } from '../../store/authStore';
import { getTreesByFarmer, addTree, deleteTree } from '../../lib/trees';
import { supabase } from '../../lib/supabase';
import { isDevMode } from '../../lib/devMode';
import { useDevFarmerTreesStore } from '../../store/devFarmerTreesStore';

export default function FarmerTreesScreen() {
  const router = useRouter();
  const farmerId = useAuthStore((s) => s.farmerId);
  const devTrees = useDevFarmerTreesStore((s) => s.created);
  const addDevTree = useDevFarmerTreesStore((s) => s.add);
  const removeDevTree = useDevFarmerTreesStore((s) => s.remove);
  const [trees, setTrees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [treeType, setTreeType] = useState('');
  const [suggestedName, setSuggestedName] = useState('');
  const [ageYears, setAgeYears] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [annualPrice, setAnnualPrice] = useState('');
  const [availableCount, setAvailableCount] = useState('');
  const [productionSeason, setProductionSeason] = useState('');
  const [soilType, setSoilType] = useState('');
  const [extraInfo, setExtraInfo] = useState('');

  const loadTrees = async () => {
    if (!farmerId) return;
    setLoading(true);
    try {
      // In dev mode skip DB (fake farmer ID has no FK target rows)
      if (isDevMode) {
        setTrees(devTrees);
      } else {
        const data = await getTreesByFarmer(farmerId);
        setTrees(data);
      }
    } catch (err) {
      console.log('Error loading trees:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTrees();
    }, [farmerId])
  );

  const resetForm = () => {
    setTreeType('');
    setSuggestedName('');
    setAgeYears('');
    setImageUri(null);
    setAnnualPrice('');
    setAvailableCount('');
    setProductionSeason('');
    setSoilType('');
    setExtraInfo('');
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('تنبيه', 'يرجى السماح بالوصول للصور');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleAddTree = async () => {
    // Hard guards — Number('') is 0 but annual_price column is NOT NULL,
    // and Postgres has been known to coerce the JSON value before insert.
    const price = parseFloat(annualPrice);
    if (!treeType || !annualPrice.trim() || isNaN(price) || price <= 0 || !farmerId) {
      Alert.alert('تنبيه', 'يرجى ملء الحقول المطلوبة (نوع الشجرة + السعر السنوي)');
      return;
    }
    setSaving(true);
    try {
      let imageUrl: string | null = null;
      if (imageUri && !isDevMode) {
        try {
          const fileExt = imageUri.split('.').pop()?.split('?')[0] || 'jpg';
          const fileName = `${farmerId}/${Date.now()}.${fileExt}`;
          const formData = new FormData();
          formData.append('file', { uri: imageUri, name: `tree.${fileExt}`, type: `image/${fileExt}` } as any);
          const { error: uploadError } = await supabase.storage.from('tree-images').upload(fileName, formData, { upsert: true });
          if (!uploadError) {
            const { data: urlData } = supabase.storage.from('tree-images').getPublicUrl(fileName);
            imageUrl = urlData.publicUrl;
          }
        } catch (imgErr) {
          console.log('Image upload skipped:', imgErr);
        }
      } else if (imageUri && isDevMode) {
        // Just use the local file URI in dev mode (no storage write)
        imageUrl = imageUri;
      }

      const treeData = {
        farmer_id: farmerId,
        tree_type: treeType,
        suggested_name: suggestedName || null,
        age_years: ageYears ? Number(ageYears) : null,
        image_url: imageUrl,
        annual_price: price,
        available_count: availableCount ? Number(availableCount) : 1,
        production_season: productionSeason || null,
        soil_type: soilType || null,
        extra_info: extraInfo || null,
      };

      if (isDevMode) {
        // Fake farmer UUID violates trees_farmer_id_fkey — save locally
        addDevTree({ ...(treeData as any), id: `dev-tree-${Date.now()}` });
      } else {
        await addTree(treeData);
      }

      Alert.alert('تم', 'تم إضافة الشجرة بنجاح');
      resetForm();
      setShowForm(false);
      loadTrees();
    } catch (err: any) {
      Alert.alert('خطأ', err?.message || 'حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTree = (treeId: string, treeName: string) => {
    Alert.alert(
      'حذف الشجرة',
      `هل أنت متأكد من حذف "${treeName}"؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              if (isDevMode || treeId.startsWith('dev-tree-')) {
                removeDevTree(treeId);
              } else {
                await deleteTree(treeId);
              }
              setTrees((prev) => prev.filter((t) => t.id !== treeId));
            } catch (err: any) {
              Alert.alert('خطأ', err?.message || 'فشل حذف الشجرة');
            }
          },
        },
      ]
    );
  };

  if (showForm) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { setShowForm(false); resetForm(); }}>
            <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>إضافة شجرة</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
          {/* Image */}
          <Text style={styles.label}>صورة الشجرة</Text>
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {imageUri ? (
              <RNImage source={{ uri: imageUri }} style={styles.imagePreview} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera-outline" size={36} color={colors.textMuted} />
                <Text style={styles.imageText}>إضافة صورة</Text>
              </View>
            )}
          </TouchableOpacity>

          <Input label="نوع الشجرة *" value={treeType} onChangeText={setTreeType} placeholder="مثال: زيتون، تين، رمان" />
          <Input label="الاسم المقترح" value={suggestedName} onChangeText={setSuggestedName} placeholder="اسم مميز للشجرة" />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input label="العمر (سنوات)" value={ageYears} onChangeText={setAgeYears} keyboardType="numeric" placeholder="0" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="السعر السنوي (₪) *" value={annualPrice} onChangeText={setAnnualPrice} keyboardType="numeric" placeholder="0" />
            </View>
          </View>
          <Input label="العدد المتاح" value={availableCount} onChangeText={setAvailableCount} keyboardType="numeric" placeholder="1" />
          <Input label="موسم الإنتاج" value={productionSeason} onChangeText={setProductionSeason} placeholder="مثال: أيلول - تشرين" />
          <Input label="نوع التربة" value={soilType} onChangeText={setSoilType} placeholder="مثال: تربة حمراء" />
          <Input label="معلومات إضافية" value={extraInfo} onChangeText={setExtraInfo} placeholder="أي تفاصيل إضافية..." multiline />

          <Button
            title="إضافة الشجرة"
            onPress={handleAddTree}
            fullWidth
            size="lg"
            disabled={!treeType || !annualPrice}
            loading={saving}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>أشجاري</Text>
        <TouchableOpacity onPress={() => setShowForm(true)}>
          <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={trees}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View style={styles.treeCard}>
              <View style={styles.treeHeader}>
                <View style={styles.treeInfo}>
                  <Text style={styles.treeName}>{item.tree_type}</Text>
                  {item.suggested_name && (
                    <Text style={styles.treeSubName}>{item.suggested_name}</Text>
                  )}
                </View>
                <View style={styles.treeIcon}>
                  <Ionicons name="leaf" size={24} color={colors.primary} />
                </View>
              </View>
              <View style={styles.treeDetails}>
                {item.age_years && (
                  <Text style={styles.treeDetail}>العمر: {item.age_years} سنة</Text>
                )}
                <Text style={styles.treeDetail}>السعر: {item.annual_price} ₪/سنة</Text>
                <Text style={styles.treeDetail}>المتاح: {item.available_count}</Text>
                {item.production_season && (
                  <Text style={styles.treeDetail}>الموسم: {item.production_season}</Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.deleteTreeBtn}
                onPress={() => handleDeleteTree(item.id, item.tree_type)}
              >
                <Ionicons name="trash-outline" size={16} color={colors.error} />
                <Text style={styles.deleteTreeText}>حذف</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 80 }}>
              <Ionicons name="leaf-outline" size={60} color={colors.textMuted} />
              <Text style={styles.emptyText}>لم تضف أي شجرة بعد</Text>
              <Button title="إضافة شجرة" onPress={() => setShowForm(true)} />
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  headerTitle: { fontFamily: 'Cairo_700Bold', fontSize: 18, color: colors.textPrimary },
  formScroll: { padding: spacing.md, paddingBottom: 40 },
  label: {
    fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: colors.textPrimary,
    textAlign: 'right', writingDirection: 'rtl', marginBottom: spacing.xs,
  },
  imagePicker: {
    width: '100%', height: 150, borderRadius: radius.xl,
    borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed',
    backgroundColor: colors.surfaceDim, overflow: 'hidden', marginBottom: spacing.md,
  },
  imagePreview: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imageText: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: colors.textMuted, marginTop: 4 },
  row: { flexDirection: 'row-reverse', gap: spacing.sm },
  treeCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  treeHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  treeIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#E8F5E1', alignItems: 'center', justifyContent: 'center',
  },
  treeInfo: { flex: 1, marginLeft: spacing.sm },
  treeName: {
    fontFamily: 'Cairo_700Bold', fontSize: 16, color: colors.textPrimary,
    textAlign: 'right', writingDirection: 'rtl',
  },
  treeSubName: {
    fontFamily: 'Cairo_400Regular', fontSize: 13, color: colors.textMuted,
    textAlign: 'right',
  },
  treeDetails: {
    marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  treeDetail: {
    fontFamily: 'Cairo_400Regular', fontSize: 13, color: colors.textSecondary,
    textAlign: 'right', writingDirection: 'rtl', marginBottom: 2,
  },
  deleteTreeBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 4,
    alignSelf: 'flex-end', marginTop: spacing.sm,
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.error,
  },
  deleteTreeText: { fontFamily: 'Cairo_600SemiBold', fontSize: 12, color: colors.error },
  emptyText: {
    fontFamily: 'Cairo_600SemiBold', fontSize: 16, color: colors.textMuted,
    marginVertical: spacing.md,
  },
});
