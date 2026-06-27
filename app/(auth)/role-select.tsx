import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';

export default function RoleSelectScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>أهلاً بك في من الأرض</Text>
        <Text style={styles.subtitle}>من الأرض لبيتك مباشرة</Text>
      </View>

      <View style={styles.bottom}>
        <Button
          title="إنشاء حساب جديد"
          onPress={() => router.push('/(auth)/register-buyer')}
          fullWidth
          size="lg"
        />
        <View style={{ height: spacing.sm }} />
        <Button
          title="تسجيل الدخول"
          onPress={() => router.push('/(auth)/login')}
          variant="outlined"
          fullWidth
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: spacing.lg,
    borderRadius: 24,
  },
  title: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 28,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
  },
  bottom: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
});
