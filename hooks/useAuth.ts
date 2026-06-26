import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const { user, role, isLoggedIn, login, logout } = useAuthStore();
  return { user, role, isLoggedIn, login, logout };
}
