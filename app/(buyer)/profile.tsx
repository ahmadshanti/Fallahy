import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { isDevMode } from '../../lib/devMode';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, buyerId, logout, updateUser } = useAuthStore();

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState(user?.city || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!buyerId) return;
    if (!fullName.trim()) {
      Alert.alert('خطأ', 'الاسم مطلوب');
      return;
    }
    try {
      setSaving(true);
      const updates: Record<string, any> = {
        full_name: fullName.trim(),
        phone: phone.trim(),
        city: city.trim(),
      };
      if (!isDevMode) {
        const { error } = await supabase
          .from('users')
          .update(updates)
          .eq('id', buyerId);
        if (error) throw error;
      }
      updateUser(updates);
      setEditing(false);
      Alert.alert('تم الحفظ', 'تم تحديث الملف الشخصي');
    } catch (err: any) {
      console.error('Profile save error:', err);
      Alert.alert('خطأ', err?.message || 'تعذر حفظ التعديلات');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد من تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'تسجيل الخروج',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/splash');
        },
      },
    ]);
  };

  const menuItems = [
    {
      icon: 'bag-outline' as const,
      label: 'طلباتي',
      onPress: () => router.push('/(buyer)/orders'),
    },
    {
      icon: 'location-outline' as const,
      label: 'عناويني',
      onPress: () => router.push('/(buyer)/address'),
    },
    {
      icon: 'settings-outline' as const,
      label: 'الإعدادات',
      onPress: () => router.push('/(buyer)/settings'),
    },
    {
      icon: 'help-circle-outline' as const,
      label: 'المساعدة',
      onPress: () => router.push('/(buyer)/chat'),
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>حسابي</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Avatar + Info Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.placeholderAvatar]}>
                <Ionicons name="person" size={40} color={colors.textMuted} />
              </View>
            )}
          </View>

          {editing ? (
            <View style={styles.editForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>الاسم الكامل</Text>
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="الاسم الكامل"
                  placeholderTextColor={colors.textMuted}
                  textAlign="right"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>رقم الهاتف</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="رقم الهاتف"
                  placeholderTextColor={colors.textMuted}
                  textAlign="right"
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>المدينة</Text>
                <TextInput
                  style={styles.input}
                  value={city}
                  onChangeText={setCity}
                  placeholder="المدينة"
                  placeholderTextColor={colors.textMuted}
                  textAlign="right"
                />
              </View>
              <View style={styles.editButtons}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setEditing(false);
                    setFullName(user?.full_name || '');
                    setPhone(user?.phone || '');
                    setCity(user?.city || '');
                  }}
                >
                  <Text style={styles.cancelBtnText}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveBtnText}>حفظ</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.full_name || 'مستخدم'}</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoText}>{user?.phone || 'لا يوجد رقم'}</Text>
                <Ionicons name="call-outline" size={16} color={colors.textMuted} />
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoText}>{user?.city || 'لم تحدد'}</Text>
                <Ionicons name="location-outline" size={16} color={colors.textMuted} />
              </View>
              <TouchableOpacity
                style={styles.editProfileBtn}
                onPress={() => setEditing(true)}
              >
                <Ionicons name="create-outline" size={16} color={colors.primary} />
                <Text style={styles.editProfileText}>تعديل الملف الشخصي</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.menuItem,
                index < menuItems.length - 1 && styles.menuItemBorder,
              ]}
              onPress={item.onPress}
            >
              <Ionicons name="chevron-back" size={20} color={colors.textMuted} />
              <View style={styles.menuItemRight}>
                <Text style={styles.menuItemLabel}>{item.label}</Text>
                <View style={styles.menuIconWrapper}>
                  <Ionicons name={item.icon} size={20} color={colors.primary} />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  avatarWrapper: {
    marginBottom: 16,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  placeholderAvatar: {
    backgroundColor: colors.surfaceDim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    width: '100%',
    alignItems: 'center',
    gap: 6,
  },
  profileName: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 20,
    color: colors.textPrimary,
    writingDirection: 'rtl',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
    writingDirection: 'rtl',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  editProfileText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: colors.primary,
  },
  editForm: {
    width: '100%',
    gap: 12,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  input: {
    backgroundColor: colors.surfaceDim,
    borderRadius: 10,
    padding: 12,
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: colors.textPrimary,
    writingDirection: 'rtl',
    borderWidth: 1,
    borderColor: colors.border,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: colors.textSecondary,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: '#fff',
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemLabel: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.error + '10',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  logoutText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 15,
    color: colors.error,
  },
});
