import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';

const cities = ['رام الله', 'نابلس', 'الخليل', 'جنين', 'بيت لحم', 'طولكرم', 'قلقيلية'];

export default function RegisterBuyerScreen() {
  const router = useRouter();
  const { user, login } = useAuthStore();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [purchaseType, setPurchaseType] = useState<'retail' | 'wholesale'>('retail');
  const [familyAccount, setFamilyAccount] = useState(false);
  const [showCities, setShowCities] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !city) return;
    setLoading(true);
    try {
      let userId = user?.id;

      // If no user ID, create anonymous account
      if (!userId || userId === 'dev-test-user') {
        const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
        if (anonError) {
          Alert.alert('خطأ', anonError.message);
          setLoading(false);
          return;
        }
        userId = anonData.user?.id;
        if (!userId) {
          Alert.alert('خطأ', 'فشل إنشاء الحساب');
          setLoading(false);
          return;
        }
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          name,
          city,
          address,
          role: 'buyer',
          phone: user?.phone || '',
        });

      if (error) {
        Alert.alert('خطأ', error.message);
        setLoading(false);
        return;
      }

      login(
        { id: userId, name, phone: user?.phone || '', role: 'buyer', city, address },
        'buyer'
      );
      router.replace('/(buyer)');
    } catch (err: any) {
      Alert.alert('خطأ', err?.message || 'حدث خطأ في التسجيل');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>تسجيل حساب مستهلك</Text>

        <Input label="الاسم الكامل" value={name} onChangeText={setName} placeholder="أدخل اسمك" />

        <View style={styles.fieldWrapper}>
          <Text style={styles.label}>المدينة</Text>
          <TouchableOpacity style={styles.dropdown} onPress={() => setShowCities(!showCities)}>
            <Text style={[styles.dropdownText, !city && styles.placeholder]}>
              {city || 'اختر المدينة'}
            </Text>
            <Text style={styles.chevron}>▼</Text>
          </TouchableOpacity>
          {showCities && (
            <View style={styles.cityList}>
              {cities.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={styles.cityItem}
                  onPress={() => { setCity(c); setShowCities(false); }}
                >
                  <Text style={styles.cityText}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <Input label="العنوان" value={address} onChangeText={setAddress} placeholder="أدخل عنوانك" />

        <View style={styles.fieldWrapper}>
          <Text style={styles.label}>نوع الشراء</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, purchaseType === 'retail' && styles.toggleActive]}
              onPress={() => setPurchaseType('retail')}
            >
              <Text style={[styles.toggleText, purchaseType === 'retail' && styles.toggleTextActive]}>مفرق</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, purchaseType === 'wholesale' && styles.toggleActive]}
              onPress={() => setPurchaseType('wholesale')}
            >
              <Text style={[styles.toggleText, purchaseType === 'wholesale' && styles.toggleTextActive]}>جملة</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.switchRow}>
          <TouchableOpacity
            style={[styles.switch, familyAccount && styles.switchOn]}
            onPress={() => setFamilyAccount(!familyAccount)}
          >
            <View style={[styles.switchThumb, familyAccount && styles.switchThumbOn]} />
          </TouchableOpacity>
          <Text style={styles.switchLabel}>ربط حساب عائلي</Text>
        </View>

        <Button
          title="إنشاء حسابي"
          onPress={handleRegister}
          fullWidth
          size="lg"
          disabled={!name || !city}
          loading={loading}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: 40 },
  title: {
    fontFamily: 'Cairo_700Bold', fontSize: 24, color: colors.textPrimary,
    textAlign: 'center', marginBottom: spacing.xl, writingDirection: 'rtl',
  },
  fieldWrapper: { marginBottom: spacing.md },
  label: {
    fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: colors.textPrimary,
    marginBottom: spacing.xs, textAlign: 'right', writingDirection: 'rtl',
  },
  dropdown: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surfaceDim, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, height: 48, paddingHorizontal: spacing.md,
  },
  dropdownText: { fontFamily: 'Cairo_400Regular', fontSize: 15, color: colors.textPrimary },
  placeholder: { color: colors.textMuted },
  chevron: { fontSize: 12, color: colors.textMuted },
  cityList: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, marginTop: 4,
  },
  cityItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  cityText: { fontFamily: 'Cairo_400Regular', fontSize: 15, color: colors.textPrimary, textAlign: 'right' },
  toggleRow: { flexDirection: 'row', gap: spacing.sm },
  toggleBtn: {
    flex: 1, height: 44, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  toggleActive: { backgroundColor: colors.primary },
  toggleText: { fontFamily: 'Cairo_600SemiBold', fontSize: 15, color: colors.primary },
  toggleTextActive: { color: '#FFFFFF' },
  switchRow: {
    flexDirection: 'row-reverse', alignItems: 'center', marginBottom: spacing.lg, gap: spacing.sm,
  },
  switchLabel: { fontFamily: 'Cairo_400Regular', fontSize: 15, color: colors.textPrimary },
  switch: {
    width: 50, height: 28, borderRadius: 14,
    backgroundColor: colors.border, justifyContent: 'center', paddingHorizontal: 2,
  },
  switchOn: { backgroundColor: colors.primary },
  switchThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFFFFF' },
  switchThumbOn: { alignSelf: 'flex-end' },
});
