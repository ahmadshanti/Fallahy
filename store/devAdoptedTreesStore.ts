import { create } from 'zustand';
import { AdoptedTree, Tree } from '../types';

/**
 * In-memory adopted trees for dev-mode sessions. Mirrors the pattern in
 * devProductsStore — keeps "adopt" working in demo even though the dev user
 * UUIDs aren't real rows in Supabase (so DB foreign-key constraints fail).
 */
interface DevAdoptedTreesStore {
  adopted: AdoptedTree[];
  adopt: (tree: Tree, buyerId: string, customName: string) => void;
  reset: () => void;
}

export const useDevAdoptedTreesStore = create<DevAdoptedTreesStore>((set, get) => ({
  adopted: [],
  adopt: (tree, buyerId, customName) => {
    const now = new Date();
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    const row: AdoptedTree = {
      id: `dev-${Date.now()}`,
      tree_id: tree.id,
      buyer_id: buyerId,
      custom_name: customName,
      adopted_at: now.toISOString(),
      expires_at: expires.toISOString(),
      status: 'active',
      trees: {
        ...tree,
        farmers: tree.farmers
          ? { farm_name: tree.farmers.farm_name, city: tree.farmers.city }
          : undefined,
      },
    };
    set({ adopted: [row, ...get().adopted] });
  },
  reset: () => set({ adopted: [] }),
}));
