import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated, Easing, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { useAuthStore } from '../../store/authStore';
import { useCreateProduct } from '../../hooks/useProducts';

const categories = ['خضار', 'فواكه', 'زيوت', 'أعشاب'];
const units = ['كغ', 'ليتر', 'حبة', 'طرد'];

export default function AddProductScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const createProduct = useCreateProduct();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [retailPrice, setRetailPrice] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('كغ');
  const [isOrganic, setIsOrganic] = useState(false);
  const [selfPick, setSelfPick] = useState(false);
  const [adoptable, setAdoptable] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isRecording) {
      pulseAnim.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseScale, { toValue: 1.3, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseScale, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      pulseAnim.current.start();
    } else {
      pulseAnim.current?.stop();
      Animated.timing(pulseScale, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  }, [isRecording]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && images.length < 3) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const handleVoice = () => {
    setIsRecording(!isRecording);
    if (isRecording) {
      setName('بندورة بلدية');
      setCategory('خضار');
      setRetailPrice('3');
      setWholesalePrice('2.2');
      setQuantity('150');
    }
  };

  const handleSubmit = async () => {
    if (!name || !category || !user?.id) return;
    try {
      await createProduct.mutateAsync({
        farmer_id: user.id,
        name,
        category,
        retail_price: Number(retailPrice),
        wholesale_price: Number(wholesalePrice),
        market_price: Number(retailPrice) * 1.5,
        unit,
        available: Number(quantity),
        harvest_date: 'اليوم',
        is_organic: isOrganic,
        is_fresh: true,
        is_self_pick: selfPick,
        is_adoptable: adoptable,
        savings_percent: Math.round((1 - Number(retailPrice) / (Number(retailPrice) * 1.5)) * 100),
      });
      router.back();
    } catch (err: any) {
      Alert.alert('خطأ', err?.message || 'حدث خطأ في إضافة المنتج');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إضافة منتج</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Input label="اسم المنتج" value={name} onChangeText={setName} placeholder="مثال: بندورة بلدية" />

        {/* Category */}
        <Text style={styles.label}>الفئة</Text>
        <View style={styles.chipsRow}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, category === cat && styles.chipSelected]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.chipText, category === cat && styles.chipTextSelected]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Images */}
        <Text style={styles.label}>الصور</Text>
        <View style={styles.imageRow}>
          {[0, 1, 2].map((i) => (
            <TouchableOpacity key={i} style={styles.imageSlot} onPress={pickImage}>
              {images[i] ? (
                <Text style={styles.imageCheck}>✓</Text>
              ) : (
                <Text style={styles.imagePlus}>+</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Prices */}
        <View style={styles.priceRow}>
          <View style={{ flex: 1 }}>
            <Input label="سعر الجملة" value={wholesalePrice} onChangeText={setWholesalePrice} keyboardType="numeric" placeholder="₪" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="سعر المفرق" value={retailPrice} onChangeText={setRetailPrice} keyboardType="numeric" placeholder="₪" />
          </View>
        </View>

        {/* Quantity + Unit */}
        <View style={styles.priceRow}>
          <View style={styles.unitSelector}>
            <Text style={styles.label}>الوحدة</Text>
            <View style={styles.unitRow}>
              {units.map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[styles.unitChip, unit === u && styles.unitChipSelected]}
                  onPress={() => setUnit(u)}
                >
                  <Text style={[styles.unitText, unit === u && styles.unitTextSelected]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Input label="الكمية المتاحة" value={quantity} onChangeText={setQuantity} keyboardType="numeric" placeholder="0" />
          </View>
        </View>

        {/* Toggles */}
        <View style={styles.togglesSection}>
          {[
            { label: 'عضوي؟', value: isOrganic, setter: setIsOrganic },
            { label: 'متاح للقطف الذاتي؟', value: selfPick, setter: setSelfPick },
            { label: 'متاح للتبني؟', value: adoptable, setter: setAdoptable },
          ].map((toggle) => (
            <View key={toggle.label} style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.switch, toggle.value && styles.switchOn]}
                onPress={() => toggle.setter(!toggle.value)}
              >
                <View style={[styles.switchThumb, toggle.value && styles.switchThumbOn]} />
              </TouchableOpacity>
              <Text style={styles.toggleLabel}>{toggle.label}</Text>
            </View>
          ))}
        </View>

        {/* Voice Input */}
        <View style={styles.voiceSection}>
          <TouchableOpacity onPress={handleVoice}>
            <Animated.View style={[styles.micButton, isRecording && styles.micRecording, { transform: [{ scale: pulseScale }] }]}>
              <Ionicons name="mic" size={28} color="#FFFFFF" />
            </Animated.View>
          </TouchableOpacity>
          <Text style={styles.voiceLabel}>
            {isRecording ? 'جارٍ التسجيل...' : 'اضغط للتحدث'}
          </Text>
        </View>

        <Button
          title="نشر المنتج"
          onPress={handleSubmit}
          fullWidth
          size="lg"
          disabled={!name || !category}
          loading={createProduct.isPending}
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
    textAlign: 'right', writingDirection: 'rtl', marginBottom: spacing.xs,
  },
  chipsRow: { flexDirection: 'row-reverse', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.primary },
  chipText: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: colors.primary },
  chipTextSelected: { color: '#FFFFFF' },
  imageRow: { flexDirection: 'row-reverse', gap: spacing.sm, marginBottom: spacing.md },
  imageSlot: {
    width: 80, height: 80, borderRadius: radius.lg,
    borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceDim,
  },
  imagePlus: { fontSize: 28, color: colors.textMuted },
  imageCheck: { fontSize: 24, color: colors.success },
  priceRow: { flexDirection: 'row-reverse', gap: spacing.sm },
  unitSelector: { flex: 1 },
  unitRow: { flexDirection: 'row-reverse', gap: 4, marginBottom: spacing.md },
  unitChip: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  unitChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  unitText: { fontFamily: 'Cairo_600SemiBold', fontSize: 11, color: colors.textSecondary },
  unitTextSelected: { color: '#FFFFFF' },
  togglesSection: { marginBottom: spacing.lg },
  toggleRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  toggleLabel: { fontFamily: 'Cairo_400Regular', fontSize: 15, color: colors.textPrimary },
  switch: {
    width: 50, height: 28, borderRadius: 14,
    backgroundColor: colors.border, justifyContent: 'center', paddingHorizontal: 2,
  },
  switchOn: { backgroundColor: colors.primary },
  switchThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFFFFF' },
  switchThumbOn: { alignSelf: 'flex-end' },
  voiceSection: { alignItems: 'center', marginBottom: spacing.lg },
  micButton: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  micRecording: { backgroundColor: colors.error },
  micIcon: { fontSize: 28 },
  voiceLabel: {
    fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: colors.textMuted, marginTop: 8,
  },
});
