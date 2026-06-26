import { create } from 'zustand';
import { Product } from '../types';

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  saleType: 'retail' | 'wholesale';
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, qty: number, saleType: 'retail' | 'wholesale') => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  getTotal: () => number;
  getFarmerId: () => string | null;
  clear: () => void;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  addItem: (product, qty, saleType) => {
    const items = get().items;
    const existing = items.find((i) => i.id === product.id && i.saleType === saleType);
    if (existing) {
      set({
        items: items.map((i) =>
          i.id === product.id && i.saleType === saleType
            ? { ...i, quantity: i.quantity + qty }
            : i
        ),
      });
    } else {
      set({ items: [...items, { id: product.id, product, quantity: qty, saleType }] });
    }
  },

  removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),

  updateQty: (id, qty) => {
    if (qty <= 0) {
      set({ items: get().items.filter((i) => i.id !== id) });
    } else {
      set({ items: get().items.map((i) => (i.id === id ? { ...i, quantity: qty } : i)) });
    }
  },

  getTotal: () =>
    get().items.reduce((sum, item) => {
      const price = item.saleType === 'wholesale'
        ? (item.product.wholesale_price || 0)
        : (item.product.retail_price || 0);
      return sum + price * item.quantity;
    }, 0),

  getFarmerId: () => {
    const items = get().items;
    return items.length > 0 ? items[0].product.farmer_id : null;
  },

  clear: () => set({ items: [] }),
}));
