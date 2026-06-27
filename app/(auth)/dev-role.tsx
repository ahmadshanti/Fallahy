import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { useAuthStore } from '../../store/authStore';
import { devBuyerUser, devFarmerUser } from '../../lib/devMode';

export default function DevRoleScreen() {
  const router = useRouter();
  const loginAsBuyer = useAuthStore((s) => s.loginAsBuyer);
  const loginAsFarmer = useAuthStore((s) => s.loginAsFarmer);

  const enter = (role: 'buyer' | 'farmer') => {
    if (role === 'buyer') {
      loginAsBuyer(devBuyerUser);
      router.replace('/(buyer)');
    } else {
      loginAsFarmer(devFarmerUser, { id: devFarmerUser.id, farm_name: devFarmerUser.name, owner_name: devFarmerUser.name, city: devFarmerUser.city });
      router.replace('/(farmer)');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="leaf" size={48} color={colors.primary} />
        </View>
        <Text style={styles.title}>الفلاحي — وضع التطوير</Text>
        <Text style={styles.subtitle}>اختر دوراً للدخول السريع بدون تسجيل</Text>

        <TouchableOpacity
          style={styles.option}
          onPress={() => enter('buyer')}
          accessibilityRole="button"
          accessibilityLabel="الدخول كمشتري"
        >
          <View style={[styles.optionIcon, { backgroundColor: '#E8F5E1' }]}>
            <Ionicons name="cart" size={28} color={colors.primary} />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>الدخول كمشتري</Text>
            <Text style={styles.optionSubtitle}>تصفّح المنتجات، اطلب من المزارعين</Text>
          </View>
          <Ionicons name="chevron-back" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() => enter('farmer')}
          accessibilityRole="button"
          accessibilityLabel="الدخول كمزارع"
        >
          <View style={[styles.optionIcon, { backgroundColor: '#FFF3D6' }]}>
            <Ionicons name="leaf" size={28} color={colors.secondary} />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>الدخول كمزارع</Text>
            <Text style={styles.optionSubtitle}>أضف منتجاتك، اعرض أرباحك</Text>
          </View>
          <Ionicons name="chevron-back" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <Text style={styles.footnote}>
          البيانات هنا تجريبية. أزل EXPO_PUBLIC_DEV_MODE من .env لتفعيل تسجيل الدخول الحقيقي.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: '#E8F5E1', alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: spacing.lg,
  },
  title: {
    fontFamily: 'Cairo_700Bold', fontSize: 24, color: colors.textPrimary,
    textAlign: 'center', marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: 'Cairo_400Regular', fontSize: 14, color: colors.textMuted,
    textAlign: 'center', marginBottom: spacing.xl,
  },
  option: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  optionIcon: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  optionText: { flex: 1 },
  optionTitle: {
    fontFamily: 'Cairo_700Bold', fontSize: 17, color: colors.textPrimary,
    textAlign: 'right',
  },
  optionSubtitle: {
    fontFamily: 'Cairo_400Regular', fontSize: 13, color: colors.textMuted,
    textAlign: 'right', marginTop: 2,
  },
  footnote: {
    fontFamily: 'Cairo_400Regular', fontSize: 12, color: colors.textMuted,
    textAlign: 'center', marginTop: spacing.lg,
  },
});
