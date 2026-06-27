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
import { useFarmer } from '../../../hooks/useFarmers';
import { useAuthStore } from '../../../store/authStore';
import { useT } from '../../../lib/i18n';

export default function FarmerChatScreen() {
  const router = useRouter();
  const { farmerId } = useLocalSearchParams<{ farmerId: string }>();
  const { data: farmer } = useFarmer(farmerId as string);
  const { user } = useAuthStore();
  const conversations = useMessagesStore((s) => s.conversations);
  const startAsBuyer = useMessagesStore((s) => s.startAsBuyer);
  const sendAsBuyer = useMessagesStore((s) => s.sendAsBuyer);
  const markRead = useMessagesStore((s) => s.markRead);
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const t = useT();

  const conversationId = useMemo(
    () => (user?.id && farmer ? `${user.id}__${farmer.id}` : null),
    [user?.id, farmer]
  );

  useEffect(() => {
    if (farmer && user) {
      startAsBuyer(
        user.id,
        user.full_name || 'مستخدم',
        user.avatar_url || '',
        farmer.id,
        farmer.farm_name,
        farmer.owner_avatar_url || ''
      );
    }
  }, [farmer, user, startAsBuyer]);

  // Mark as read on enter only — depending on `conversations` would loop.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (conversationId) markRead(conversationId, 'buyer');
  }, [conversationId]);

  const messages = useMemo(() => {
    if (!conversationId) return [];
    return conversations[conversationId]?.messages ?? [];
  }, [conversations, conversationId]);

  const onSend = () => {
    const trimmed = input.trim();
    if (!trimmed || !conversationId) return;
    sendAsBuyer(conversationId, trimmed);
    setInput('');
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={t('common.back')}>
          <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Avatar uri={farmer?.owner_avatar_url} size={36} />
          <Text style={styles.headerTitle} numberOfLines={1}>
            {farmer?.farm_name || ''}
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
          const mine = item.from === 'buyer';
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
          <TouchableOpacity style={styles.sendBtn} onPress={onSend} disabled={!input.trim()}>
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder={t('chat.placeholder')}
            placeholderTextColor={colors.textMuted}
            value={input}
            onChangeText={setInput}
            textAlign="right"
            returnKeyType="send"
            onSubmitEditing={onSend}
            multiline
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
  headerCenter: {
    flex: 1, flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm,
  },
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
});
