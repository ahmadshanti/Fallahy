import { supabase } from './supabase';

export async function getFarmersByCity(city: string) {
  const { data, error } = await supabase
    .from('farmers')
    .select('*')
    .eq('city', city)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getAllFarmers() {
  const { data, error } = await supabase
    .from('farmers')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getFarmerById(id: string) {
  const { data, error } = await supabase
    .from('farmers')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function updateFarmerProfile(id: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from('farmers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getFarmerByUserId(userId: string) {
  const { data, error } = await supabase
    .from('farmers')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
