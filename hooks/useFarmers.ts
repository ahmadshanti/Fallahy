import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Farmer } from '../types';

function transformFarmer(row: any): Farmer {
  return {
    id: row.id,
    name: row.farm_name || row.name,
    avatar: row.avatar_url || '',
    rating: 0,
    reviewCount: 0,
    distance: 0,
    isVerified: row.is_verified,
    location: row.location || { latitude: 32.22, longitude: 35.25 },
    story: row.farm_story || '',
    specialty: row.specialty || [],
    totalProducts: row.product_count || 0,
  };
}

export function useFarmers() {
  return useQuery({
    queryKey: ['farmers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, products(count)')
        .eq('role', 'farmer')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((row: any) => {
        const f = transformFarmer(row);
        f.totalProducts = row.products?.[0]?.count || 0;
        return f;
      });
    },
  });
}

export function useFarmer(id: string) {
  return useQuery({
    queryKey: ['farmer', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, products(count)')
        .eq('id', id)
        .single();
      if (error) throw error;
      const f = transformFarmer(data);
      f.totalProducts = (data as any).products?.[0]?.count || 0;
      return f;
    },
    enabled: !!id,
  });
}
