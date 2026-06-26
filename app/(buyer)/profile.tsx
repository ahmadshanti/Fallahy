import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { useAuthStore } from '../../store/authStore';
import { useBuyerSavings } from '../../hooks/useSavings';
import { useBuyerOrders } from '../../hooks/useOrders';
import { supabase } from '../../lib/supabase';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { data: savings } = useBuyerSavings(user?.id || '');
  const { data: orders = [] } = useBuyerOrders(user?.id || '');

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editCity, setEditCity] = useState(user?.city || '');
  const [editAddress, setEditAddress] = useState(user?.address || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/splash');
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name: editName, city: editCity, address: editAddress })
        .eq('id', user.id);

      if (error) throw error;

      useAuthStore.getState().updateUser({ name: editName, city: editCity, address: editAddress });
      setIsEditing(false);
      Alert.alert('', 'تم تحديث الملف الشخصي بنجاح');
    } catch {
      Alert.alert('خطأ', 'فشل في تحديث الملف الشخصي. حاول مرة أخرى.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditName(user?.name || '');
    setEditCity(user?.city || '');
    setEditAddress(user?.address || '');
    setIsEditing(false);
  };

  const handleMenuPress = (label: string) => {
    switch (label) {
      case 'عناويني':
        Alert.alert(
          'عناويني',
          user?.address || 'لا يوجد عنوان محفوظ',
          [
            { text: 'تعديل', onPress: () => setIsEditing(true) },
            { text: 'إغلاق', style: 'cancel' },
          ]
        );
        break;
      case 'تنبيهات الأسعار':
        router.push('/(buyer)/alerts');
        break;
      case 'الإعدادات':
        Alert.alert(
          'الإعدادات',
          '',
          [
            { text: 'تعديل الملف الشخصي', onPress: () => setIsEditing(true) },
            { text: 'إغلاق', style: 'cancel' },
          ]
        );
        break;
      default:
        break;
    }
  };

  const totalSaved = savings?.totalSaved || 0;
  const totalOrders = savings?.totalOrders || 0;

  const menuItems = [
    { label: 'عناويني', icon: 'location-outline' as const },
    { label: 'تنبيهات الأسعار', icon: 'notifications-outline' as const },
    { label: 'الإعدادات', icon: 'settings-outline' as const },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity>
            <Avatar uri={user?.avatar || ''} size={80} />
          </TouchableOpacity>
          <Text style={styles.userName}>{user?.name || 'مستخدم'}</Text>
          {user?.city ? <Text style={styles.userCity}>{user.city}</Text> : null}
          <Badge label={savings?.rank || 'عضو جديد'} variant="verified" />
        </View>

        {/* Edit Profile Button / Edit Form */}
        {isEditing ? (
          <View style={styles.editCard}>
            <Text style={styles.editCardTitle}>تعديل الملف الشخصي</Text>
            <View style={styles.editField}>
              <Text style={styles.editLabel}>الاسم</Text>
              <TextInput
                style={styles.editInput}
                value={editName}
                onChangeText={setEditName}
                textAlign="right"
                placeholder="الاسم"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={styles.editField}>
              <Text style={styles.editLabel}>المدينة</Text>
              <TextInput
                style={styles.editInput}
                value={editCity}
                onChangeText={setEditCity}
                textAlign="right"
                placeholder="المدينة"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={styles.editField}>
              <Text style={styles.editLabel}>العنوان</Text>
              <TextInput
                style={styles.editInput}
                value={editAddress}
                onChangeText={setEditAddress}
                textAlign="right"
                placeholder="العنوان"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveProfile}
                disabled={isSaving}
              >
                <Text style={styles.saveBtnText}>{isSaving ? 'جاري الحفظ...' : 'حفظ'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelEdit}>
                <Text style={styles.cancelBtnText}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.editBtnContainer}>
            <TouchableOpacity style={styles.editProfileBtn} onPress={() => setIsEditing(true)}>
              <Text style={styles.editProfileBtnText}>تعديل الملف الشخصي</Text>
              <Ionicons name="create-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Savings / Encouragement Card */}
        {totalSaved > 0 ? (
          <View style={styles.savingsCard}>
            <Text style={styles.savingsLabel}>إجمالي ما وفّرته</Text>
            <Text style={styles.savingsAmount}>{totalSaved} ₪</Text>
          </View>
        ) : (
          <View style={styles.encouragementCard}>
            <Ionicons name="leaf-outline" size={28} color={colors.primary} />
            <Text style={styles.encouragementTitle}>ابدأ رحلتك</Text>
            <Text style={styles.encouragementText}>اطلب من مزارعين محليين وابدأ بتوفير المال</Text>
          </View>
        )}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{totalOrders}</Text>
            <Text style={styles.statLabel}>عدد الطلبات</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>المفضلة</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>التقييمات</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menu}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuItem}
              onPress={() => handleMenuPress(item.label)}
            >
              <Ionicons name="chevron-back" size={20} color={colors.textMuted} />
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name={item.icon} size={20} color={colors.textPrimary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>تسجيل الخروج</Text>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  userName: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 22,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  userCity: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: colors.textMuted,
  },
  editBtnContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  editProfileBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  editProfileBtnText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: colors.primary,
  },
  editCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  editCardTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'right',
    marginBottom: spacing.sm,
    writingDirection: 'rtl',
  },
  editField: {
    marginBottom: spacing.sm,
  },
  editLabel: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'right',
    marginBottom: spacing.xs,
    writingDirection: 'rtl',
  },
  editInput: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceDim,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    writingDirection: 'rtl',
  },
  editActions: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  saveBtnText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.surfaceDim,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 15,
    color: colors.textSecondary,
  },
  savingsCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  savingsLabel: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  savingsAmount: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 40,
    color: '#FFFFFF',
  },
  encouragementCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  encouragementTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 18,
    color: colors.primary,
    textAlign: 'center',
  },
  encouragementText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    marginHorizontal: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 20,
    color: colors.textPrimary,
  },
  statLabel: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
    alignSelf: 'center',
  },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    marginHorizontal: spacing.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuContent: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  menuLabel: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
  },
  logoutBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.error,
  },
  logoutBtnText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 15,
    color: colors.error,
  },
});
