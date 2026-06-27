import { useMemo } from 'react';
import { Product } from '../types';
import { useProducts } from './useProducts';
import { usePriceTicker } from './useSavings';

/**
 * "Featured" products for the buyer home.
 *
 * Ranking (best signal first):
 *   1. If the live price ticker (from Rwan's analytics service) is available,
 *      products whose crop is currently "down" in the ticker get a boost —
 *      these are the real-time deals.
 *   2. Then sort by the static savings percentage (market vs Fallahy price).
 *   3. Tie-break by freshness (`isFresh`).
 *
 * This is what powers the "أفضل العروض" section on the buyer home, replacing
 * the previous "Most ordered" label which was misleading (it was actually
 * sorted by created_at).
 */
export function useTrendingProducts(limit = 10) {
  const products = useProducts();
  const ticker = usePriceTicker();

  const sorted = useMemo<Product[]>(() => {
    const list = [...(products.data ?? [])];
    const downSet = new Set(
      (ticker.data ?? []).filter((t) => t.change === 'down').map((t) => t.name)
    );

    list.sort((a, b) => {
      const aHot = downSet.has(a.name) ? 1 : 0;
      const bHot = downSet.has(b.name) ? 1 : 0;
      if (aHot !== bHot) return bHot - aHot;
      if (a.savings !== b.savings) return b.savings - a.savings;
      if (a.isFresh !== b.isFresh) return (b.isFresh ? 1 : 0) - (a.isFresh ? 1 : 0);
      return 0;
    });
    return list.slice(0, limit);
  }, [products.data, ticker.data, limit]);

  return {
    data: sorted,
    isLoading: products.isLoading,
    /** "live" once we got real ticker data, else "static" (just savings-based). */
    rankingSource: (ticker.data && ticker.data.length > 0 ? 'live' : 'static') as 'live' | 'static',
  };
}
