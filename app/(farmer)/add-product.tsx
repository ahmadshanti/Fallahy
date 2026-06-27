import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Image as RNImage, ActivityIndicator, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { useAuthStore } from '../../store/authStore';
import { addProduct, updateProduct } from '../../lib/products';
import { supabase } from '../../lib/supabase';
import { aiServiceConfigured, voiceParseProduct, voiceTranscribe } from '../../lib/aiService';

const units = ['كغ', 'ليتر', 'حبة', 'طرد'];
const saleTypes = ['مفرق', 'جملة', 'كلاهما'];

export default function AddProductScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const farmerId = useAuthStore((s) => s.farmerId);

  const isEditing = !!params.editId;
  const editId = params.editId as string;

  const [name, setName] = useState((params.editName as string) || '');
  const [imageUri, setImageUri] = useState<string | null>((params.editImage as string) || null);
  const [quantity, setQuantity] = useState((params.editQuantity as string) || '');
  const [unit, setUnit] = useState((params.editUnit as string) || 'كغ');
  const [saleType, setSaleType] = useState((params.editSaleType as string) || 'مفرق');
  const [retailPrice, setRetailPrice] = useState((params.editRetailPrice as string) || '');
  const [wholesalePrice, setWholesalePrice] = useState((params.editWholesalePrice as string) || '');
  const [discountPercent, setDiscountPercent] = useState((params.editDiscount as string) || '');
  const [isOrganic, setIsOrganic] = useState(params.editOrganic === 'true');
  const [description, setDescription] = useState((params.editDescription as string) || '');
  const [saving, setSaving] = useState(false);

  // Voice-to-product state
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<string>('اضغط للتحدث');
  const recordingRef = useRef<Audio.Recording | null>(null);
  const animScale = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isRecording) {
      pulseAnim.current = Animated.loop(
        Animated.sequence([
          Animated.timing(animScale, { toValue: 1.3, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(animScale, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      pulseAnim.current.start();
    } else {
      pulseAnim.current?.stop();
      Animated.timing(animScale, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  }, [isRecording, animScale]);

  useEffect(() => {
    return () => {
      recordingRef.current?.stopAndUnloadAsync().catch(() => undefined);
    };
  }, []);

  const applyParsedProduct = async (text: string) => {
    setVoiceStatus('جاري الفهم...');
    try {
      const parsed = await voiceParseProduct(text);
      if (parsed.name) setName(parsed.name);
      if (parsed.price != null) {
        setRetailPrice(String(parsed.price));
        if (!wholesalePrice) setWholesalePrice(String(Number((parsed.price * 0.75).toFixed(2))));
      }
      if (parsed.quantity != null) setQuantity(String(parsed.quantity));
      Alert.alert('تم', 'تم تعبئة الحقول من الصوت');
      setVoiceStatus('اضغط للتحدث');
    } catch (err: any) {
      Alert.alert('خطأ في الفهم', err?.message || 'تعذّر فهم الجملة');
      setVoiceStatus('اضغط للتحدث');
    }
  };

  const startRecording = async () => {
    if (!aiServiceConfigured) {
      // Demo fallback when the AI backend isn't running
      setVoiceStatus('جاري المعالجة...');
      setIsProcessing(true);
      await applyParsedProduct('ضيف بندورة بلدية كيلو بثلاث شيكل مية وخمسين كيلو متوفر');
      setIsProcessing(false);
      return;
    }
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('تنبيه', 'يرجى السماح بالوصول للميكروفون');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      recordingRef.current = rec;
      setIsRecording(true);
      setVoiceStatus('جاري التسجيل... اضغط لإيقاف');
    } catch (err: any) {
      Alert.alert('خطأ', err?.message || 'تعذّر بدء التسجيل');
    }
  };

  const stopRecording = async () => {
    const rec = recordingRef.current;
    if (!rec) return;
    setIsRecording(false);
    setIsProcessing(true);
    setVoiceStatus('جاري التحويل لنص...');
    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      recordingRef.current = null;
      if (!uri) { setVoiceStatus('اضغط للتحدث'); return; }
      const t = await voiceTranscribe(uri, 'audio/x-m4a');
      if (!t.text) {
        Alert.alert('تنبيه', 'لم نسمعك بوضوح، حاول مرة ثانية');
        setVoiceStatus('اضغط للتحدث');
        return;
      }
      await applyParsedProduct(t.text);
    } catch (err: any) {
      Alert.alert('خطأ', err?.message || 'تعذّر تحويل الصوت');
      setVoiceStatus('اضغط للتحدث');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoice = async () => {
    if (isProcessing) return;
    if (isRecording) await stopRecording();
    else await startRecording();
  };

  const pickImage = async (fromCamera: boolean) => {
    try {
      if (fromCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('تنبيه', 'يرجى السماح بالوصول للكاميرا من إعدادات الجهاز');
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('تنبيه', 'يرجى السماح بالوصول للصور من إعدادات الجهاز');
          return;
        }
      }
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      };
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('خطأ', 'فشل فتح الكاميرا أو المعرض');
    }
  };

  const showImageOptions = () => {
    Alert.alert('صورة المنتج', 'اختر طريقة إضافة الصورة', [
      { text: 'التقاط صورة', onPress: () => pickImage(true) },
      { text: 'اختيار من المعرض', onPress: () => pickImage(false) },
      { text: 'إلغاء', style: 'cancel' },
    ]);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageUri || !farmerId) return null;
    // If it's an existing URL (not a local file), skip upload
    if (imageUri.startsWith('http')) return imageUri;

    try {
      const fileExt = imageUri.split('.').pop()?.split('?')[0] || 'jpg';
      const fileName = `${farmerId}/${Date.now()}.${fileExt}`;
      const formData = new FormData();
      formData.append('file', { uri: imageUri, name: `product.${fileExt}`, type: `image/${fileExt}` } as any);
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, formData, { upsert: true });
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
        return urlData.publicUrl;
      }
    } catch (e) {
      console.log('Image upload error:', e);
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!name || !farmerId) {
      Alert.alert('تنبيه', 'يرجى ملء اسم المنتج');
      return;
    }
    setSaving(true);
    try {
      const imageUrl = await uploadImage();

      const productData: Record<string, any> = {
        farmer_id: farmerId,
        name,
        image_url: imageUrl,
        quantity_available: Number(quantity) || 0,
        unit,
        sale_type: saleType,
        retail_price: Number(retailPrice) || 0,
        wholesale_price: Number(wholesalePrice) || 0,
        discount_percent: Number(discountPercent) || 0,
        is_organic: isOrganic,
        description,
        is_available: true,
      };

      if (isEditing) {
        await updateProduct(editId, productData);
        Alert.alert('', 'تم تحديث المنتج بنجاح');
      } else {
        await addProduct(productData);
        Alert.alert('', 'تم إضافة المنتج بنجاح');
      }
      router.back();
    } catch (err: any) {
      Alert.alert('خطأ', err?.message || 'حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'تعديل المنتج' : 'إضافة منتج'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Voice-to-product */}
        <View style={styles.voiceCard}>
          <View style={styles.voiceCardText}>
            <Text style={styles.voiceCardTitle}>إضافة بالصوت</Text>
            <Text style={styles.voiceCardSubtitle}>{voiceStatus}</Text>
          </View>
          <TouchableOpacity onPress={handleVoice} disabled={isProcessing} activeOpacity={0.8}>
            <Animated.View style={[styles.voiceMic, isRecording && styles.voiceMicActive, { transform: [{ scale: animScale }] }]}>
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name={isRecording ? 'stop' : 'mic'} size={24} color="#FFFFFF" />
              )}
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Image */}
        <Text style={styles.label}>صورة المنتج</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={showImageOptions}>
          {imageUri ? (
            <RNImage source={{ uri: imageUri }} style={styles.imagePreview} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera-outline" size={36} color={colors.textMuted} />
              <Text style={styles.imageText}>إضافة صورة</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Name */}
        <Input label="اسم المنتج" value={name} onChangeText={setName} placeholder="مثال: بندورة بلدية" />

        {/* Quantity + Unit */}
        <View style={styles.row}>
          <View style={styles.unitSection}>
            <Text style={styles.label}>الوحدة</Text>
            <View style={styles.chipsRow}>
              {units.map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[styles.chip, unit === u && styles.chipSelected]}
                  onPress={() => setUnit(u)}
                >
                  <Text style={[styles.chipText, unit === u && styles.chipTextSelected]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Input label="الكمية" value={quantity} onChangeText={setQuantity} keyboardType="numeric" placeholder="0" />
          </View>
        </View>

        {/* Sale Type */}
        <Text style={styles.label}>نوع البيع</Text>
        <View style={styles.chipsRow}>
          {saleTypes.map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.chip, saleType === st && styles.chipSelected]}
              onPress={() => setSaleType(st)}
            >
              <Text style={[styles.chipText, saleType === st && styles.chipTextSelected]}>{st}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Prices */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Input label="سعر الجملة (₪)" value={wholesalePrice} onChangeText={setWholesalePrice} keyboardType="numeric" placeholder="0" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="سعر المفرق (₪)" value={retailPrice} onChangeText={setRetailPrice} keyboardType="numeric" placeholder="0" />
          </View>
        </View>

        {/* Discount */}
        <Input label="نسبة الخصم (%)" value={discountPercent} onChangeText={setDiscountPercent} keyboardType="numeric" placeholder="0" />

        {/* Organic Toggle */}
        <TouchableOpacity style={styles.toggleRow} onPress={() => setIsOrganic(!isOrganic)}>
          <View style={[styles.toggleSwitch, isOrganic && styles.toggleSwitchOn]}>
            <View style={[styles.toggleThumb, isOrganic && styles.toggleThumbOn]} />
          </View>
          <Text style={styles.toggleLabel}>منتج عضوي</Text>
        </TouchableOpacity>

        {/* Description */}
        <Input label="الوصف (اختياري)" value={description} onChangeText={setDescription} placeholder="وصف المنتج..." multiline />

        <Button
          title={isEditing ? 'حفظ التعديلات' : 'نشر المنتج'}
          onPress={handleSubmit}
          fullWidth
          size="lg"
          disabled={!name}
          loading={saving}
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
    textAlign: 'right', writingDirection: 'rtl', marginBottom: spacing.xs,
  },
  imagePicker: {
    width: '100%', height: 180, borderRadius: radius.xl,
    borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed',
    backgroundColor: colors.surfaceDim, overflow: 'hidden', marginBottom: spacing.md,
  },
  imagePreview: { width: '100%', height: '100%' },
  imagePlaceholder: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  imageText: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: colors.textMuted, marginTop: 4 },
  row: { flexDirection: 'row-reverse', gap: spacing.sm },
  unitSection: { flex: 1 },
  chipsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.primary },
  chipText: { fontFamily: 'Cairo_600SemiBold', fontSize: 12, color: colors.primary },
  chipTextSelected: { color: '#FFFFFF' },
  toggleRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  toggleLabel: { fontFamily: 'Cairo_400Regular', fontSize: 15, color: colors.textPrimary },
  toggleSwitch: {
    width: 50, height: 28, borderRadius: 14,
    backgroundColor: colors.border, justifyContent: 'center', paddingHorizontal: 2,
  },
  toggleSwitchOn: { backgroundColor: colors.primary },
  toggleThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFFFFF' },
  toggleThumbOn: { alignSelf: 'flex-end' },
  voiceCard: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#E8F5E1', borderRadius: radius.xl,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  voiceCardText: { flex: 1, marginEnd: spacing.md },
  voiceCardTitle: {
    fontFamily: 'Cairo_700Bold', fontSize: 15, color: colors.textPrimary,
    textAlign: 'right', writingDirection: 'rtl',
  },
  voiceCardSubtitle: {
    fontFamily: 'Cairo_400Regular', fontSize: 12, color: colors.textMuted,
    textAlign: 'right', writingDirection: 'rtl', marginTop: 2,
  },
  voiceMic: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  voiceMicActive: { backgroundColor: '#E63946' },
});
