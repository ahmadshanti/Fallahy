import { supabase } from './supabase';

export async function getOrCreateConversation(buyerId: string, farmerId: string, orderId?: string) {
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('buyer_id', buyerId)
    .eq('farmer_id', farmerId)
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await supabase
    .from('conversations')
    .insert({ buyer_id: buyerId, farmer_id: farmerId, order_id: orderId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getConversationsByUser(userId: string, role: 'buyer' | 'farmer') {
  const column = role === 'buyer' ? 'buyer_id' : 'farmer_id';
  const joinTable = role === 'buyer' ? 'farmers(id, farm_name, owner_avatar_url)' : 'users!buyer_id(id, full_name, avatar_url)';

  const { data, error } = await supabase
    .from('conversations')
    .select(`*, ${joinTable}, messages(content, created_at, is_read, sender_type)`)
    .eq(column, userId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  return (data || []).map((conv: any) => {
    const msgs = conv.messages || [];
    const sorted = msgs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const lastMsg = sorted[0];
    const unreadCount = msgs.filter((m: any) => !m.is_read && m.sender_type !== role).length;

    return {
      ...conv,
      lastMessage: lastMsg?.content || '',
      lastMessageTime: lastMsg?.created_at || conv.created_at,
      unreadCount,
    };
  });
}

export async function getMessages(conversationId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function sendMessage(conversationId: string, senderId: string, senderType: string, content: string) {
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, sender_type: senderType, content })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export function subscribeToMessages(conversationId: string, callback: (msg: any) => void) {
  return supabase
    .channel(`messages-${conversationId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
      callback(payload.new);
    })
    .subscribe();
}

export async function markMessagesAsRead(conversationId: string, readerType: string) {
  const senderType = readerType === 'buyer' ? 'farmer' : 'buyer';
  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .eq('sender_type', senderType)
    .eq('is_read', false);
}
