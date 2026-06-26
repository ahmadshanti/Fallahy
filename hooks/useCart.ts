import { useCartStore } from '../store/cartStore';

export function useCart() {
  const store = useCartStore();
  return {
    items: store.items,
    addItem: store.addItem,
    removeItem: store.removeItem,
    updateQty: store.updateQty,
    total: store.total(),
    savings: store.savings(),
    clear: store.clear,
    itemCount: store.items.reduce((sum, i) => sum + i.quantity, 0),
  };
}
