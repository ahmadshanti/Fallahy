import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard,
  ScrollView, ActivityIndicator,
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
  const { loginAsBuyer, loginAsFarmer } = useAuthStore();
  const [step, setStep] = useState<'info' | 'otp'>('info');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [foundAccount, setFoundAccount] = useState<{ type: 'buyer' | 'farmer'; data: any } | null>(null);
  const otpRefs = useRef<(TextInput | null)[]>([]);

  const handleFindAccount = async () => {
    if (!name.trim() || phone.length < 7) return;
    setLoading(true);
    Keyboard.dismiss();

    try {
      const cleanPhone = phone.replace(/^0+/, '');

      // Search farmers table by whatsapp_number
      const { data: farmers, error: farmerError } = await supabase
        .from('farmers')
        .select('*')
        .or(`whatsapp_number.ilike.%${cleanPhone}%`)
        .limit(5);

      if (farmerError) {
        Alert.alert('خطأ', farmerError.message);
        setLoading(false);
        return;
      }

      if (farmers && farmers.length > 0) {
        // Found in farmers table
        setFoundAccount({ type: 'farmer', data: farmers[0] });
        setStep('otp');
        setLoading(false);
        return;
      }

      // Search users table by phone
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('*')
        .or(`phone.ilike.%${cleanPhone}%`)
        .limit(5);

      if (userError) {
        Alert.alert('خطأ', userError.message);
        setLoading(false);
        return;
      }

      if (users && users.length > 0) {
        // Found in users table
        setFoundAccount({ type: 'buyer', data: users[0] });
        setStep('otp');
        setLoading(false);
        return;
      }

      // Not found
      Alert.alert(
        'الحساب غير موجود',
        'لم نعثر على حساب بهذا الرقم.',
        [
          { text: 'إنشاء حساب', onPress: () => router.push('/(auth)/register-buyer') },
          { text: 'حاول مرة أخرى', style: 'cancel' },
        ]
      );
    } catch (err: any) {
      Alert.alert('خطأ', err?.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code !== '0000') {
      Alert.alert('خطأ', 'رمز التحقق غير صحيح');
      return;
    }

    if (!foundAccount) return;
    setLoading(true);

    try {
      // Sign in anonymously via Supabase auth
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
      if (authError) {
        Alert.alert('خطأ', authError.message);
        setLoading(false);
        return;
      }

      const authUserId = authData.user?.id;
      if (!authUserId) {
        Alert.alert('خطأ', 'فشل تسجيل الدخول');
        setLoading(false);
        return;
      }

      if (foundAccount.type === 'farmer') {
        const farmerData = foundAccount.data;
        // Update farmer's user_id if not set
        if (!farmerData.user_id) {
          await supabase
            .from('farmers')
            .update({ user_id: authUserId })
            .eq('id', farmerData.id);
        }

        loginAsFarmer(
          { id: authUserId, full_name: farmerData.owner_name, phone: farmerData.whatsapp_number },
          farmerData
        );
        router.replace('/(farmer)');
      } else {
        const userData = foundAccount.data;
        loginAsBuyer(userData);
        router.replace('/(buyer)');
      }
    } catch (err: any) {
      Alert.alert('خطأ', err?.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => step === 'otp' ? setStep('info') : router.back()}>
              <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>تسجيل الدخول</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {step === 'info' ? (
              <>
                <View style={styles.iconContainer}>
                  <Ionicons name="log-in-outline" size={45} color={colors.primary} />
                </View>
                <Text style={styles.title}>مرحباً بعودتك</Text>
                <Text style={styles.subtitle}>أدخل اسمك ورقم هاتفك المسجّل</Text>
                <View style={styles.form}>
                  <Input label="الاسم" value={name} onChangeText={setName} placeholder="الاسم اللي سجّلت فيه" autoFocus />
                  <Input label="رقم الهاتف" value={phone} onChangeText={setPhone} placeholder="مثال: 591234567" keyboardType="phone-pad" />
                </View>
              </>
            ) : (
              <>
                <View style={styles.iconContainer}>
                  <Ionicons name="shield-checkmark-outline" size={45} color={colors.primary} />
                </View>
                <Text style={styles.title}>التحقق من الحساب</Text>
                <Text style={styles.subtitle}>أدخل رمز التحقق 0000</Text>
                <View style={styles.otpRow}>
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => { otpRefs.current[index] = ref; }}
                      style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                      value={digit}
                      onChangeText={(text) => handleOtpChange(text, index)}
                      onKeyPress={({ nativeEvent }) => handleOtpKeyPress(index, nativeEvent.key)}
                      keyboardType="number-pad"
                      maxLength={1}
                      textAlign="center"
                      autoFocus={index === 0}
                    />
                  ))}
                </View>
                <Text style={styles.hint}>رمز التحقق المؤقت: 0000</Text>
              </>
            )}
          </ScrollView>

          <View style={styles.bottom}>
            <Button
              title={step === 'info' ? 'التالي' : 'تسجيل الدخول'}
              onPress={step === 'info' ? handleFindAccount : handleVerifyOtp}
              fullWidth
              size="lg"
              loading={loading}
              disabled={step === 'info' ? (!name.trim() || phone.length < 7) : otp.join('').length < 4}
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
    width: 85, height: 85, borderRadius: 42,
    backgroundColor: '#E8F5E1', alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: spacing.lg,
  },
  title: {
    fontFamily: 'Cairo_700Bold', fontSize: 24, color: colors.textPrimary,
    textAlign: 'center', marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: 'Cairo_400Regular', fontSize: 14, color: colors.textMuted,
    textAlign: 'center', marginBottom: spacing.xl,
  },
  form: { width: '100%' },
  otpRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 14, marginBottom: spacing.md,
  },
  otpBox: {
    width: 58, height: 58, borderRadius: radius.lg,
    borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.surface, fontFamily: 'Cairo_700Bold',
    fontSize: 26, color: colors.textPrimary,
  },
  otpBoxFilled: {
    borderColor: colors.primary, backgroundColor: '#F5F9F2',
  },
  hint: {
    fontFamily: 'Cairo_400Regular', fontSize: 13, color: colors.textMuted,
    textAlign: 'center', marginBottom: spacing.md,
  },
  bottom: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  linkBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  linkText: { fontFamily: 'Cairo_600SemiBold', fontSize: 15, color: colors.primary },
});
