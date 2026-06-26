import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/authStore';

export default function Index() {
  const { isLoggedIn, role } = useAuthStore();

  if (!isLoggedIn) {
    return <Redirect href="/(auth)/splash" />;
  }

  if (role === 'farmer') {
    return <Redirect href="/(farmer)" />;
  }

  return <Redirect href="/(buyer)" />;
}
