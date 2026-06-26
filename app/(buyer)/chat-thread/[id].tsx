import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '../../../constants/colors';
import { useAuthStore } from '../../../store/authStore';
import {
  getMessages,
  sendMessage,
  subscribeToMessages,
  markMessagesAsRead,
} from '../../../lib/chat';
import { supabase } from '../../../lib/supabase';
import { Message } from '../../../types';

export default function ChatThreadScreen() {
  const router = useRouter();
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const { buyerId } = useAuthStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [farmerName, setFarmerName] = useState('');
  const [farmerAvatar, setFarmerAvatar] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (conversationId) {
      loadMessages();
      loadConversationInfo();
      markMessagesAsRead(conversationId, 'buyer').catch(() => {});
    }
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;
    const channel = subscribeToMessages(conversationId, (newMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      if (newMsg.sender_type === 'farmer') {
        markMessagesAsRead(conversationId, 'buyer').catch(() => {});
      }
    });
    return () => {
      channel.unsubscribe();
    };
  }, [conversationId]);

  const loadConversationInfo = async () => {
    try {
      const { data } = await supabase
        .from('conversations')
        .select('farmers(farm_name, owner_avatar_url)')
        .eq('id', conversationId!)
        .single();
      if (data?.farmers) {
        setFarmerName((data.farmers as any).farm_name || '');
        setFarmerAvatar((data.farmers as any).owner_avatar_url || null);
      }
    } catch {
      // Ignore
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await getMessages(conversationId!);
      setMessages(data);
    } catch (err) {
      console.error('Messages load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !buyerId || !conversationId || sending) return;
    const text = inputText.trim();
    setInputText('');
    try {
      setSending(true);
      const newMsg = await sendMessage(conversationId, buyerId, 'buyer', text);
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    } catch (err) {
      console.error('Send error:', err);
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isBuyer = item.sender_id === buyerId;

    return (
      <View
        style={[
          styles.messageBubbleWrapper,
          isBuyer ? styles.buyerBubbleWrapper : styles.farmerBubbleWrapper,
        ]}
      >
        {!isBuyer && (
          <View style={styles.farmerAvatarSmall}>
            {farmerAvatar ? (
              <Image source={{ uri: farmerAvatar }} style={styles.msgAvatar} />
            ) : (
              <View style={[styles.msgAvatar, styles.placeholderAvatar]}>
                <Ionicons name="person" size={12} color={colors.textMuted} />
              </View>
            )}
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isBuyer ? styles.buyerBubble : styles.farmerBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isBuyer ? styles.buyerMessageText : styles.farmerMessageText,
            ]}
          >
            {item.content}
          </Text>
          <View style={styles.messageTimeRow}>
            <Text
              style={[
                styles.messageTime,
                isBuyer ? styles.buyerMessageTime : styles.farmerMessageTime,
              ]}
            >
              {formatTime(item.created_at)}
            </Text>
            {isBuyer && (
              <Ionicons
                name={item.is_read ? 'checkmark-done' : 'checkmark'}
                size={14}
                color="rgba(255,255,255,0.6)"
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerName} numberOfLines={1}>
            {farmerName || 'محادثة'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubble-outline" size={40} color={colors.textMuted} />
          <Text style={styles.emptyText}>ابدأ المحادثة بإرسال رسالة</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {/* Input */}
      <View style={styles.inputBar}>
        <TouchableOpacity
          style={[styles.sendBtn, (!inputText.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="اكتب رسالة..."
          placeholderTextColor={colors.textMuted}
          textAlign="right"
          multiline
          maxLength={1000}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerName: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 17,
    color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: colors.textMuted,
    writingDirection: 'rtl',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  messageBubbleWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  buyerBubbleWrapper: {
    justifyContent: 'flex-end',
  },
  farmerBubbleWrapper: {
    justifyContent: 'flex-start',
  },
  farmerAvatarSmall: {
    marginRight: 6,
    marginBottom: 4,
  },
  msgAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  placeholderAvatar: {
    backgroundColor: colors.surfaceDim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  buyerBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
  },
  farmerBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    lineHeight: 22,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  buyerMessageText: {
    color: '#fff',
  },
  farmerMessageText: {
    color: colors.textPrimary,
  },
  messageTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
    marginTop: 4,
  },
  messageTime: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 10,
  },
  buyerMessageTime: {
    color: 'rgba(255,255,255,0.6)',
  },
  farmerMessageTime: {
    color: colors.textMuted,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 30 : 14,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.surfaceDim,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: colors.textPrimary,
    maxHeight: 100,
    writingDirection: 'rtl',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
