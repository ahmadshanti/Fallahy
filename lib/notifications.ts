import { supabase } from './supabase';

export async function sendNotification(userId: string, type: string, title: string, body: string, data?: any) {
  const { error } = await supabase
    .from('notifications')
    .insert({ user_id: userId, type, title, body, data });
  if (error) throw error;
}

export async function getNotifications(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data || [];
}

export async function getUnreadCount(userId: string) {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) return 0;
  return count || 0;
}

export async function markAsRead(notificationId: string) {
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
}

export async function markAllAsRead(userId: string) {
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
}

export function subscribeToNotifications(userId: string, callback: (notif: any) => void) {
  return supabase
    .channel(`notifications-${userId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, (payload) => {
      callback(payload.new);
    })
    .subscribe();
}
