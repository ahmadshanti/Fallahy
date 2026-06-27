import { create } from 'zustand';
import { Tree } from '../types';

/**
 * In-memory trees added by the farmer during a dev-mode session.
 * Mirrors devProductsStore — the dev farmer UUID isn't a real row in the
 * `farmers` table so insert into `trees` (which has a NOT NULL FK to farmer_id)
 * fails. We save to local zustand instead.
 */
interface DevFarmerTreesStore {
  created: Tree[];
  add: (t: Tree) => void;
  remove: (id: string) => void;
  reset: () => void;
}

export const useDevFarmerTreesStore = create<DevFarmerTreesStore>((set, get) => ({
  created: [],
  add: (t) => set({ created: [t, ...get().created] }),
  remove: (id) => set({ created: get().created.filter((t) => t.id !== id) }),
  reset: () => set({ created: [] }),
}));
