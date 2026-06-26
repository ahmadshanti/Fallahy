import { supabase } from './supabase';

interface ProductFilters {
  category?: string;
  organic?: boolean;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  farmerId?: string;
  available?: boolean;
  limit?: number;
}

export async function getProducts(filters?: ProductFilters) {
  let query = supabase
    .from('products')
    .select('*, farmers!farmer_id(id, farm_name, city, owner_avatar_url, is_verified)')
    .eq('is_available', true)
    .order('created_at', { ascending: false });

  if (filters?.farmerId) query = query.eq('farmer_id', filters.farmerId);
  if (filters?.organic) query = query.eq('is_organic', true);
  if (filters?.minPrice) query = query.gte('retail_price', filters.minPrice);
  if (filters?.maxPrice) query = query.lte('retail_price', filters.maxPrice);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getProductById(id: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*, farmers!farmer_id(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function getProductsByFarmer(farmerId: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('farmer_id', farmerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addProduct(productData: Record<string, any>) {
  const { data, error } = await supabase
    .from('products')
    .insert(productData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProduct(id: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}
