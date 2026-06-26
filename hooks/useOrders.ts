import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

function transformOrder(row: any) {
  return {
    id: row.order_number || row.id,
    status: row.status,
    farmerName: row.farmer?.name || row.farmer?.farm_name || '',
    farmerAvatar: row.farmer?.avatar_url || '',
    farmerPhone: row.farmer?.phone || '',
    items: (row.order_items || []).map((item: any) => ({
      name: item.product_name,
      qty: item.quantity,
      price: Number(item.price),
    })),
    total: Number(row.total),
    estimatedArrival: row.estimated_arrival || '',
    placedAt: new Date(row.placed_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    address: row.address || '',
    orderUuid: row.id,
  };
}

export function useBuyerOrders(buyerId: string) {
  return useQuery({
    queryKey: ['buyerOrders', buyerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*), farmer:farmer_id(name, farm_name, avatar_url, phone)')
        .eq('buyer_id', buyerId)
        .order('placed_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(transformOrder);
    },
    enabled: !!buyerId,
  });
}

export function useFarmerOrders(farmerId: string) {
  return useQuery({
    queryKey: ['farmerOrders', farmerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*), buyer:buyer_id(name, avatar_url, phone)')
        .eq('farmer_id', farmerId)
        .order('placed_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((row: any) => ({
        ...transformOrder(row),
        buyerName: row.buyer?.name || '',
        buyerAvatar: row.buyer?.avatar_url || '',
        buyerPhone: row.buyer?.phone || '',
      }));
    },
    enabled: !!farmerId,
  });
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*), farmer:farmer_id(name, farm_name, avatar_url, phone)')
        .eq('order_number', orderId)
        .single();
      if (error) throw error;
      return transformOrder(data);
    },
    enabled: !!orderId,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (order: {
      buyer_id: string;
      farmer_id: string;
      total: number;
      delivery_type: string;
      payment_method: string;
      address: string;
      items: { product_id: string; product_name: string; quantity: number; price: number; price_type: string }[];
    }) => {
      const orderNumber = `ORD-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          buyer_id: order.buyer_id,
          farmer_id: order.farmer_id,
          total: order.total,
          delivery_type: order.delivery_type,
          payment_method: order.payment_method,
          address: order.address,
          estimated_arrival: '45 دقيقة',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const itemsToInsert = order.items.map((item) => ({
        order_id: orderData.id,
        ...item,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert);
      if (itemsError) throw itemsError;

      return { orderNumber, orderId: orderData.id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyerOrders'] });
      queryClient.invalidateQueries({ queryKey: ['farmerOrders'] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyerOrders'] });
      queryClient.invalidateQueries({ queryKey: ['farmerOrders'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
    },
  });
}
