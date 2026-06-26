import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useFarmerAlerts(farmerId: string) {
  return useQuery({
    queryKey: ['farmerAlerts', farmerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('farmer_alerts')
        .select('*')
        .eq('farmer_id', farmerId)
        .eq('is_read', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((row: any) => ({
        id: row.id,
        type: row.type,
        message: row.message,
        action: row.action || '',
        actionRoute: row.action_route || '',
      }));
    },
    enabled: !!farmerId,
  });
}

export function usePriceAlerts(buyerId: string) {
  return useQuery({
    queryKey: ['priceAlerts', buyerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('buyer_id', buyerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((row: any) => ({
        id: row.id,
        product: row.product_name,
        targetPrice: Number(row.target_price),
        currentPrice: Number(row.current_price),
        status: row.status,
      }));
    },
    enabled: !!buyerId,
  });
}

export function useCreatePriceAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (alert: {
      buyer_id: string;
      product_name: string;
      target_price: number;
      current_price: number;
    }) => {
      const { data, error } = await supabase.from('price_alerts').insert(alert).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceAlerts'] });
    },
  });
}
