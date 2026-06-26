import { create } from 'zustand';

interface UserStore {
  city: string;
  address: string;
  setCity: (city: string) => void;
  setAddress: (address: string) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  city: 'رام الله',
  address: 'شارع الإرسال',
  setCity: (city) => set({ city }),
  setAddress: (address) => set({ address }),
}));
