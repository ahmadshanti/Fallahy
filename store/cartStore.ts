import { create } from 'zustand';
import { Product, CartItem } from '../types';

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, qty: number, priceType: 'retail' | 'wholesale') => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  total: () => number;
  savings: () => number;
  clear: () => void;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  addItem: (product, qty, priceType) => {
    const items = get().items;
    const existing = items.find((i) => i.id === product.id && i.priceType === priceType);
    if (existing) {
      set({
        items: items.map((i) =>
          i.id === product.id && i.priceType === priceType
            ? { ...i, quantity: i.quantity + qty }
            : i
        ),
      });
    } else {
      set({ items: [...items, { id: product.id, product, quantity: qty, priceType }] });
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
  total: () =>
    get().items.reduce((sum, item) => {
      const price = item.priceType === 'wholesale' ? item.product.wholesalePrice : item.product.retailPrice;
      return sum + price * item.quantity;
    }, 0),
  savings: () =>
    get().items.reduce((sum, item) => {
      const price = item.priceType === 'wholesale' ? item.product.wholesalePrice : item.product.retailPrice;
      return sum + (item.product.marketPrice - price) * item.quantity;
    }, 0),
  clear: () => set({ items: [] }),
}));
