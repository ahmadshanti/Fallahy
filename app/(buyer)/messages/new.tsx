import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Avatar from '../../../components/ui/Avatar';
import { colors } from '../../../constants/colors';
import { radius, spacing } from '../../../constants/spacing';
import { useFarmers } from '../../../hooks/useFarmers';
import { useBuyerOrders } from '../../../hooks/useOrders';
import { useAuthStore } from '../../../store/authStore';
import { Farmer } from '../../../types';

type Section =
  | { kind: 'header'; label: string }
  | { kind: 'farmer'; farmer: Farmer; recent: boolean };

export default function NewChatScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: farmers = [], isLoading: farmersLoading } = useFarmers();
  const { data: orders = [] } = useBuyerOrders(user?.id || '');
  const [search, setSearch] = useState('');

  const orderedFarmerNames = useMemo(() => {
    const names = new Set<string>();
    for (const o of orders) {
      if (o.farmerName) names.add(o.farmerName.trim());
    }
    return names;
  }, [orders]);

  const data: Section[] = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = farmers.filter((f) => !q || f.farm_name.toLowerCase().includes(q));
    const ordered = filtered.filter((f) => orderedFarmerNames.has(f.farm_name.trim()));
    const others = filtered.filter((f) => !orderedFarmerNames.has(f.farm_name.trim()));

    const sections: Section[] = [];
    if (ordered.length) {
      sections.push({ kind: 'header', label: 'مزارعون اشتريت منهم' });
      ordered.forEach((farmer) => sections.push({ kind: 'farmer', farmer, recent: true }));
    }
    if (others.length) {
      sections.push({ kind: 'header', label: ordered.length ? 'كل المزارعين' : 'اختر مزارعاً' });
      others.forEach((farmer) => sections.push({ kind: 'farmer', farmer, recent: false }));
    }
    return sections;
  }, [farmers, orderedFarmerNames, search]);

  const start = (farmer: Farmer) => {
    router.replace(`/(buyer)/messages/${farmer.id}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="رجوع"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>محادثة جديدة</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="ابحث باسم المزارع أو المزرعة..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          textAlign="right"
          returnKeyType="search"
          autoFocus
        />
        <Ionicons name="search-outline" size={20} color={colors.textMuted} />
      </View>

      {farmersLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, idx) =>
            item.kind === 'header' ? `h-${idx}-${item.label}` : `f-${item.farmer.id}`
          }
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 30 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>لا يوجد مزارع مطابق</Text>
            </View>
          }
          renderItem={({ item }) => {
            if (item.kind === 'header') {
              return <Text style={styles.sectionHeader}>{item.label}</Text>;
            }
            return (
              <TouchableOpacity
                style={styles.row}
                onPress={() => start(item.farmer)}
                accessibilityRole="button"
              >
                <Avatar uri={item.farmer.owner_avatar_url} size={48} />
                <View style={styles.rowContent}>
                  <Text style={styles.rowName} numberOfLines={1}>{item.farmer.farm_name}</Text>
                  <View style={styles.rowMeta}>
                    {item.recent && (
                      <View style={styles.recentBadge}>
                        <Ionicons name="bag-handle-outline" size={11} color={colors.primary} />
                        <Text style={styles.recentBadgeText}>اشتريت منه</Text>
                      </View>
                    )}
                    {item.farmer.city && (
                      <Text style={styles.rowCity}>
                        <Ionicons name="location-outline" size={11} color={colors.textMuted} />{' '}
                        {item.farmer.city}
                      </Text>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-back" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { fontFamily: 'Cairo_700Bold', fontSize: 18, color: colors.textPrimary },
  searchBar: {
    flexDirection: 'row-reverse', alignItems: 'center',
    backgroundColor: colors.surfaceDim, borderRadius: 12, height: 48,
    marginHorizontal: spacing.md, marginVertical: spacing.sm, paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1, fontFamily: 'Cairo_400Regular', fontSize: 14, color: colors.textPrimary,
    marginEnd: spacing.sm,
  },
  sectionHeader: {
    fontFamily: 'Cairo_700Bold', fontSize: 13, color: colors.textMuted,
    textAlign: 'right', marginTop: spacing.md, marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.xl,
    marginBottom: spacing.sm,
  },
  rowContent: { flex: 1 },
  rowName: {
    fontFamily: 'Cairo_700Bold', fontSize: 15, color: colors.textPrimary,
    textAlign: 'right',
  },
  rowMeta: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  recentBadge: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 4,
    backgroundColor: '#E8F5E1', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full,
  },
  recentBadgeText: { fontFamily: 'Cairo_600SemiBold', fontSize: 11, color: colors.primary },
  rowCity: { fontFamily: 'Cairo_400Regular', fontSize: 12, color: colors.textMuted },
  empty: { alignItems: 'center', paddingTop: 60, gap: spacing.sm },
  emptyText: { fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: colors.textMuted },
});
