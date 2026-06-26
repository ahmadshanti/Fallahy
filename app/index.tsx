import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { ActivityIndicator, View } from 'react-native';
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

  if (!isLoggedIn) {
    return <Redirect href="/(auth)/splash" />;
  }

  if (role === 'farmer') {
    return <Redirect href="/(farmer)" />;
  }

  return <Redirect href="/(buyer)" />;
}
