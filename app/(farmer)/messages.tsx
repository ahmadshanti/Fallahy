import React, { useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Avatar from '../../components/ui/Avatar';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { useAuthStore } from '../../store/authStore';
import { useMessagesStore, seedFarmerDemoConversations } from '../../store/messagesStore';

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `قبل ${mins} د`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `قبل ${hours} س`;
  const days = Math.floor(hours / 24);
  return `قبل ${days} يوم`;
}

export default function FarmerMessagesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const conversations = useMessagesStore((s) => s.conversations);

  // Seed demo conversations so the screen isn't empty on first launch.
  useEffect(() => {
    if (user?.id) {
      seedFarmerDemoConversations(user.id, user.name || 'مزرعتي', user.avatar || '');
    }
  }, [user?.id, user?.name, user?.avatar]);

  const list = useMemo(() => {
    if (!user?.id) return [];
    return Object.values(conversations)
      .filter((c) => c.farmerId === user.id)
      .sort((a, b) => {
        const aLast = a.messages[a.messages.length - 1]?.at ?? 0;
        const bLast = b.messages[b.messages.length - 1]?.at ?? 0;
        return bLast - aLast;
      });
  }, [conversations, user?.id]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.pageTitle}>الرسائل</Text>

      <View style={styles.banner}>
        <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
        <Text style={styles.bannerText}>
          يمكنك الرد على رسائل المشترين فقط. لا يمكن للمزارع بدء محادثة جديدة.
        </Text>
      </View>

      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={56} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>لا توجد رسائل بعد</Text>
            <Text style={styles.emptySubtitle}>سيظهر هنا رسائل المشترين عند تواصلهم معك</Text>
          </View>
        }
        renderItem={({ item }) => {
          const last = item.messages[item.messages.length - 1];
          const unread = item.messages.filter(
            (m) => m.from === 'buyer' && m.at > item.lastReadByFarmer
          ).length;
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push(`/(farmer)/messages/${item.buyerId}`)}
              accessibilityRole="button"
            >
              <Avatar uri={item.buyerAvatar} size={48} />
              <View style={styles.rowContent}>
                <View style={styles.rowTopLine}>
                  <Text style={styles.rowTime}>{formatRelative(last.at)}</Text>
                  <Text style={styles.rowName} numberOfLines={1}>{item.buyerName}</Text>
                </View>
                <View style={styles.rowBottomLine}>
                  {unread > 0 && (
                    <View style={styles.unreadDot}>
                      <Text style={styles.unreadText}>{unread}</Text>
                    </View>
                  )}
                  <Text
                    style={[styles.rowLast, unread > 0 && styles.rowLastUnread]}
                    numberOfLines={1}
                  >
                    {last.text}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  pageTitle: {
    fontFamily: 'Cairo_700Bold', fontSize: 22, color: colors.textPrimary,
    textAlign: 'right', paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  banner: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm,
    backgroundColor: '#F5F9F2', borderRadius: radius.lg,
    marginHorizontal: spacing.md, marginBottom: spacing.sm, padding: spacing.md,
  },
  bannerText: {
    flex: 1, fontFamily: 'Cairo_400Regular', fontSize: 12, color: colors.textSecondary,
    textAlign: 'right',
  },
  list: { paddingHorizontal: spacing.md, paddingBottom: 30 },
  row: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.xl,
  },
  rowContent: { flex: 1 },
  rowTopLine: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  rowBottomLine: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  rowName: { fontFamily: 'Cairo_700Bold', fontSize: 15, color: colors.textPrimary, flex: 1, textAlign: 'right' },
  rowTime: { fontFamily: 'Cairo_400Regular', fontSize: 11, color: colors.textMuted, marginStart: spacing.sm },
  rowLast: { fontFamily: 'Cairo_400Regular', fontSize: 13, color: colors.textMuted, flex: 1, textAlign: 'right' },
  rowLastUnread: { color: colors.textPrimary, fontFamily: 'Cairo_600SemiBold' },
  unreadDot: {
    backgroundColor: colors.primary, borderRadius: 10, minWidth: 20, height: 20,
    paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center', marginStart: spacing.sm,
  },
  unreadText: { color: '#FFFFFF', fontSize: 11, fontFamily: 'Cairo_700Bold' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 4 },
  emptyTitle: { fontFamily: 'Cairo_700Bold', fontSize: 17, color: colors.textPrimary, marginTop: spacing.md },
  emptySubtitle: { fontFamily: 'Cairo_400Regular', fontSize: 13, color: colors.textMuted, textAlign: 'center' },
});
