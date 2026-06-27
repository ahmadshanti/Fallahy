import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Avatar from '../../../components/ui/Avatar';
import { colors } from '../../../constants/colors';
import { radius, spacing } from '../../../constants/spacing';
import { useMessagesStore, ChatMessage } from '../../../store/messagesStore';
import { useAuthStore } from '../../../store/authStore';

export default function FarmerChatDetailScreen() {
  const router = useRouter();
  const { buyerId } = useLocalSearchParams<{ buyerId: string }>();
  const { user } = useAuthStore();
  const conversations = useMessagesStore((s) => s.conversations);
  const sendAsFarmer = useMessagesStore((s) => s.sendAsFarmer);
  const markRead = useMessagesStore((s) => s.markRead);
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const conversationId = useMemo(
    () => (user?.id && buyerId ? `${buyerId}__${user.id}` : null),
    [user?.id, buyerId]
  );

  const conversation = conversationId ? conversations[conversationId] : null;

  // Mark as read on enter only — depending on `conversations` would loop
  // because markRead writes to conversations on every call.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (conversationId) markRead(conversationId, 'farmer');
  }, [conversationId]);

  const messages = conversation?.messages ?? [];
  const canReply = !!(conversation?.initiatedByBuyer && conversation.messages.some((m) => m.from === 'buyer'));

  const onSend = () => {
    const trimmed = input.trim();
    if (!trimmed || !conversationId || !canReply) return;
    sendAsFarmer(conversationId, trimmed);
    setInput('');
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  if (!conversation) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>لا توجد محادثة</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyMid}>
          <Ionicons name="chatbubbles-outline" size={56} color={colors.textMuted} />
          <Text style={styles.emptyMidText}>هذه المحادثة لم تبدأ بعد.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="رجوع">
          <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Avatar uri={conversation.buyerAvatar} size={36} />
          <Text style={styles.headerTitle} numberOfLines={1}>
            {conversation.buyerName}
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => {
          const mine = item.from === 'farmer';
          return (
            <View style={[styles.bubbleRow, mine ? styles.meRow : styles.themRow]}>
              <View style={[styles.bubble, mine ? styles.meBubble : styles.themBubble]}>
                <Text style={[styles.bubbleText, mine && styles.meBubbleText]}>{item.text}</Text>
              </View>
            </View>
          );
        }}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputBar}>
          <TouchableOpacity
            style={[styles.sendBtn, !canReply && styles.sendBtnDisabled]}
            onPress={onSend}
            disabled={!input.trim() || !canReply}
          >
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder={canReply ? 'اكتب ردك...' : 'انتظر حتى يبدأ المشتري المحادثة'}
            placeholderTextColor={colors.textMuted}
            value={input}
            onChangeText={setInput}
            textAlign="right"
            returnKeyType="send"
            onSubmitEditing={onSend}
            multiline
            editable={canReply}
          />
        </View>
      </KeyboardAvoidingView>
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
  headerCenter: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  headerTitle: { fontFamily: 'Cairo_700Bold', fontSize: 16, color: colors.textPrimary, flex: 1, textAlign: 'right' },
  list: { padding: spacing.md, paddingBottom: 8 },
  bubbleRow: { flexDirection: 'row', marginBottom: spacing.sm },
  meRow: { justifyContent: 'flex-start' },
  themRow: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '75%', padding: 12, borderRadius: 16 },
  meBubble: { backgroundColor: colors.primary, borderBottomLeftRadius: 4 },
  themBubble: { backgroundColor: colors.surface, borderBottomRightRadius: 4 },
  bubbleText: {
    fontFamily: 'Cairo_400Regular', fontSize: 15, color: colors.textPrimary,
    textAlign: 'right', lineHeight: 22,
  },
  meBubbleText: { color: '#FFFFFF' },
  inputBar: {
    flexDirection: 'row-reverse', alignItems: 'flex-end',
    paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: 30,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
    gap: spacing.sm,
  },
  input: {
    flex: 1, minHeight: 44, maxHeight: 120,
    backgroundColor: colors.surfaceDim, borderRadius: radius.lg,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    fontFamily: 'Cairo_400Regular', fontSize: 15, color: colors.textPrimary,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  emptyMid: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyMidText: { fontFamily: 'Cairo_600SemiBold', fontSize: 15, color: colors.textMuted },
});
