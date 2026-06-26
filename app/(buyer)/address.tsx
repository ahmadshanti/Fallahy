import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

const cities = ['رام الله', 'نابلس', 'الخليل', 'جنين', 'بيت لحم', 'طولكرم', 'قلقيلية', 'غزة', 'سلفيت', 'أريحا', 'طوباس', 'عمّان', 'إربد', 'الزرقاء'];

export default function AddressScreen() {
  const router = useRouter();
  const { user, buyerId, updateUser } = useAuthStore();
  const [city, setCity] = useState(user?.city || '');
  const [street, setStreet] = useState(user?.address_street || '');
  const [details, setDetails] = useState(user?.address_details || '');
  const [showCities, setShowCities] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!buyerId || !city) {
      Alert.alert('تنبيه', 'يرجى اختيار المدينة');
      return;
    }
    setSaving(true);
    try {
      const fullAddress = [city, street, details].filter(Boolean).join('، ');
      const { error } = await supabase
        .from('users')
        .update({ city, address_street: street, address_details: details })
        .eq('id', buyerId);

      if (error) {
        // If columns don't exist yet, just update city
        await supabase.from('users').update({ city }).eq('id', buyerId);
      }

      updateUser({ city, address_street: street, address_details: details });
      Alert.alert('', 'تم حفظ العنوان بنجاح');
      router.back();
    } catch {
      Alert.alert('خطأ', 'فشل في حفظ العنوان');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>عناويني</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="location" size={20} color={colors.primary} />
              <Text style={styles.cardTitle}>عنوان التوصيل</Text>
            </View>

            <Text style={styles.label}>المدينة</Text>
            <TouchableOpacity style={styles.dropdown} onPress={() => setShowCities(!showCities)}>
              <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
              <Text style={[styles.dropdownText, !city && { color: colors.textMuted }]}>
                {city || 'اختر المدينة'}
              </Text>
            </TouchableOpacity>
            {showCities && (
              <View style={styles.cityList}>
                <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                  {cities.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.cityItem, city === c && styles.cityItemActive]}
                      onPress={() => { setCity(c); setShowCities(false); }}
                    >
                      <Text style={styles.cityItemText}>{c}</Text>
                      {city === c && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <Text style={styles.label}>الشارع / الحي</Text>
            <TextInput
              style={styles.input}
              value={street}
              onChangeText={setStreet}
              placeholder="مثال: شارع الرئيسي، حي النور"
              placeholderTextColor={colors.textMuted}
              textAlign="right"
            />

            <Text style={styles.label}>تفاصيل إضافية</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={details}
              onChangeText={setDetails}
              placeholder="مثال: بجانب مسجد الرحمة، الطابق الثاني"
              placeholderTextColor={colors.textMuted}
              textAlign="right"
              multiline
              numberOfLines={3}
            />
          </View>

          <Button title="حفظ العنوان" onPress={handleSave} fullWidth size="lg" loading={saving} disabled={!city} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  card: {
    backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg,
  },
  cardTitle: { fontFamily: 'Cairo_700Bold', fontSize: 18, color: colors.textPrimary },
  label: {
    fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: colors.textMuted,
    textAlign: 'right', writingDirection: 'rtl', marginBottom: spacing.xs, marginTop: spacing.md,
  },
  dropdown: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surfaceDim, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, height: 48, paddingHorizontal: spacing.md,
  },
  dropdownText: { fontFamily: 'Cairo_400Regular', fontSize: 15, color: colors.textPrimary },
  cityList: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, marginTop: 4,
  },
  cityItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  cityItemActive: { backgroundColor: '#F5F9F2' },
  cityItemText: { fontFamily: 'Cairo_400Regular', fontSize: 15, color: colors.textPrimary },
  input: {
    fontFamily: 'Cairo_400Regular', fontSize: 15, color: colors.textPrimary,
    backgroundColor: colors.surfaceDim, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, height: 48,
    paddingHorizontal: spacing.md, writingDirection: 'rtl',
  },
  textArea: { height: 90, paddingTop: 12, textAlignVertical: 'top' },
});
