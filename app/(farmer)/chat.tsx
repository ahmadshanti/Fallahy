import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { useAuthStore } from '../../store/authStore';
import { getConversationsByUser } from '../../lib/chat';

export default function FarmerChatListScreen() {
  const router = useRouter();
  const farmerId = useAuthStore((s) => s.farmerId);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = async () => {
    if (!farmerId) return;
    setLoading(true);
    try {
      const data = await getConversationsByUser(farmerId, 'farmer');
      setConversations(data);
    } catch (err) {
      console.log('Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [farmerId])
  );

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `${diffMins} د`;
    if (diffHours < 24) return `${diffHours} س`;
    if (diffDays < 7) return `${diffDays} ي`;
    return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
  };

  const renderConversation = ({ item }: { item: any }) => {
    const buyer = item.users;
    const buyerName = buyer?.full_name || 'مشتري';
    const unread = item.unreadCount || 0;

    return (
      <TouchableOpacity
        style={styles.conversationCard}
        onPress={() => router.push(`/(farmer)/chat-thread/${item.id}`)}
      >
        <View style={styles.cardRight}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={22} color={colors.primary} />
          </View>
        </View>
        <View style={styles.cardCenter}>
          <Text style={styles.name}>{buyerName}</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage || 'لا توجد رسائل بعد'}
          </Text>
        </View>
        <View style={styles.cardLeft}>
          <Text style={styles.time}>{formatTime(item.lastMessageTime)}</Text>
          {unread > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unread}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.pageTitle}>دردشاتي</Text>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversation}
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 20 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 80 }}>
              <Ionicons name="chatbubbles-outline" size={60} color={colors.textMuted} />
              <Text style={styles.emptyText}>لا توجد محادثات بعد</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  pageTitle: {
    fontFamily: 'Cairo_700Bold', fontSize: 22, color: colors.textPrimary,
    textAlign: 'right', paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    writingDirection: 'rtl',
  },
  conversationCard: {
    flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: spacing.md, marginBottom: spacing.sm, alignItems: 'center',
  },
  cardRight: { marginLeft: spacing.sm },
  avatarCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#E8F5E1', alignItems: 'center', justifyContent: 'center',
  },
  cardCenter: { flex: 1, marginHorizontal: spacing.sm },
  name: {
    fontFamily: 'Cairo_600SemiBold', fontSize: 15, color: colors.textPrimary,
    textAlign: 'right', writingDirection: 'rtl',
  },
  lastMessage: {
    fontFamily: 'Cairo_400Regular', fontSize: 13, color: colors.textMuted,
    textAlign: 'right', writingDirection: 'rtl', marginTop: 2,
  },
  cardLeft: { alignItems: 'center' },
  time: {
    fontFamily: 'Cairo_400Regular', fontSize: 11, color: colors.textMuted,
  },
  badge: {
    backgroundColor: colors.primary, borderRadius: 10,
    minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6, marginTop: 4,
  },
  badgeText: { fontFamily: 'Cairo_700Bold', fontSize: 11, color: '#FFFFFF' },
  emptyText: {
    fontFamily: 'Cairo_600SemiBold', fontSize: 16, color: colors.textMuted,
    marginTop: spacing.md,
  },
});
