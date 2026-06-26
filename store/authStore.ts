import { create } from 'zustand';
import { User } from '../types';

interface AuthStore {
  user: User | null;
  role: 'buyer' | 'farmer' | null;
  isLoggedIn: boolean;
  login: (user: User, role: 'buyer' | 'farmer') => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  role: null,
  isLoggedIn: false,
  login: (user, role) => set({ user, role, isLoggedIn: true }),
  logout: () => set({ user: null, role: null, isLoggedIn: false }),
}));
