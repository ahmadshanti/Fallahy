import { create } from 'zustand';

/**
 * In-memory orders for dev-mode buyers. The real `orders` table FKs to
 * `users(id)` for buyer_id and `farmers(id)` for farmer_id; neither dev
 * UUID exists, so the real insert violates the constraint.
 */
export interface DevOrder {
  id: string;
  buyer_id: string;
  farmer_id: string;
  total_price: number;
  delivery_address?: string;
  notes?: string;
  status: string;
  created_at: string;
  items: Array<{
    product_id: string;
    product_name?: string;
    quantity: number;
    unit_price: number;
    sale_type: string;
  }>;
}

interface DevOrdersStore {
  orders: DevOrder[];
  create: (order: Omit<DevOrder, 'id' | 'status' | 'created_at'>) => DevOrder;
  reset: () => void;
}

export const useDevOrdersStore = create<DevOrdersStore>((set, get) => ({
  orders: [],
  create: (order) => {
    const row: DevOrder = {
      ...order,
      id: `dev-order-${Date.now()}`,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    set({ orders: [row, ...get().orders] });
    return row;
  },
  reset: () => set({ orders: [] }),
}));
