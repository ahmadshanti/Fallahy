import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_left' }}>
      <Stack.Screen name="splash" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="role-select" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register-buyer" />
      <Stack.Screen name="register-farmer" />
      <Stack.Screen name="dev-role" />
    </Stack>
  );
}
