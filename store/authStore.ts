import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface AuthStore {
  user: User | null;
  role: 'buyer' | 'farmer' | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  initialize: () => Promise<void>;
  login: (user: User, role: 'buyer' | 'farmer') => void;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  role: null,
  isLoggedIn: false,
  isLoading: true,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          const user: User = {
            id: profile.id,
            name: profile.name,
            phone: profile.phone || '',
            avatar: profile.avatar_url,
            role: profile.role as 'buyer' | 'farmer',
            city: profile.city,
            address: profile.address,
          };
          set({ user, role: profile.role as 'buyer' | 'farmer', isLoggedIn: true, isLoading: false });
          return;
        }
      }
      set({ isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  login: (user, role) => set({ user, role, isLoggedIn: true, isLoading: false }),

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, role: null, isLoggedIn: false });
  },

  updateUser: (updates) => {
    const current = get().user;
    if (current) {
      set({ user: { ...current, ...updates } });
    }
  },
}));
