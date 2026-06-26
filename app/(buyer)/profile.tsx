import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, Image as RNImage,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { useAuthStore } from '../../store/authStore';
import { useBuyerSavings } from '../../hooks/useSavings';
import { supabase } from '../../lib/supabase';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const menuItems: { label: string; icon: IoniconsName; route?: string }[] = [
  { label: 'عناويني', icon: 'location-outline' },
  { label: 'تنبيهات الأسعار', icon: 'notifications-outline', route: '/(buyer)/alerts' },
  { label: 'الإعدادات', icon: 'settings-outline' },
  { label: 'المساعدة', icon: 'help-circle-outline' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuthStore();
  const { data: savings } = useBuyerSavings(user?.id || '');

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editCity, setEditCity] = useState(user?.city || '');
  const [editAddress, setEditAddress] = useState(user?.address || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [newAvatar, setNewAvatar] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'خروج', style: 'destructive', onPress: () => { logout(); router.replace('/(auth)/splash'); } },
    ]);
  };

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('تنبيه', 'يرجى السماح بالوصول للصور');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setNewAvatar(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      let avatarUrl = user.avatar;

      if (newAvatar) {
        const fileExt = newAvatar.split('.').pop() || 'jpg';
        const fileName = `${user.id}/avatar.${fileExt}`;
        const response = await fetch(newAvatar);
        const blob = await response.blob();
        await supabase.storage.from('avatars').upload(fileName, blob, { contentType: `image/${fileExt}`, upsert: true });
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
        avatarUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ name: editName, city: editCity, address: editAddress, phone: editPhone, avatar_url: avatarUrl })
        .eq('id', user.id);

      if (error) throw error;

      updateUser({ name: editName, city: editCity, address: editAddress, phone: editPhone, avatar: avatarUrl });
      setNewAvatar(null);
      setIsEditing(false);
      Alert.alert('', 'تم تحديث الملف الشخصي');
    } catch {
      Alert.alert('خطأ', 'فشل في حفظ التعديلات');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMenuPress = (item: typeof menuItems[0]) => {
    if (item.route) {
      router.push(item.route as any);
    } else if (item.label === 'عناويني') {
      setIsEditing(true);
    } else if (item.label === 'الإعدادات') {
      setIsEditing(true);
    } else if (item.label === 'المساعدة') {
      router.push('/(buyer)/chat');
    }
  };

  const displayAvatar = newAvatar || user?.avatar || '';
  const totalSaved = savings?.totalSaved || 0;

  if (isEditing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.editHeader}>
          <TouchableOpacity onPress={() => { setIsEditing(false); setNewAvatar(null); }}>
            <Text style={styles.cancelText}>إلغاء</Text>
          </TouchableOpacity>
          <Text style={styles.editHeaderTitle}>تعديل الملف الشخصي</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView contentContainerStyle={styles.editScroll} showsVerticalScrollIndicator={false}>
          {/* Avatar Edit */}
          <TouchableOpacity style={styles.editAvatarContainer} onPress={pickAvatar}>
            {(newAvatar || displayAvatar) ? (
              <RNImage source={{ uri: newAvatar || displayAvatar }} style={styles.editAvatarImage} />
            ) : (
              <View style={styles.editAvatarPlaceholder}>
                <Ionicons name="person" size={40} color={colors.textMuted} />
              </View>
            )}
            <View style={styles.editAvatarBadge}>
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <View style={styles.editField}>
            <Text style={styles.editLabel}>الاسم</Text>
            <TextInput style={styles.editInput} value={editName} onChangeText={setEditName} textAlign="right" placeholder="الاسم" placeholderTextColor={colors.textMuted} />
          </View>

          <View style={styles.editField}>
            <Text style={styles.editLabel}>رقم الهاتف</Text>
            <TextInput style={styles.editInput} value={editPhone} onChangeText={setEditPhone} textAlign="right" placeholder="رقم الهاتف" keyboardType="phone-pad" placeholderTextColor={colors.textMuted} />
          </View>

          <View style={styles.editField}>
            <Text style={styles.editLabel}>المدينة</Text>
            <TextInput style={styles.editInput} value={editCity} onChangeText={setEditCity} textAlign="right" placeholder="المدينة" placeholderTextColor={colors.textMuted} />
          </View>

          <View style={styles.editField}>
            <Text style={styles.editLabel}>العنوان</Text>
            <TextInput style={styles.editInput} value={editAddress} onChangeText={setEditAddress} textAlign="right" placeholder="الحي / الشارع" placeholderTextColor={colors.textMuted} />
          </View>

          <Button title="حفظ التعديلات" onPress={handleSave} fullWidth size="lg" loading={isSaving} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity onPress={() => setIsEditing(true)}>
            <View style={styles.avatarWrapper}>
              <Avatar uri={displayAvatar} size={90} />
              <View style={styles.avatarEditBadge}>
                <Ionicons name="pencil" size={12} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>

          <Text style={styles.userName}>{user?.name || 'مستخدم'}</Text>
          {user?.city && <Text style={styles.userCity}>{user.city}</Text>}
          {user?.phone && (
            <View style={styles.phoneRow}>
              <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
              <Text style={styles.phoneText}>{user.phone}</Text>
            </View>
          )}
        </View>

        {/* Savings Card */}
        {totalSaved > 0 ? (
          <View style={styles.savingsCard}>
            <View style={styles.savingsRow}>
              <View>
                <Text style={styles.savingsLabel}>إجمالي التوفير</Text>
                <Text style={styles.savingsAmount}>{totalSaved} ₪</Text>
              </View>
              <View style={styles.savingsIcon}>
                <Ionicons name="trending-down" size={24} color={colors.primary} />
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.welcomeCard}>
            <Ionicons name="leaf-outline" size={32} color={colors.primary} />
            <Text style={styles.welcomeTitle}>ابدأ رحلتك</Text>
            <Text style={styles.welcomeSubtitle}>اطلب من مزارعين محليين ووفّر أموالك</Text>
            <Button title="تصفح المنتجات" onPress={() => router.push('/(buyer)/explore')} size="sm" style={{ marginTop: spacing.sm }} />
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{savings?.totalOrders || 0}</Text>
            <Text style={styles.statLabel}>طلبات</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{savings?.points || 0}</Text>
            <Text style={styles.statLabel}>نقاط</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{savings?.rank || 'عضو جديد'}</Text>
            <Text style={styles.statLabel}>الرتبة</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, index === menuItems.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => handleMenuPress(item)}
            >
              <Ionicons name="chevron-back" size={20} color={colors.textMuted} />
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <View style={styles.menuIconCircle}>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Edit Mode
  editHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  editHeaderTitle: { fontFamily: 'Cairo_700Bold', fontSize: 18, color: colors.textPrimary },
  cancelText: { fontFamily: 'Cairo_600SemiBold', fontSize: 15, color: colors.error },
  editScroll: { padding: spacing.lg },
  editAvatarContainer: {
    alignSelf: 'center', marginBottom: spacing.lg, position: 'relative',
  },
  editAvatarImage: { width: 100, height: 100, borderRadius: 50 },
  editAvatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#E8E3D8', alignItems: 'center', justifyContent: 'center',
  },
  editAvatarBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.background,
  },
  editField: { marginBottom: spacing.md },
  editLabel: {
    fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: colors.textMuted,
    textAlign: 'right', marginBottom: spacing.xs,
  },
  editInput: {
    fontFamily: 'Cairo_400Regular', fontSize: 16, color: colors.textPrimary,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, height: 50,
    paddingHorizontal: spacing.md, writingDirection: 'rtl',
  },

  // Profile View
  profileCard: {
    alignItems: 'center', paddingVertical: spacing.lg,
    marginHorizontal: spacing.md, marginTop: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radius.xl,
  },
  avatarWrapper: { position: 'relative', marginBottom: spacing.sm },
  avatarEditBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.surface,
  },
  userName: {
    fontFamily: 'Cairo_700Bold', fontSize: 22, color: colors.textPrimary,
  },
  userCity: {
    fontFamily: 'Cairo_400Regular', fontSize: 14, color: colors.textMuted, marginTop: 2,
  },
  phoneRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6,
  },
  phoneText: {
    fontFamily: 'Cairo_400Regular', fontSize: 13, color: colors.textMuted,
  },

  // Savings
  savingsCard: {
    marginHorizontal: spacing.md, marginTop: spacing.md,
    backgroundColor: colors.primary, borderRadius: radius.xl, padding: spacing.lg,
  },
  savingsRow: {
    flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center',
  },
  savingsIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  savingsLabel: { fontFamily: 'Cairo_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'right' },
  savingsAmount: { fontFamily: 'Cairo_700Bold', fontSize: 32, color: '#FFFFFF' },

  // Welcome
  welcomeCard: {
    marginHorizontal: spacing.md, marginTop: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg,
    alignItems: 'center',
  },
  welcomeTitle: { fontFamily: 'Cairo_700Bold', fontSize: 18, color: colors.textPrimary, marginTop: spacing.sm },
  welcomeSubtitle: { fontFamily: 'Cairo_400Regular', fontSize: 14, color: colors.textMuted, marginTop: 4 },

  // Stats
  statsRow: {
    flexDirection: 'row', marginHorizontal: spacing.md, marginTop: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.md,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: 'Cairo_700Bold', fontSize: 18, color: colors.textPrimary },
  statLabel: { fontFamily: 'Cairo_400Regular', fontSize: 12, color: colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: colors.border, alignSelf: 'center' },

  // Menu
  menuSection: {
    marginHorizontal: spacing.md, marginTop: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.xl, overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  menuContent: {
    flex: 1, flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm,
  },
  menuIconCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#E8F5E1', alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { fontFamily: 'Cairo_600SemiBold', fontSize: 15, color: colors.textPrimary },

  // Logout
  logoutBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, marginHorizontal: spacing.md, marginTop: spacing.lg,
    paddingVertical: 14, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.error,
  },
  logoutText: { fontFamily: 'Cairo_600SemiBold', fontSize: 15, color: colors.error },
});
