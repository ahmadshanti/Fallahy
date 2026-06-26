import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
        <View style={styles.iconContainer}>
          <Ionicons name="leaf" size={60} color={colors.primary} />
        </View>
        <Text style={styles.title}>أهلاً بك في فلاحي</Text>
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
          title="عندي حساب — تسجيل دخول"
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
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
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
