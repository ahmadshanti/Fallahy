import { create } from 'zustand';

interface ToastStore {
  message: string | null;
  show: (msg: string) => void;
  hide: () => void;
}

let timer: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastStore>((set) => ({
  message: null,
  show: (msg) => {
    if (timer) clearTimeout(timer);
    set({ message: msg });
    timer = setTimeout(() => set({ message: null }), 1800);
  },
  hide: () => {
    if (timer) clearTimeout(timer);
    set({ message: null });
  },
}));
