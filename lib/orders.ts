import { supabase } from './supabase';

export async function createOrder(orderData: {
  buyer_id: string;
  farmer_id: string;
  total_price: number;
  delivery_address: string;
  notes?: string;
  items: { product_id: string; quantity: number; unit_price: number; sale_type: string }[];
}) {
  const { items, ...order } = orderData;

  const { data: orderRow, error: orderError } = await supabase
    .from('orders')
    .insert({ ...order, payment_method: 'cash' })
    .select()
    .single();
  if (orderError) throw orderError;

  const orderItems = items.map((item) => ({ ...item, order_id: orderRow.id }));
  const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
  if (itemsError) throw itemsError;

  return orderRow;
}

export async function getOrdersByBuyer(buyerId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, products(name, image_url)), farmers(id, farm_name, owner_avatar_url, whatsapp_number)')
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getOrdersByFarmer(farmerId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, products(name, image_url))')
    .eq('farmer_id', farmerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getOrderById(id: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, products(name, image_url)), farmers(farm_name, owner_avatar_url, whatsapp_number, city, location_lat, location_lng)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function updateOrderStatus(orderId: string, status: string) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export function subscribeToOrder(orderId: string, callback: (order: any) => void) {
  return supabase
    .channel(`order-${orderId}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, (payload) => {
      callback(payload.new);
    })
    .subscribe();
}
