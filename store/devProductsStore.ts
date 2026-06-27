import { create } from 'zustand';
import { Product } from '../types';

/**
 * In-memory products created or edited during a dev-mode session.
 * Persists only for the duration of the JS bundle (not AsyncStorage)
 * so each demo run starts clean. Use this whenever isDevMode is true
 * to make add/edit feel real without touching Supabase.
 */
interface DevProductsStore {
  /** Products the farmer added during this session. */
  created: Product[];
  /** Overrides keyed by product id (for edits to mock or session products). */
  overrides: Record<string, Partial<Product>>;
  addProduct: (p: Product) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  reset: () => void;
}

export const useDevProductsStore = create<DevProductsStore>((set, get) => ({
  created: [],
  overrides: {},
  addProduct: (p) => set({ created: [p, ...get().created] }),
  updateProduct: (id, patch) => {
    // If it's a session-created product, mutate in place.
    const inCreated = get().created.find((p) => p.id === id);
    if (inCreated) {
      set({
        created: get().created.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      });
      return;
    }
    set({ overrides: { ...get().overrides, [id]: { ...(get().overrides[id] ?? {}), ...patch } } });
  },
  reset: () => set({ created: [], overrides: {} }),
}));

/** Apply session overrides to a server / mock product list. */
export function applyDevOverrides(products: Product[]): Product[] {
  const { created, overrides } = useDevProductsStore.getState();
  const overridden = products.map((p) => (overrides[p.id] ? { ...p, ...overrides[p.id] } : p));
  return [...created, ...overridden];
}
