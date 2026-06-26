import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { getFarmerByUserId } from '../lib/farmers';

interface AuthState {
  userId: string | null;
  buyerId: string | null;
  farmerId: string | null;
  role: 'buyer' | 'farmer' | null;
  user: any;
  farmer: any;
  isLoggedIn: boolean;
  isLoading: boolean;
  initialize: () => Promise<void>;
  loginAsBuyer: (userData: any) => void;
  loginAsFarmer: (userData: any, farmerData: any) => void;
  logout: () => Promise<void>;
  updateUser: (updates: Record<string, any>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  userId: null,
  buyerId: null,
  farmerId: null,
  role: null,
  user: null,
  farmer: null,
  isLoggedIn: false,
  isLoading: true,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        set({ isLoading: false });
        return;
      }

      const authUserId = session.user.id;

      // Check if farmer
      const farmerData = await getFarmerByUserId(authUserId);
      if (farmerData) {
        set({
          userId: authUserId,
          farmerId: farmerData.id,
          role: 'farmer',
          farmer: farmerData,
          user: { id: authUserId, full_name: farmerData.owner_name, phone: farmerData.whatsapp_number },
          isLoggedIn: true,
          isLoading: false,
        });
        return;
      }

      // Check if buyer
      const { data: buyerData } = await supabase
        .from('users')
        .select('*')
        .eq('phone', session.user.phone || '')
        .maybeSingle();

      if (buyerData) {
        set({
          userId: authUserId,
          buyerId: buyerData.id,
          role: 'buyer',
          user: buyerData,
          isLoggedIn: true,
          isLoading: false,
        });
        return;
      }

      set({ isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  loginAsBuyer: (userData) => set({
    userId: userData.id,
    buyerId: userData.id,
    role: 'buyer',
    user: userData,
    isLoggedIn: true,
    isLoading: false,
  }),

  loginAsFarmer: (userData, farmerData) => set({
    userId: userData.id,
    farmerId: farmerData.id,
    role: 'farmer',
    user: userData,
    farmer: farmerData,
    isLoggedIn: true,
    isLoading: false,
  }),

  logout: async () => {
    await supabase.auth.signOut();
    set({
      userId: null, buyerId: null, farmerId: null,
      role: null, user: null, farmer: null,
      isLoggedIn: false,
    });
  },

  updateUser: (updates) => {
    const current = get().user;
    if (current) set({ user: { ...current, ...updates } });
  },
}));
