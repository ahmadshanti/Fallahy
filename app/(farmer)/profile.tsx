import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { useAuthStore } from '../../store/authStore';

const menuItems = [
  { label: 'معلومات المزرعة', icon: 'home-outline' },
  { label: 'التحليلات', icon: 'bar-chart-outline' },
  { label: 'التوثيق', icon: 'checkmark-circle-outline' },
  { label: 'الإعدادات', icon: 'settings-outline' },
  { label: 'الدعم الفني', icon: 'call-outline' },
];

export default function FarmerProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/splash');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.profileHeader}>
          <Avatar uri="https://i.pravatar.cc/100?img=12" size={80} />
          <Text style={styles.farmName}>{user?.name || 'مزرعة أبو أحمد'}</Text>
          <Badge label="مزارع موثّق ✓" variant="verified" />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>منتج</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>4.8</Text>
            <Text style={styles.statLabel}>التقييم</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>340</Text>
            <Text style={styles.statLabel}>طلب</Text>
          </View>
        </View>

        <View style={styles.menu}>
          {menuItems.map((item) => (
            <TouchableOpacity key={item.label} style={styles.menuItem}>
              <Ionicons name="chevron-back" size={20} color={colors.textMuted} />
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name={item.icon as any} size={20} color={colors.textPrimary} />
              </View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Ionicons name="chevron-back" size={20} color={colors.textMuted} />
            <View style={styles.menuContent}>
              <Text style={[styles.menuLabel, styles.logoutText]}>تسجيل الخروج</Text>
              <Ionicons name="log-out-outline" size={20} color={colors.textPrimary} />
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
  farmName: {
    fontFamily: 'Cairo_700Bold', fontSize: 22, color: colors.textPrimary,
  },
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
