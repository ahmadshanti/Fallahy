import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { getConversationsByUser } from '../../lib/chat';
import { Conversation } from '../../types';

export default function ConversationsScreen() {
  const router = useRouter();
  const { buyerId } = useAuthStore();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    if (!buyerId) return;
    try {
      setLoading(true);
      const data = await getConversationsByUser(buyerId, 'buyer');
      setConversations(data);
    } catch (err) {
      console.error('Conversations load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'الآن';
    if (mins < 60) return `${mins} د`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} س`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} ي`;
    return date.toLocaleDateString('ar');
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const farmerName = item.farmers?.farm_name || 'مزارع';
    const farmerAvatar = item.farmers?.owner_avatar_url;

    return (
      <TouchableOpacity
        style={styles.convRow}
        onPress={() => router.push(`/(buyer)/chat-thread/${item.id}`)}
        activeOpacity={0.7}
      >
        {/* Left: time + unread */}
        <View style={styles.convLeft}>
          <Text style={styles.convTime}>{formatTime(item.lastMessageTime || '')}</Text>
          {(item.unreadCount || 0) > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>

        {/* Center: name + message */}
        <View style={styles.convCenter}>
          <Text style={styles.convName} numberOfLines={1}>{farmerName}</Text>
          <Text
            style={[
              styles.convMessage,
              (item.unreadCount || 0) > 0 && styles.convMessageUnread,
            ]}
            numberOfLines={1}
          >
            {item.lastMessage || 'لا توجد رسائل'}
          </Text>
        </View>

        {/* Right: avatar */}
        <View style={styles.convAvatarWrapper}>
          {farmerAvatar ? (
            <Image source={{ uri: farmerAvatar }} style={styles.convAvatar} />
          ) : (
            <View style={[styles.convAvatar, styles.placeholderAvatar]}>
              <Ionicons name="person" size={22} color={colors.textMuted} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>دردشاتي</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>لا توجد محادثات</Text>
          <Text style={styles.emptySubtitle}>
            ابدأ محادثة مع أي مزارع من صفحة المنتج أو المزرعة
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 22,
    color: colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  convAvatarWrapper: {
    marginLeft: 12,
  },
  convAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  placeholderAvatar: {
    backgroundColor: colors.surfaceDim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  convCenter: {
    flex: 1,
    alignItems: 'flex-end',
  },
  convName: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  convMessage: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 2,
  },
  convMessageUnread: {
    fontFamily: 'Cairo_600SemiBold',
    color: colors.textPrimary,
  },
  convLeft: {
    alignItems: 'flex-start',
    gap: 6,
    minWidth: 50,
  },
  convTime: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 11,
    color: colors.textMuted,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 11,
    color: '#fff',
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 17,
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  emptySubtitle: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
