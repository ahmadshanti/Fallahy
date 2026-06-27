import Constants from 'expo-constants';

type Extra = {
  devAuthRole?: 'buyer' | 'farmer';
  devMode?: boolean;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

export const DEV_AUTH_ROLE: 'buyer' | 'farmer' | undefined = extra.devAuthRole;
// Dev mode is on whenever a specific role is chosen, OR the explicit dev-mode flag is set.
export const isDevMode: boolean = DEV_AUTH_ROLE !== undefined || extra.devMode === true;
// Backwards-compatible alias.
export const isDevAuthBypass: boolean = isDevMode;

export const DEV_BUYER_ID = '00000000-0000-4000-8000-000000000001';
export const DEV_FARMER_ID = '00000000-0000-4000-8000-000000000002';

// Loose shape — the v2 auth store accepts `any` for user, so we keep fields
// from both eras (full_name/avatar_url for v2 lookups, name/avatar for legacy UI).
export const devBuyerUser = {
  id: DEV_BUYER_ID,
  full_name: 'مستخدم تجريبي',
  name: 'مستخدم تجريبي',
  phone: '+970590000001',
  role: 'buyer' as const,
  avatar_url: 'https://i.pravatar.cc/200?img=47',
  avatar: 'https://i.pravatar.cc/200?img=47',
  city: 'رام الله',
  address: 'رام الله، شارع الإرسال',
};

export const devFarmerUser = {
  id: DEV_FARMER_ID,
  full_name: 'مزرعة أبو أحمد',
  name: 'مزرعة أبو أحمد',
  phone: '+970590000002',
  role: 'farmer' as const,
  avatar_url: 'https://i.pravatar.cc/200?img=12',
  avatar: 'https://i.pravatar.cc/200?img=12',
  city: 'جنين',
  address: 'جنين، سهل مرج بن عامر',
};

export function getDevUser() {
  if (DEV_AUTH_ROLE === 'buyer') return devBuyerUser;
  if (DEV_AUTH_ROLE === 'farmer') return devFarmerUser;
  return null;
}
