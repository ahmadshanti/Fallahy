import { supabase } from './supabase';

export async function createPickRequest(data: {
  buyer_id: string;
  farmer_id: string;
  product_id: string;
  requested_date: string;
  requested_time: string;
  quantity?: number;
}) {
  const { data: row, error } = await supabase
    .from('pick_requests')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return row;
}

export async function getPickRequestsByBuyer(buyerId: string) {
  const { data, error } = await supabase
    .from('pick_requests')
    .select('*, products(name, image_url), farmers(farm_name, city, whatsapp_number)')
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getPickRequestsByFarmer(farmerId: string) {
  const { data, error } = await supabase
    .from('pick_requests')
    .select('*, products(name, image_url), users!buyer_id(full_name, avatar_url, phone)')
    .eq('farmer_id', farmerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function updatePickRequestStatus(id: string, status: string) {
  const { data, error } = await supabase
    .from('pick_requests')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
