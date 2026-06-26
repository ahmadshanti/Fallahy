import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { mockSavings } from '../../constants/mockData';
import { useAuthStore } from '../../store/authStore';

const menuItems = [
  { label: 'عناويني', icon: 'location-outline' as const },
  { label: 'تنبيهات الأسعار', icon: 'notifications-outline' as const },
  { label: 'حساب العائلة', icon: 'people-outline' as const },
  { label: 'اللغة', icon: 'globe-outline' as const },
  { label: 'الإعدادات', icon: 'settings-outline' as const },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/splash');
  };

  const progressPercent = (mockSavings.points / (mockSavings.points + mockSavings.pointsToNext)) * 100;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Avatar uri="https://i.pravatar.cc/100?img=33" size={80} />
          <Text style={styles.userName}>{user?.name || 'أحمد محمد'}</Text>
          <Badge label={`${mockSavings.rank}`} variant="verified" />
        </View>

        {/* Rank Progress */}
        <View style={styles.rankCard}>
          <View style={styles.rankRow}>
            <Text style={styles.rankNext}>{mockSavings.nextRank}</Text>
            <Text style={styles.rankCurrent}>{mockSavings.points}/{mockSavings.points + mockSavings.pointsToNext} نقطة</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>

        {/* Savings Card */}
        <View style={styles.savingsCard}>
          <Text style={styles.savingsLabel}>إجمالي ما وفّرته</Text>
          <Text style={styles.savingsAmount}>{mockSavings.totalSaved} ₪</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{mockSavings.totalOrders}</Text>
            <Text style={styles.statLabel}>عدد الطلبات</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>8</Text>
            <Text style={styles.statLabel}>المفضلة</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>التقييمات</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menu}>
          {menuItems.map((item) => (
            <TouchableOpacity key={item.label} style={styles.menuItem}>
              <Ionicons name="chevron-back" size={20} color={colors.textMuted} />
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name={item.icon} size={20} color={colors.textPrimary} />
              </View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Ionicons name="chevron-back" size={20} color={colors.textMuted} />
            <View style={styles.menuContent}>
              <Text style={[styles.menuLabel, styles.logoutText]}>تسجيل الخروج</Text>
              <Ionicons name="log-out-outline" size={20} color={colors.error} />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  profileHeader: {
    alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.sm,
  },
  userName: {
    fontFamily: 'Cairo_700Bold', fontSize: 22, color: colors.textPrimary,
  },
  rankCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.md,
    marginHorizontal: spacing.md, marginBottom: spacing.md,
  },
  rankRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm,
  },
  rankCurrent: { fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: colors.textSecondary },
  rankNext: { fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: colors.primary },
  progressBar: {
    height: 8, backgroundColor: colors.surfaceDim, borderRadius: 4, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: colors.primary, borderRadius: 4,
  },
  savingsCard: {
    backgroundColor: colors.primary, borderRadius: radius.xl, padding: spacing.lg,
    marginHorizontal: spacing.md, alignItems: 'center', marginBottom: spacing.md,
  },
  savingsLabel: { fontFamily: 'Cairo_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  savingsAmount: { fontFamily: 'Cairo_700Bold', fontSize: 40, color: '#FFFFFF' },
  statsRow: {
    flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.xl,
    marginHorizontal: spacing.md, padding: spacing.md, marginBottom: spacing.md,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: 'Cairo_700Bold', fontSize: 20, color: colors.textPrimary },
  statLabel: { fontFamily: 'Cairo_400Regular', fontSize: 12, color: colors.textMuted },
  statDivider: { width: 1, height: 30, backgroundColor: colors.border, alignSelf: 'center' },
  menu: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    marginHorizontal: spacing.md, overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  menuContent: {
    flex: 1, flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm,
  },
  menuIcon: { fontSize: 20 },
  menuLabel: { fontFamily: 'Cairo_600SemiBold', fontSize: 15, color: colors.textPrimary },
  menuChevron: { fontSize: 20, color: colors.textMuted },
  logoutText: { color: colors.error },
});
