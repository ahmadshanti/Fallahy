import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, Image as RNImage, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Button from '../../components/ui/Button';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { useAuthStore } from '../../store/authStore';
import { updateFarmerProfile } from '../../lib/farmers';
import { getProductsByFarmer } from '../../lib/products';
import { getOrdersByFarmer } from '../../lib/orders';
import { supabase } from '../../lib/supabase';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const menuItems: { label: string; icon: IoniconsName; route?: string }[] = [
  { label: 'معلومات المزرعة', icon: 'home-outline' },
  { label: 'منتجاتي', icon: 'cube-outline', route: '/(farmer)/products' },
  { label: 'أشجاري', icon: 'leaf-outline', route: '/(farmer)/trees' },
  { label: 'طلبات القطف', icon: 'hand-left-outline', route: '/(farmer)/pick-requests' },
  { label: 'المساعدة', icon: 'help-circle-outline' },
];

export default function FarmerProfileScreen() {
  const router = useRouter();
  const { farmer, user, logout, updateUser } = useAuthStore();
  const farmerId = useAuthStore((s) => s.farmerId);

  const [isEditing, setIsEditing] = useState(false);
  const [editOwnerName, setEditOwnerName] = useState(farmer?.owner_name || '');
  const [editFarmName, setEditFarmName] = useState(farmer?.farm_name || '');
  const [editCity, setEditCity] = useState(farmer?.city || '');
  const [editAbout, setEditAbout] = useState(farmer?.about || '');
  const [editWhatsapp, setEditWhatsapp] = useState(farmer?.whatsapp_number || '');
  const [newAvatar, setNewAvatar] = useState<string | null>(null);
  const [farmImages, setFarmImages] = useState<string[]>(farmer?.farm_images || []);
  const [isSaving, setIsSaving] = useState(false);

  // Stats
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    if (farmerId) loadStats();
  }, [farmerId]);

  const loadStats = async () => {
    if (!farmerId) return;
    try {
      const [products, orders] = await Promise.all([
        getProductsByFarmer(farmerId),
        getOrdersByFarmer(farmerId),
      ]);
      setTotalProducts(products.length);
      setTotalOrders(orders.length);
      const revenue = orders
        .filter((o: any) => o.status === 'delivered')
        .reduce((sum: number, o: any) => sum + (o.total_price || 0), 0);
      setTotalRevenue(revenue);
    } catch (err) {
      console.log('Stats error:', err);
    }
  };

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

  const pickFarmImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('تنبيه', 'يرجى السماح بالوصول للصور');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const newUris = result.assets.map((a) => a.uri);
      setFarmImages((prev) => [...prev, ...newUris]);
    }
  };

  const uploadImage = async (uri: string, bucket: string, folder: string): Promise<string | null> => {
    if (uri.startsWith('http')) return uri;
    try {
      const fileExt = uri.split('.').pop()?.split('?')[0] || 'jpg';
      const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substr(2, 5)}.${fileExt}`;
      const formData = new FormData();
      formData.append('file', { uri, name: `image.${fileExt}`, type: `image/${fileExt}` } as any);
      const { error } = await supabase.storage.from(bucket).upload(fileName, formData, { upsert: true });
      if (!error) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
        return data.publicUrl;
      }
    } catch (e) {
      console.log('Upload error:', e);
    }
    return null;
  };

  const handleSave = async () => {
    if (!farmerId) return;
    setIsSaving(true);
    try {
      let avatarUrl = farmer?.owner_avatar_url;
      if (newAvatar) {
        const uploaded = await uploadImage(newAvatar, 'avatars', farmerId);
        if (uploaded) avatarUrl = uploaded;
      }

      // Upload new farm images
      const uploadedFarmImages: string[] = [];
      for (const img of farmImages) {
        if (img.startsWith('http')) {
          uploadedFarmImages.push(img);
        } else {
          const uploaded = await uploadImage(img, 'farmer-images', farmerId);
          if (uploaded) uploadedFarmImages.push(uploaded);
        }
      }

      await updateFarmerProfile(farmerId, {
        owner_name: editOwnerName,
        farm_name: editFarmName,
        city: editCity,
        about: editAbout,
        whatsapp_number: editWhatsapp,
        owner_avatar_url: avatarUrl,
        farm_images: uploadedFarmImages.length > 0 ? uploadedFarmImages : null,
      });

      updateUser({
        full_name: editOwnerName,
        phone: editWhatsapp,
      });

      setNewAvatar(null);
      setIsEditing(false);
      Alert.alert('', 'تم تحديث الملف الشخصي');
    } catch (err: any) {
      Alert.alert('خطأ', err?.message || 'فشل في حفظ التعديلات');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMenuPress = (item: typeof menuItems[0]) => {
    if (item.route) {
      router.push(item.route as any);
    } else if (item.label === 'معلومات المزرعة') {
      setIsEditing(true);
    } else if (item.label === 'المساعدة') {
      Alert.alert('المساعدة', 'للتواصل مع الدعم:\nsupport@fallahy.app');
    }
  };

  const displayAvatar = newAvatar || farmer?.owner_avatar_url || '';

  // Edit Mode
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
          <TouchableOpacity style={styles.editAvatarContainer} onPress={pickAvatar}>
            {displayAvatar ? (
              <RNImage source={{ uri: displayAvatar }} style={styles.editAvatarImage} />
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
            <Text style={styles.editLabel}>اسم المالك</Text>
            <TextInput style={styles.editInput} value={editOwnerName} onChangeText={setEditOwnerName} textAlign="right" placeholder="اسم المالك" placeholderTextColor={colors.textMuted} />
          </View>

          <View style={styles.editField}>
            <Text style={styles.editLabel}>اسم المزرعة</Text>
            <TextInput style={styles.editInput} value={editFarmName} onChangeText={setEditFarmName} textAlign="right" placeholder="اسم المزرعة" placeholderTextColor={colors.textMuted} />
          </View>

          <View style={styles.editField}>
            <Text style={styles.editLabel}>المدينة</Text>
            <TextInput style={styles.editInput} value={editCity} onChangeText={setEditCity} textAlign="right" placeholder="المدينة" placeholderTextColor={colors.textMuted} />
          </View>

          <View style={styles.editField}>
            <Text style={styles.editLabel}>رقم الواتساب</Text>
            <TextInput style={styles.editInput} value={editWhatsapp} onChangeText={setEditWhatsapp} textAlign="right" placeholder="رقم الواتساب" keyboardType="phone-pad" placeholderTextColor={colors.textMuted} />
          </View>

          <View style={styles.editField}>
            <Text style={styles.editLabel}>نبذة عن المزرعة</Text>
            <TextInput
              style={[styles.editInput, { height: 80, textAlignVertical: 'top', paddingTop: spacing.sm }]}
              value={editAbout}
              onChangeText={setEditAbout}
              textAlign="right"
              placeholder="تحدث عن مزرعتك..."
              placeholderTextColor={colors.textMuted}
              multiline
            />
          </View>

          {/* Farm Images */}
          <Text style={styles.editLabel}>صور المزرعة</Text>
          <View style={styles.farmImagesRow}>
            {farmImages.map((img, index) => (
              <View key={index} style={styles.farmImageContainer}>
                <RNImage source={{ uri: img }} style={styles.farmImageThumb} />
                <TouchableOpacity
                  style={styles.removeFarmImage}
                  onPress={() => setFarmImages((prev) => prev.filter((_, i) => i !== index))}
                >
                  <Ionicons name="close-circle" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addFarmImage} onPress={pickFarmImage}>
              <Ionicons name="add" size={28} color={colors.textMuted} />
            </TouchableOpacity>
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
              {displayAvatar ? (
                <RNImage source={{ uri: displayAvatar }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={36} color={colors.primary} />
                </View>
              )}
              <View style={styles.avatarEditBadge}>
                <Ionicons name="pencil" size={12} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>

          <Text style={styles.farmName}>{farmer?.farm_name || farmer?.owner_name || ''}</Text>
          {farmer?.city && <Text style={styles.farmCity}>{farmer.city}</Text>}
          {farmer?.whatsapp_number && (
            <View style={styles.phoneRow}>
              <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
              <Text style={styles.phoneText}>{farmer.whatsapp_number}</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalProducts}</Text>
            <Text style={styles.statLabel}>منتج</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalOrders}</Text>
            <Text style={styles.statLabel}>طلب</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalRevenue} ₪</Text>
            <Text style={styles.statLabel}>الإيرادات</Text>
          </View>
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity style={styles.editProfileBtn} onPress={() => setIsEditing(true)}>
          <Ionicons name="create-outline" size={18} color={colors.primary} />
          <Text style={styles.editProfileText}>تعديل الملف الشخصي</Text>
        </TouchableOpacity>

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
  editAvatarContainer: { alignSelf: 'center', marginBottom: spacing.lg, position: 'relative' },
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
  farmImagesRow: {
    flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  farmImageContainer: { position: 'relative' },
  farmImageThumb: { width: 80, height: 80, borderRadius: radius.md },
  removeFarmImage: { position: 'absolute', top: -6, left: -6 },
  addFarmImage: {
    width: 80, height: 80, borderRadius: radius.md,
    borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceDim,
  },

  // Profile View
  profileCard: {
    alignItems: 'center', paddingVertical: spacing.lg,
    marginHorizontal: spacing.md, marginTop: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radius.xl,
  },
  avatarWrapper: { position: 'relative', marginBottom: spacing.sm },
  avatarImage: { width: 90, height: 90, borderRadius: 45 },
  avatarPlaceholder: {
    backgroundColor: '#E8F5E1', alignItems: 'center', justifyContent: 'center',
  },
  avatarEditBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.surface,
  },
  farmName: { fontFamily: 'Cairo_700Bold', fontSize: 22, color: colors.textPrimary },
  farmCity: { fontFamily: 'Cairo_400Regular', fontSize: 14, color: colors.textMuted, marginTop: 2 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  phoneText: { fontFamily: 'Cairo_400Regular', fontSize: 13, color: colors.textMuted },

  // Stats
  statsRow: {
    flexDirection: 'row', marginHorizontal: spacing.md, marginTop: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.md,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: 'Cairo_700Bold', fontSize: 18, color: colors.textPrimary },
  statLabel: { fontFamily: 'Cairo_400Regular', fontSize: 12, color: colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: colors.border, alignSelf: 'center' },

  // Edit Profile Button
  editProfileBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, marginHorizontal: spacing.md, marginTop: spacing.md,
    paddingVertical: 12, borderRadius: radius.xl,
    borderWidth: 1.5, borderColor: colors.primary,
  },
  editProfileText: { fontFamily: 'Cairo_600SemiBold', fontSize: 15, color: colors.primary },

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
