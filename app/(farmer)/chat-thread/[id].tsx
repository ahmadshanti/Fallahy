import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
  FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../constants/colors';
import { radius, spacing } from '../../../constants/spacing';
import { useAuthStore } from '../../../store/authStore';
import { getMessages, sendMessage, subscribeToMessages, markMessagesAsRead } from '../../../lib/chat';
import { supabase } from '../../../lib/supabase';

export default function FarmerChatThread() {
  const router = useRouter();
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const farmerId = useAuthStore((s) => s.farmerId);
  const farmer = useAuthStore((s) => s.farmer);

  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [otherName, setOtherName] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!conversationId || !farmerId) return;
    loadMessages();
    loadConversationInfo();

    // Mark messages as read
    markMessagesAsRead(conversationId, 'farmer');

    // Subscribe to realtime
    const channel = subscribeToMessages(conversationId, (newMsg: any) => {
      setMessages((prev) => [...prev, newMsg]);
      if (newMsg.sender_type !== 'farmer') {
        markMessagesAsRead(conversationId, 'farmer');
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, farmerId]);

  const loadMessages = async () => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const data = await getMessages(conversationId);
      setMessages(data);
    } catch (err) {
      console.log('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadConversationInfo = async () => {
    if (!conversationId) return;
    try {
      const { data } = await supabase
        .from('conversations')
        .select('*, users!buyer_id(full_name)')
        .eq('id', conversationId)
        .single();
      if (data?.users) {
        setOtherName(data.users.full_name || 'مشتري');
      }
    } catch (err) {
      console.log('Error loading conversation info:', err);
    }
  };

  const handleSend = async () => {
    if (!text.trim() || !conversationId || !farmerId) return;
    const messageText = text.trim();
    setText('');
    setSending(true);
    try {
      await sendMessage(conversationId, farmerId, 'farmer', messageText);
    } catch (err) {
      console.log('Error sending message:', err);
      setText(messageText);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isFarmer = item.sender_type === 'farmer';
    return (
      <View style={[styles.messageRow, isFarmer ? styles.messageRight : styles.messageLeft]}>
        <View style={[styles.bubble, isFarmer ? styles.bubbleFarmer : styles.bubbleBuyer]}>
          <Text style={[styles.messageText, isFarmer ? styles.messageTextFarmer : styles.messageTextBuyer]}>
            {item.content}
          </Text>
          <Text style={[styles.messageTime, isFarmer ? styles.timeRight : styles.timeLeft]}>
            {formatTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerName}>{otherName || 'المحادثة'}</Text>
        </View>
        <View style={styles.headerAvatar}>
          <Ionicons name="person" size={18} color={colors.primary} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingTop: 60 }}>
                <Ionicons name="chatbubbles-outline" size={50} color={colors.textMuted} />
                <Text style={styles.emptyText}>ابدأ المحادثة</Text>
              </View>
            }
          />
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            <Ionicons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="اكتب رسالتك..."
            placeholderTextColor={colors.textMuted}
            textAlign="right"
            multiline
            maxLength={1000}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerName: { fontFamily: 'Cairo_700Bold', fontSize: 16, color: colors.textPrimary },
  headerAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#E8F5E1', alignItems: 'center', justifyContent: 'center',
  },
  messagesList: { padding: spacing.md, paddingBottom: spacing.sm },
  messageRow: { marginBottom: spacing.sm },
  messageRight: { alignItems: 'flex-start' },
  messageLeft: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '75%', borderRadius: radius.xl, padding: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  bubbleFarmer: {
    backgroundColor: colors.primary, borderBottomLeftRadius: 4,
    alignSelf: 'flex-start',
  },
  bubbleBuyer: {
    backgroundColor: colors.surface, borderBottomRightRadius: 4,
    borderWidth: 1, borderColor: colors.border,
    alignSelf: 'flex-end',
  },
  messageText: {
    fontFamily: 'Cairo_400Regular', fontSize: 14, lineHeight: 22,
    writingDirection: 'rtl',
  },
  messageTextFarmer: { color: '#FFFFFF' },
  messageTextBuyer: { color: colors.textPrimary },
  messageTime: {
    fontFamily: 'Cairo_400Regular', fontSize: 10, marginTop: 4,
  },
  timeRight: { color: 'rgba(255,255,255,0.7)', textAlign: 'left' },
  timeLeft: { color: colors.textMuted, textAlign: 'right' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
    gap: spacing.sm,
  },
  input: {
    flex: 1, fontFamily: 'Cairo_400Regular', fontSize: 15,
    color: colors.textPrimary, backgroundColor: colors.surfaceDim,
    borderRadius: radius.xl, paddingHorizontal: spacing.md,
    paddingVertical: 10, maxHeight: 100, writingDirection: 'rtl',
    borderWidth: 1, borderColor: colors.border,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
  emptyText: {
    fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: colors.textMuted, marginTop: spacing.sm,
  },
});
