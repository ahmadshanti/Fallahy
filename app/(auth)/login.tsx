import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (phone.length < 9) {
      Alert.alert('تنبيه', 'يرجى إدخال رقم هاتف صحيح');
      return;
    }
    setLoading(true);
    Keyboard.dismiss();

    try {
      // Search for user by phone number
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`phone.ilike.%${phone}%,phone.ilike.%${phone.replace(/^0/, '')}%`)
        .limit(1);

      if (error) {
        Alert.alert('خطأ', error.message);
        setLoading(false);
        return;
      }

      if (!profiles || profiles.length === 0) {
        Alert.alert(
          'الحساب غير موجود',
          'لم نعثر على حساب بهذا الرقم. هل تريد إنشاء حساب جديد؟',
          [
            { text: 'إنشاء حساب', onPress: () => router.push('/(auth)/register-buyer') },
            { text: 'إلغاء', style: 'cancel' },
          ]
        );
        setLoading(false);
        return;
      }

      const profile = profiles[0];

      // Sign in anonymously and link to this profile
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
      if (authError) {
        Alert.alert('خطأ', authError.message);
        setLoading(false);
        return;
      }

      // Update the anonymous user to point to this profile
      if (authData.user) {
        await supabase.from('profiles').upsert({
          id: authData.user.id,
          name: profile.name,
          phone: profile.phone,
          city: profile.city,
          address: profile.address,
          role: profile.role,
          avatar_url: profile.avatar_url,
          farm_name: profile.farm_name,
          specialty: profile.specialty,
        });
      }

      const userRole = (profile.role as 'buyer' | 'farmer') || 'buyer';
      login(
        {
          id: authData.user?.id || profile.id,
          name: profile.name,
          phone: profile.phone || '',
          role: userRole,
          avatar: profile.avatar_url,
          city: profile.city,
          address: profile.address,
        },
        userRole
      );

      if (userRole === 'farmer') {
        router.replace('/(farmer)');
      } else {
        router.replace('/(buyer)');
      }
    } catch (err: any) {
      Alert.alert('خطأ', err?.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>تسجيل الدخول</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.iconContainer}>
              <Ionicons name="person-outline" size={50} color={colors.primary} />
            </View>

            <Text style={styles.title}>مرحباً بعودتك</Text>
            <Text style={styles.subtitle}>أدخل رقم هاتفك المسجّل عندنا</Text>

            <View style={styles.form}>
              <Input
                label="رقم الهاتف"
                value={phone}
                onChangeText={setPhone}
                placeholder="مثال: 591234567"
                keyboardType="phone-pad"
                autoFocus
              />
            </View>
          </ScrollView>

          <View style={styles.bottom}>
            <Button
              title="تسجيل الدخول"
              onPress={handleLogin}
              fullWidth
              size="lg"
              loading={loading}
              disabled={phone.length < 9}
            />
            <TouchableOpacity onPress={() => router.push('/(auth)/register-buyer')} style={styles.linkBtn}>
              <Text style={styles.linkText}>ما عندك حساب؟ سجّل الآن</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  headerTitle: { fontFamily: 'Cairo_700Bold', fontSize: 18, color: colors.textPrimary },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.lg },
  iconContainer: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#E8F5E1', alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: spacing.lg,
  },
  title: {
    fontFamily: 'Cairo_700Bold', fontSize: 26, color: colors.textPrimary,
    textAlign: 'center', marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: 'Cairo_400Regular', fontSize: 15, color: colors.textMuted,
    textAlign: 'center', marginBottom: spacing.xl,
  },
  form: { width: '100%' },
  bottom: {
    paddingHorizontal: spacing.lg, paddingBottom: spacing.lg,
  },
  linkBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  linkText: {
    fontFamily: 'Cairo_600SemiBold', fontSize: 15, color: colors.primary,
  },
});
