import React, { useRef, useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { aiChat, ChatTurn } from '../../lib/aiService';

// Local fallback answers when Rwan's service is unreachable. Mirrors the
// demo-mode replies in services/ai-service/claude_chat.py so the modal feels
// useful in a Wi-Fi-less demo or before the Python service is started.
const LOCAL_FALLBACK: { keys: string[]; reply: string }[] = [
  {
    keys: ['وصل', 'متى', 'يوصل', 'توصيل'],
    reply: 'طلبك عادةً يوصل خلال 25–40 دقيقة حسب المسافة. تقدر تتابعه من شاشة تتبّع الطلب.',
  },
  {
    keys: ['عضوي', 'مبيدات'],
    reply: 'العضوي مزروع بدون مبيدات كيماوية. التقليدي قد يستخدم مبيدات مسموحة. الاثنان طازجان من نفس اليوم.',
  },
  {
    keys: ['دفع', 'بطاقة', 'كاش'],
    reply: 'تقدر تدفع كاش عند الاستلام، أو ببطاقة، أو من المحفظة داخل التطبيق.',
  },
  {
    keys: ['مزارع', 'تواصل', 'اتصل', 'واتساب'],
    reply: 'تقدر تتواصل مع المزارع من صفحة المنتج أو تتبع الطلب — زر "مراسلة" يفتح محادثة داخل التطبيق.',
  },
  {
    keys: ['تبني', 'شجرة'],
    reply: 'في قسم "تبنّى شجرة" بتقدر تختار شجرة، تشوف صورة لها بكل موسم، وتدعم المزارع مباشرة.',
  },
];

function localFallback(message: string): string {
  const lower = message;
  for (const entry of LOCAL_FALLBACK) {
    if (entry.keys.some((k) => lower.includes(k))) return entry.reply;
  }
  return 'لتشغيل المساعد الذكي شغّل خدمة AI:\ncd services/ai-service && uvicorn main:app --reload\nأو اسأل بكلمات أبسط: التوصيل، العضوي، الدفع، التواصل مع المزارع.';
}

interface AIHelperModalProps {
  visible: boolean;
  onClose: () => void;
  role?: 'buyer' | 'farmer';
}

interface UIMessage {
  id: string;
  text: string;
  from: 'me' | 'bot';
}

const SUGGESTIONS = [
  'إيمتى بيوصل طلبي؟',
  'شو الفرق بين العضوي والعادي؟',
  'كيف أتواصل مع المزارع؟',
];

export default function AIHelperModal({ visible, onClose, role = 'buyer' }: AIHelperModalProps) {
  const [messages, setMessages] = useState<UIMessage[]>([
    { id: 'm0', text: 'أهلاً! أنا مساعد فلاحي الذكي. اسأل عن طلبك أو منتجاتنا.', from: 'bot' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList<UIMessage>>(null);

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || loading) return;
    const userMsg: UIMessage = { id: `u-${Date.now()}`, text, from: 'me' };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);

    const history: ChatTurn[] = messages
      .filter((m) => m.id !== 'm0')
      .map((m) => ({ role: m.from === 'me' ? 'user' : 'assistant', content: m.text }));

    try {
      const reply = await aiChat(text, role, history);
      const botMsg: UIMessage = { id: `b-${Date.now()}`, text: reply.reply, from: 'bot' };
      setMessages((m) => [...m, botMsg]);
    } catch {
      // Service offline — use the local demo answers so the chat still works.
      const botMsg: UIMessage = {
        id: `b-${Date.now()}`,
        text: localFallback(text),
        from: 'bot',
      };
      setMessages((m) => [...m, botMsg]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="رجوع"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <View style={styles.botBubble}>
              <Ionicons name="sparkles" size={14} color={colors.primary} />
            </View>
            <Text style={styles.headerTitle}>المساعد الذكي</Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => (
            <View style={[styles.bubbleRow, item.from === 'me' ? styles.meRow : styles.botRow]}>
              <View style={[styles.bubble, item.from === 'me' ? styles.meBubble : styles.botBubbleStyle]}>
                <Text style={[styles.bubbleText, item.from === 'me' && styles.meText]}>{item.text}</Text>
              </View>
            </View>
          )}
        />

        {messages.length === 1 && (
          <View style={styles.suggestionsRow}>
            {SUGGESTIONS.map((s) => (
              <TouchableOpacity key={s} style={styles.suggestionChip} onPress={() => send(s)}>
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.inputBar}>
            <TouchableOpacity style={styles.sendBtn} onPress={() => send()} disabled={!input.trim() || loading}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Ionicons name="send" size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="اكتب سؤالك..."
              placeholderTextColor={colors.textMuted}
              value={input}
              onChangeText={setInput}
              textAlign="right"
              returnKeyType="send"
              onSubmitEditing={() => send()}
              multiline
              editable={!loading}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitleWrap: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  botBubble: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#E8F5E1', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: 'Cairo_700Bold', fontSize: 17, color: colors.textPrimary },
  list: { padding: spacing.md, paddingBottom: 8 },
  bubbleRow: { flexDirection: 'row', marginBottom: spacing.sm },
  meRow: { justifyContent: 'flex-start' },
  botRow: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '78%', padding: 12, borderRadius: 16 },
  meBubble: { backgroundColor: colors.primary, borderBottomLeftRadius: 4 },
  botBubbleStyle: { backgroundColor: colors.surface, borderBottomRightRadius: 4 },
  bubbleText: { fontFamily: 'Cairo_400Regular', fontSize: 15, color: colors.textPrimary, textAlign: 'right', lineHeight: 22 },
  meText: { color: '#FFFFFF' },
  suggestionsRow: {
    flexDirection: 'row-reverse', flexWrap: 'wrap',
    paddingHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.sm,
  },
  suggestionChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary,
  },
  suggestionText: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: colors.primary },
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
