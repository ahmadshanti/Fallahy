import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { isDevMode } from '../lib/devMode';
import { colors } from '../constants/colors';

export default function Index() {
  const { isLoggedIn, role, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // DEV MODE: skip splash/onboarding/login and go straight to a
  // "Login as buyer / Login as farmer" picker. Toggle by setting/removing
  // EXPO_PUBLIC_DEV_MODE=true in .env (restart Metro after changing it).
  if (!isLoggedIn && isDevMode) {
    return <Redirect href="/(auth)/dev-role" />;
  }

  if (!isLoggedIn) {
    return <Redirect href="/(auth)/splash" />;
  }

  if (role === 'farmer') {
    return <Redirect href="/(farmer)" />;
  }

  return <Redirect href="/(buyer)" />;
}
