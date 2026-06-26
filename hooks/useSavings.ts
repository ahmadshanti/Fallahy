import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useBuyerSavings(buyerId: string) {
  return useQuery({
    queryKey: ['buyerSavings', buyerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buyer_savings')
        .select('*')
        .eq('buyer_id', buyerId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      if (!data) {
        return {
          totalSaved: 0,
          totalOrders: 0,
          points: 0,
          rank: 'عضو جديد',
          nextRank: 'حارس الأرض',
          pointsToNext: 100,
        };
      }
      return {
        totalSaved: Number(data.total_saved),
        totalOrders: data.total_orders || 0,
        points: data.points || 0,
        rank: data.rank || 'عضو جديد',
        nextRank: getNextRank(data.rank),
        pointsToNext: getPointsToNext(data.points || 0),
      };
    },
    enabled: !!buyerId,
  });
}

function getNextRank(currentRank: string): string {
  const ranks = ['عضو جديد', 'حارس الأرض', 'فلاح الموسم', 'سفير الأرض'];
  const idx = ranks.indexOf(currentRank);
  return idx >= 0 && idx < ranks.length - 1 ? ranks[idx + 1] : ranks[ranks.length - 1];
}

function getPointsToNext(points: number): number {
  const thresholds = [100, 300, 500, 1000];
  for (const t of thresholds) {
    if (points < t) return t - points;
  }
  return 0;
}

export function usePriceTicker() {
  return useQuery({
    queryKey: ['priceTicker'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('name, retail_price, category')
        .gt('available', 0)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;

      const seen = new Set<string>();
      return (data || [])
        .filter((p: any) => {
          if (seen.has(p.name)) return false;
          seen.add(p.name);
          return true;
        })
        .map((p: any) => ({
          name: p.name,
          price: Number(p.retail_price),
          change: 'flat' as const,
          symbol: '₪',
        }));
    },
  });
}
