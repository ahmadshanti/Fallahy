import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, Image, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';

const countries = [
  { name: 'فلسطين', code: '+970', flag: '🇵🇸', cities: ['رام الله', 'نابلس', 'الخليل', 'جنين', 'بيت لحم', 'طولكرم', 'قلقيلية', 'غزة', 'خان يونس', 'سلفيت', 'أريحا', 'طوباس'] },
  { name: 'الأردن', code: '+962', flag: '🇯🇴', cities: ['عمّان', 'إربد', 'الزرقاء', 'العقبة', 'المفرق', 'جرش', 'عجلون', 'الكرك', 'مادبا', 'السلط'] },
];

export default function RegisterBuyerScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [step, setStep] = useState(1);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [showCountries, setShowCountries] = useState(false);
  const [showCities, setShowCities] = useState(false);
  const [loading, setLoading] = useState(false);

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
        aspect: [1, 1],
        quality: 0.8,
      };
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
      if (!result.canceled) {
        setAvatar(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('خطأ', 'فشل فتح الكاميرا أو المعرض');
    }
  };

  const showImageOptions = () => {
    Alert.alert('صورة الملف الشخصي', 'اختر طريقة إضافة الصورة', [
      { text: 'التقاط صورة', onPress: () => pickImage(true) },
      { text: 'اختيار من المعرض', onPress: () => pickImage(false) },
      { text: 'إلغاء', style: 'cancel' },
    ]);
  };

  const handleRegister = async () => {
    if (!name || !phone || !city) {
      Alert.alert('تنبيه', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    setLoading(true);
    try {
      const fullPhone = `${selectedCountry.code}${phone}`;
      const email = `${phone.replace(/\D/g, '')}_${Date.now()}@example.com`;

      const { data: signUpData, error: signUpError } = await supabase.auth.signInAnonymously();
      if (signUpError) {
        Alert.alert('خطأ', signUpError.message);
        setLoading(false);
        return;
      }

      const userId = signUpData.user?.id;
      if (!userId) {
        Alert.alert('خطأ', 'فشل إنشاء الحساب');
        setLoading(false);
        return;
      }

      let avatarUrl = null;
      if (avatar) {
        try {
          const fileExt = avatar.split('.').pop() || 'jpg';
          const fileName = `${userId}/avatar.${fileExt}`;
          const response = await fetch(avatar);
          const blob = await response.blob();
          await supabase.storage.from('avatars').upload(fileName, blob, { contentType: `image/${fileExt}`, upsert: true });
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
          avatarUrl = urlData.publicUrl;
        } catch (e) {
          // Avatar upload failed, continue without it
        }
      }

      const address = neighborhood ? `${city}، ${neighborhood}` : city;
      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        name,
        phone: fullPhone,
        city,
        address,
        role: 'buyer',
        avatar_url: avatarUrl,
      });

      if (error) {
        Alert.alert('خطأ', error.message);
        setLoading(false);
        return;
      }

      login(
        { id: userId, name, phone: fullPhone, role: 'buyer', city, address, avatar: avatarUrl || undefined },
        'buyer'
      );
      router.replace('/(buyer)');
    } catch (err: any) {
      Alert.alert('خطأ', err?.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return true; // photo is optional
    if (step === 2) return name.length > 0;
    if (step === 3) return phone.length >= 9;
    if (step === 4) return city.length > 0;
    return false;
  };

  const nextStep = () => {
    if (step < 4) setStep(step + 1);
    else handleRegister();
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()}>
              <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>إنشاء حساب</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Progress */}
          <View style={styles.progressRow}>
            {[1, 2, 3, 4].map((s) => (
              <View key={s} style={[styles.progressDot, s <= step && styles.progressDotActive]} />
            ))}
          </View>

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Step 1: Photo */}
            {step === 1 && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>صورتك الشخصية</Text>
                <Text style={styles.stepSubtitle}>اختياري — يمكنك إضافتها لاحقاً</Text>
                <TouchableOpacity style={styles.avatarPicker} onPress={showImageOptions}>
                  {avatar ? (
                    <Image source={{ uri: avatar }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="camera-outline" size={40} color={colors.textMuted} />
                      <Text style={styles.avatarText}>إضافة صورة</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Step 2: Name */}
            {step === 2 && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>ما اسمك؟</Text>
                <Text style={styles.stepSubtitle}>الاسم اللي بيظهر للمزارعين</Text>
                <View style={styles.fullWidth}>
                  <Input
                    value={name}
                    onChangeText={setName}
                    placeholder="أدخل اسمك الكامل"
                    autoFocus
                  />
                </View>
              </View>
            )}

            {/* Step 3: Phone */}
            {step === 3 && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>رقم الواتساب</Text>
                <Text style={styles.stepSubtitle}>عشان المزارع يقدر يتواصل معك</Text>
                <View style={[styles.phoneRow, styles.fullWidth]}>
                  <View style={styles.phoneInput}>
                    <Input
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="591234567"
                      keyboardType="phone-pad"
                      autoFocus
                    />
                  </View>
                  <TouchableOpacity style={styles.countryBtn} onPress={() => setShowCountries(!showCountries)}>
                    <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                    <Text style={styles.countryCode}>{selectedCountry.code}</Text>
                    <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
                {showCountries && (
                  <View style={styles.dropdownList}>
                    {countries.map((c) => (
                      <TouchableOpacity
                        key={c.code}
                        style={[styles.dropdownItem, selectedCountry.code === c.code && styles.dropdownItemActive]}
                        onPress={() => { setSelectedCountry(c); setShowCountries(false); setCity(''); }}
                      >
                        <Text style={styles.dropdownCode}>{c.code}</Text>
                        <Text style={styles.dropdownName}>{c.flag} {c.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Step 4: Location */}
            {step === 4 && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>وين ساكن؟</Text>
                <Text style={styles.stepSubtitle}>عشان نوصّلك المنتجات</Text>

                <Text style={styles.fieldLabel}>المدينة</Text>
                <TouchableOpacity style={styles.dropdown} onPress={() => setShowCities(!showCities)}>
                  <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                  <Text style={[styles.dropdownText, !city && styles.placeholder]}>
                    {city || 'اختر المدينة'}
                  </Text>
                </TouchableOpacity>
                {showCities && (
                  <View style={styles.dropdownList}>
                    <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                      {selectedCountry.cities.map((c) => (
                        <TouchableOpacity
                          key={c}
                          style={[styles.dropdownItem, city === c && styles.dropdownItemActive]}
                          onPress={() => { setCity(c); setShowCities(false); }}
                        >
                          <Text style={styles.dropdownName}>{c}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                <View style={{ height: spacing.md }} />
                <Text style={styles.fieldLabel}>الحي / الشارع (اختياري)</Text>
                <View style={styles.fullWidth}>
                  <Input
                    value={neighborhood}
                    onChangeText={setNeighborhood}
                    placeholder="مثال: حي الطيرة، شارع الرئيسي"
                  />
                </View>
              </View>
            )}
          </ScrollView>

          {/* Bottom Button */}
          <View style={styles.bottom}>
            <Button
              title={step === 4 ? 'إنشاء حسابي' : 'التالي'}
              onPress={nextStep}
              fullWidth
              size="lg"
              disabled={step > 1 && !canProceed()}
              loading={loading}
            />
            {step === 1 && (
              <TouchableOpacity onPress={() => setStep(2)} style={styles.skipBtn}>
                <Text style={styles.skipText}>تخطي</Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
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
  progressRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 8,
    paddingVertical: spacing.sm,
  },
  progressDot: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border,
  },
  progressDotActive: { backgroundColor: colors.primary },
  scroll: { flexGrow: 1, padding: spacing.lg },
  fullWidth: { width: '100%' },
  stepContainer: { alignItems: 'center', paddingTop: spacing.xl },
  stepTitle: {
    fontFamily: 'Cairo_700Bold', fontSize: 24, color: colors.textPrimary,
    textAlign: 'center', marginBottom: spacing.xs,
  },
  stepSubtitle: {
    fontFamily: 'Cairo_400Regular', fontSize: 15, color: colors.textMuted,
    textAlign: 'center', marginBottom: spacing.xl,
  },
  avatarPicker: {
    width: 140, height: 140, borderRadius: 70, overflow: 'hidden',
    backgroundColor: colors.surfaceDim, borderWidth: 2, borderColor: colors.border,
    borderStyle: 'dashed',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: colors.textMuted, marginTop: 4,
  },
  phoneRow: {
    flexDirection: 'row', gap: spacing.sm, width: '100%',
  },
  phoneInput: { flex: 1 },
  countryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.surfaceDim, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.sm, height: 48, marginBottom: spacing.md,
  },
  countryFlag: { fontSize: 20 },
  countryCode: { fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: colors.textPrimary },
  fieldLabel: {
    fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: colors.textPrimary,
    textAlign: 'right', writingDirection: 'rtl', alignSelf: 'flex-end',
    marginBottom: spacing.xs,
  },
  dropdown: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surfaceDim, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, height: 48,
    paddingHorizontal: spacing.md, width: '100%',
  },
  dropdownText: { fontFamily: 'Cairo_400Regular', fontSize: 15, color: colors.textPrimary },
  placeholder: { color: colors.textMuted },
  dropdownList: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, marginTop: 4, width: '100%',
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  dropdownItemActive: { backgroundColor: '#F5F9F2' },
  dropdownName: { fontFamily: 'Cairo_600SemiBold', fontSize: 15, color: colors.textPrimary },
  dropdownCode: { fontFamily: 'Cairo_400Regular', fontSize: 14, color: colors.textMuted },
  bottom: {
    paddingHorizontal: spacing.lg, paddingBottom: spacing.lg,
  },
  skipBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  skipText: { fontFamily: 'Cairo_600SemiBold', fontSize: 15, color: colors.textMuted },
});
