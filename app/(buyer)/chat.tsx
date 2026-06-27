import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Avatar from '../../components/ui/Avatar';
import AIHelperModal from '../../components/buyer/AIHelperModal';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { useMessagesStore, Conversation } from '../../store/messagesStore';
import { useAuthStore } from '../../store/authStore';
import { useT } from '../../lib/i18n';
import { aiServiceConfigured } from '../../lib/aiService';

function formatRelative(ts: number, lang: 'ar' | 'en' = 'ar'): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return lang === 'ar' ? 'الآن' : 'now';
  if (mins < 60) return lang === 'ar' ? `قبل ${mins} د` : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return lang === 'ar' ? `قبل ${hours} س` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return lang === 'ar' ? `قبل ${days} يوم` : `${days}d ago`;
}

type Row =
  | { kind: 'ai' }
  | { kind: 'farmer'; convo: Conversation };

export default function ConversationsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const conversations = useMessagesStore((s) => s.conversations);
  const t = useT();
  const [aiOpen, setAiOpen] = useState(false);

  const rows: Row[] = useMemo(() => {
    const farmerRows: Row[] = Object.values(conversations)
      .filter((c) => c.buyerId === user?.id && c.messages.length > 0)
      .sort((a, b) => {
        const aLast = a.messages[a.messages.length - 1]?.at ?? 0;
        const bLast = b.messages[b.messages.length - 1]?.at ?? 0;
        return bLast - aLast;
      })
      .map((convo) => ({ kind: 'farmer' as const, convo }));
    return [{ kind: 'ai' as const }, ...farmerRows];
  }, [conversations, user?.id]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>{t('chat.title')}</Text>
        <TouchableOpacity
          style={styles.newChatBtn}
          onPress={() => router.push('/(buyer)/messages/new')}
          accessibilityRole="button"
          accessibilityLabel="محادثة جديدة"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="create-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(r) => (r.kind === 'ai' ? 'ai' : r.convo.id)}
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: 30 }}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={null}
        renderItem={({ item }) => {
          if (item.kind === 'ai') {
            return (
              <TouchableOpacity
                style={[styles.row, styles.aiRow]}
                onPress={() => setAiOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="المساعد الذكي"
              >
                <View style={styles.aiIconWrap}>
                  <Ionicons name="sparkles" size={22} color="#FFFFFF" />
                </View>
                <View style={styles.rowContent}>
                  <View style={styles.rowTopLine}>
                    <View style={styles.aiBadge}>
                      <Text style={styles.aiBadgeText}>AI</Text>
                    </View>
                    <Text style={styles.rowName} numberOfLines={1}>المساعد الذكي</Text>
                  </View>
                  <Text style={styles.rowLast} numberOfLines={1}>
                    اسألني عن طلبك، المنتجات، أو كيف تستخدم التطبيق
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }

          const { convo } = item;
          const last = convo.messages[convo.messages.length - 1];
          const unread = convo.messages.filter(
            (m) => m.from === 'farmer' && m.at > convo.lastReadByBuyer
          ).length;
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push(`/(buyer)/messages/${convo.farmerId}`)}
              accessibilityRole="button"
            >
              <Avatar uri={convo.farmerAvatar} size={48} />
              <View style={styles.rowContent}>
                <View style={styles.rowTopLine}>
                  <Text style={styles.rowTime}>{formatRelative(last.at)}</Text>
                  <Text style={styles.rowName} numberOfLines={1}>{convo.farmerName}</Text>
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

      {rows.length === 1 && (
        <View style={styles.emptyHint}>
          <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyHintTitle}>{t('chat.no_conversations')}</Text>
          <Text style={styles.emptyHintSubtitle}>{t('chat.start_first')}</Text>
        </View>
      )}

      {aiServiceConfigured && (
        <AIHelperModal visible={aiOpen} onClose={() => setAiOpen(false)} role="buyer" />
      )}
      {/* When the AI service isn't configured, the tile shows a hint via the toast */}
      {!aiServiceConfigured && aiOpen && (
        <AIHelperModal visible={aiOpen} onClose={() => setAiOpen(false)} role="buyer" />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  pageHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pageTitle: {
    fontFamily: 'Cairo_700Bold', fontSize: 22, color: colors.textPrimary,
    textAlign: 'right',
  },
  newChatBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#E8F5E1', alignItems: 'center', justifyContent: 'center',
  },
  row: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.xl,
  },
  aiRow: { backgroundColor: '#F5F9F2', borderWidth: 1, borderColor: '#D7E8C8' },
  aiIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  aiBadge: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingHorizontal: 6, paddingVertical: 2, marginStart: spacing.sm,
  },
  aiBadgeText: { color: '#FFFFFF', fontFamily: 'Cairo_700Bold', fontSize: 10 },
  rowContent: { flex: 1 },
  rowTopLine: {
    flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center',
  },
  rowBottomLine: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginTop: 4,
  },
  rowName: { fontFamily: 'Cairo_700Bold', fontSize: 15, color: colors.textPrimary, flex: 1, textAlign: 'right' },
  rowTime: { fontFamily: 'Cairo_400Regular', fontSize: 11, color: colors.textMuted, marginStart: spacing.sm },
  rowLast: { fontFamily: 'Cairo_400Regular', fontSize: 13, color: colors.textMuted, flex: 1, textAlign: 'right' },
  rowLastUnread: { color: colors.textPrimary, fontFamily: 'Cairo_600SemiBold' },
  unreadDot: {
    backgroundColor: colors.primary, borderRadius: 10, minWidth: 20, height: 20,
    paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center', marginStart: spacing.sm,
  },
  unreadText: { color: '#FFFFFF', fontSize: 11, fontFamily: 'Cairo_700Bold' },
  sep: { height: spacing.sm },
  emptyHint: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: 4,
  },
  emptyHintTitle: { fontFamily: 'Cairo_700Bold', fontSize: 15, color: colors.textPrimary, marginTop: spacing.sm },
  emptyHintSubtitle: { fontFamily: 'Cairo_400Regular', fontSize: 13, color: colors.textMuted, textAlign: 'center' },
});
