import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

const cities = ['رام الله', 'نابلس', 'الخليل', 'جنين', 'بيت لحم', 'طولكرم', 'قلقيلية', 'غزة', 'سلفيت', 'أريحا', 'طوباس', 'عمّان', 'إربد', 'الزرقاء'];

export default function SettingsScreen() {
  const router = useRouter();
  const { user, buyerId, updateUser } = useAuthStore();
  const [city, setCity] = useState(user?.city || '');
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || user?.phone || '');
  const [notifications, setNotifications] = useState(true);
  const [showCities, setShowCities] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!buyerId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ city, phone: whatsapp })
        .eq('id', buyerId);
      if (error) throw error;
      updateUser({ city, phone: whatsapp });
      Alert.alert('', 'تم حفظ الإعدادات');
      router.back();
    } catch {
      Alert.alert('خطأ', 'فشل في حفظ الإعدادات');
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
        <Text style={styles.headerTitle}>الإعدادات</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* City */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>المدينة</Text>
          </View>
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
        </View>

        {/* WhatsApp */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            <Text style={styles.sectionTitle}>رقم الواتساب</Text>
          </View>
          <TextInput
            style={styles.input}
            value={whatsapp}
            onChangeText={setWhatsapp}
            placeholder="مثال: +970591234567"
            placeholderTextColor={colors.textMuted}
            textAlign="right"
            keyboardType="phone-pad"
          />
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <View style={styles.notifRow}>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={notifications ? colors.primary : '#f4f3f4'}
            />
            <View style={styles.notifContent}>
              <Text style={styles.notifTitle}>الإشعارات</Text>
              <Text style={styles.notifDesc}>استلم إشعارات عن حالة الطلبات والعروض</Text>
            </View>
            <Ionicons name="notifications-outline" size={20} color={colors.primary} />
          </View>
        </View>

        <Button title="حفظ الإعدادات" onPress={handleSave} fullWidth size="lg" loading={saving} />
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
  section: {
    backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md,
  },
  sectionTitle: { fontFamily: 'Cairo_700Bold', fontSize: 16, color: colors.textPrimary },
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
  notifRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
  },
  notifContent: { flex: 1 },
  notifTitle: {
    fontFamily: 'Cairo_600SemiBold', fontSize: 15, color: colors.textPrimary,
    textAlign: 'right', writingDirection: 'rtl',
  },
  notifDesc: {
    fontFamily: 'Cairo_400Regular', fontSize: 12, color: colors.textMuted,
    textAlign: 'right', writingDirection: 'rtl',
  },
});
