import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface ProductFilters {
  category?: string;
  organic?: boolean;
  search?: string;
  available?: boolean;
  limit?: number;
}

function transformProduct(row: any) {
  return {
    id: row.id,
    name: row.name,
    farmerId: row.farmer_id,
    farmerName: row.farmers?.farm_name || '',
    farmerAvatar: row.farmers?.owner_avatar_url || '',
    image: row.image_url || '',
    retailPrice: Number(row.retail_price ?? 0),
    wholesalePrice: Number(row.wholesale_price ?? 0),
    marketPrice: Number(row.market_price ?? 0),
    unit: row.unit,
    available: row.quantity_available ?? 0,
    harvestDate: row.harvest_date || '',
    isOrganic: !!row.is_organic,
    isFresh: !!row.is_fresh,
    origin: row.origin || '',
    rating: 0,
    reviewCount: 0,
    category: row.category || '',
    savings: row.savings_percent || row.discount_percent || 0,
    isSelfPick: !!row.is_self_pick,
    isAdoptable: !!row.is_adoptable,
  };
}

export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*, farmers!farmer_id(farm_name, owner_avatar_url, is_verified)')
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (filters?.category && filters.category !== 'الكل') {
        query = query.eq('category', filters.category);
      }
      if (filters?.organic) {
        query = query.eq('is_organic', true);
      }
      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(transformProduct);
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, farmers!farmer_id(farm_name, owner_avatar_url, is_verified)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return transformProduct(data);
    },
    enabled: !!id,
  });
}

export function useFarmerProducts(farmerId: string) {
  return useQuery({
    queryKey: ['farmerProducts', farmerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, farmers!farmer_id(farm_name, owner_avatar_url, is_verified)')
        .eq('farmer_id', farmerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(transformProduct);
    },
    enabled: !!farmerId,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (product: {
      farmer_id: string;
      name: string;
      image_url?: string;
      retail_price: number;
      wholesale_price: number;
      market_price?: number;
      unit: string;
      available: number;
      harvest_date?: string;
      is_organic: boolean;
      is_fresh: boolean;
      category: string;
      savings_percent?: number;
      is_self_pick?: boolean;
      is_adoptable?: boolean;
    }) => {
      const { data, error } = await supabase.from('products').insert(product).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['farmerProducts'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase
        .from('products')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['farmerProducts'] });
    },
  });
}
