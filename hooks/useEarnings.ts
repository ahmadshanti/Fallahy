import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useFarmerEarnings(farmerId: string, period: string) {
  return useQuery({
    queryKey: ['farmerEarnings', farmerId, period],
    queryFn: async () => {
      let fromDate = new Date();
      if (period === 'اليوم') {
        fromDate.setHours(0, 0, 0, 0);
      } else if (period === 'الأسبوع') {
        fromDate.setDate(fromDate.getDate() - 7);
      } else {
        fromDate.setMonth(fromDate.getMonth() - 1);
      }

      const { data, error } = await supabase
        .from('orders')
        .select('total, placed_at')
        .eq('farmer_id', farmerId)
        .gte('placed_at', fromDate.toISOString())
        .in('status', ['received', 'preparing', 'on_the_way', 'delivered']);

      if (error) throw error;

      const total = (data || []).reduce((sum: number, o: any) => sum + Number(o.total), 0);
      const count = data?.length || 0;

      return { total, count };
    },
    enabled: !!farmerId,
  });
}

export function useFarmerTransactions(farmerId: string) {
  return useQuery({
    queryKey: ['farmerTransactions', farmerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, buyer:buyer_id(name, avatar_url), order_items(product_name, quantity)')
        .eq('farmer_id', farmerId)
        .order('placed_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return (data || []).map((row: any) => ({
        id: row.id,
        buyer: row.buyer?.name || '',
        avatar: row.buyer?.avatar_url || '',
        amount: Number(row.total),
        date: new Date(row.placed_at).toLocaleDateString('ar'),
        items: (row.order_items || []).map((i: any) => `${i.product_name} × ${i.quantity}`).join(', '),
      }));
    },
    enabled: !!farmerId,
  });
}

export function useFarmerMetrics(farmerId: string) {
  return useQuery({
    queryKey: ['farmerMetrics', farmerId],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [ordersToday, totalSales, productCount] = await Promise.all([
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('farmer_id', farmerId)
          .gte('placed_at', today.toISOString()),
        supabase
          .from('orders')
          .select('total')
          .eq('farmer_id', farmerId)
          .gte('placed_at', today.toISOString()),
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('farmer_id', farmerId),
      ]);

      const sales = (totalSales.data || []).reduce((s: number, o: any) => s + Number(o.total), 0);

      return {
        ordersToday: ordersToday.count || 0,
        salesToday: sales,
        totalProducts: productCount.count || 0,
      };
    },
    enabled: !!farmerId,
  });
}
