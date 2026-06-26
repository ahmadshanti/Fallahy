import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
}

const quickQuestions = [
  'متى يوصل طلبي؟',
  'شو الفرق بين العضوي والعادي؟',
  'كيف أتواصل مع المزارع؟',
];

const aiResponses: Record<string, string> = {
  'متى يوصل طلبي؟': 'طلبك في طريقه إليك! المزارع أبو أحمد يجهز الطلب حالياً. الوصول المتوقع: 11:15 صباحاً.',
  'شو الفرق بين العضوي والعادي؟': 'المنتج العضوي يُزرع بدون مبيدات كيميائية أو أسمدة صناعية. في فلاحي، المزارعين الموثقين بختم "عضوي" ملتزمين بهاي المعايير.',
  'كيف أتواصل مع المزارع؟': 'يمكنك التواصل مباشرة مع المزارع عبر واتساب من صفحة الطلب أو من ملف المزارع.',
};

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      text: 'أهلاً! أنا مساعد فلاحي الذكي\nكيف ممكن أساعدك اليوم؟',
      isUser: false,
      timestamp: '10:00 AM',
    },
  ]);
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = (text: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      const response = aiResponses[text] || 'شكراً لسؤالك! سأحاول مساعدتك. هل يمكنك توضيح أكثر؟';
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.pageTitle}>الدردشة</Text>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        renderItem={({ item }) => (
          <View style={[styles.bubbleRow, item.isUser ? styles.userRow : styles.aiRow]}>
            {!item.isUser && (
              <View style={styles.aiAvatar}>
                <Ionicons name="leaf" size={14} color={colors.primary} />
              </View>
            )}
            <View style={[styles.bubble, item.isUser ? styles.userBubble : styles.aiBubble]}>
              <Text style={[styles.bubbleText, item.isUser && styles.userBubbleText]}>
                {item.text}
              </Text>
              <Text style={[styles.timestamp, item.isUser && styles.userTimestamp]}>
                {item.timestamp}
              </Text>
            </View>
          </View>
        )}
      />

      {/* Quick Questions */}
      {messages.length <= 1 && (
        <View style={styles.quickRow}>
          {quickQuestions.map((q) => (
            <TouchableOpacity key={q} style={styles.quickChip} onPress={() => sendMessage(q)}>
              <Text style={styles.quickText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Input Bar */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.micBtn}>
            <Ionicons name="mic-outline" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="اكتب رسالتك..."
            placeholderTextColor={colors.textMuted}
            value={input}
            onChangeText={setInput}
            textAlign="right"
          />
          <TouchableOpacity style={styles.sendBtn} onPress={() => input.trim() && sendMessage(input.trim())}>
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  pageTitle: {
    fontFamily: 'Cairo_700Bold', fontSize: 20, color: colors.textPrimary,
    textAlign: 'center', paddingVertical: spacing.sm,
  },
  chatList: { padding: spacing.md, paddingBottom: 8 },
  bubbleRow: { flexDirection: 'row', marginBottom: spacing.sm, alignItems: 'flex-end' },
  userRow: { justifyContent: 'flex-end' },
  aiRow: { justifyContent: 'flex-start' },
  aiAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.surfaceDim, alignItems: 'center', justifyContent: 'center',
    marginRight: 6,
  },
  aiAvatarText: { fontSize: 14 },
  bubble: { maxWidth: '75%', padding: 12, borderRadius: 16 },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontFamily: 'Cairo_400Regular', fontSize: 15, color: colors.textPrimary,
    textAlign: 'right', writingDirection: 'rtl', lineHeight: 24,
  },
  userBubbleText: { color: '#FFFFFF' },
  timestamp: {
    fontFamily: 'Cairo_400Regular', fontSize: 10, color: colors.textMuted,
    textAlign: 'right', marginTop: 4,
  },
  userTimestamp: { color: 'rgba(255,255,255,0.6)' },
  quickRow: {
    flexDirection: 'row-reverse', flexWrap: 'wrap',
    paddingHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.sm,
  },
  quickChip: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary,
    borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 8,
  },
  quickText: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: colors.primary },
  inputBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, paddingBottom: 30,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
    gap: spacing.sm,
  },
  input: {
    flex: 1, height: 44, backgroundColor: colors.surfaceDim,
    borderRadius: radius.full, paddingHorizontal: spacing.md,
    fontFamily: 'Cairo_400Regular', fontSize: 15, color: colors.textPrimary,
    writingDirection: 'rtl',
  },
  micBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.surfaceDim, alignItems: 'center', justifyContent: 'center',
  },
  micIcon: { fontSize: 20 },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendIcon: { fontSize: 18, color: '#FFFFFF' },
});
