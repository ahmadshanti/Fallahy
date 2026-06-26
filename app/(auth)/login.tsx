import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Keyboard,
  TouchableWithoutFeedback, Modal, FlatList, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { supabase } from '../../lib/supabase';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';

const countryCodes = [
  { code: '+970', flag: '\u{1F1F5}\u{1F1F8}', name: 'فلسطين' },
  { code: '+962', flag: '\u{1F1EF}\u{1F1F4}', name: 'الأردن' },
  { code: '+966', flag: '\u{1F1F8}\u{1F1E6}', name: 'السعودية' },
  { code: '+971', flag: '\u{1F1E6}\u{1F1EA}', name: 'الإمارات' },
  { code: '+961', flag: '\u{1F1F1}\u{1F1E7}', name: 'لبنان' },
  { code: '+20', flag: '\u{1F1EA}\u{1F1EC}', name: 'مصر' },
  { code: '+964', flag: '\u{1F1EE}\u{1F1F6}', name: 'العراق' },
  { code: '+968', flag: '\u{1F1F4}\u{1F1F2}', name: 'عُمان' },
  { code: '+974', flag: '\u{1F1F6}\u{1F1E6}', name: 'قطر' },
  { code: '+965', flag: '\u{1F1F0}\u{1F1FC}', name: 'الكويت' },
  { code: '+973', flag: '\u{1F1E7}\u{1F1ED}', name: 'البحرين' },
  { code: '+90', flag: '\u{1F1F9}\u{1F1F7}', name: 'تركيا' },
  { code: '+1', flag: '\u{1F1FA}\u{1F1F8}', name: 'أمريكا' },
];

export default function LoginScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role: string }>();
  const login = useAuthStore((s) => s.login);
  const { sendOtp, verifyOtp, getProfile } = useSupabaseAuth();
  const [phone, setPhone] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countryCodes[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const otpRefs = useRef<(TextInput | null)[]>([]);

  const fullPhone = `${selectedCountry.code}${phone}`;

  const handleSendOTP = async () => {
    if (phone.length < 9) return;
    Keyboard.dismiss();
    setSendingOtp(true);
    try {
      // Note: Supabase phone OTP requires an SMS provider (e.g., Twilio) to be configured.
      // For testing, you can add test phone numbers in the Supabase dashboard under
      // Authentication > Phone Auth > Test Phone Numbers.
      const { error } = await sendOtp(fullPhone);
      if (error) {
        Alert.alert('خطأ', error.message);
      } else {
        setShowOTP(true);
      }
    } catch (err: any) {
      Alert.alert('خطأ', err?.message || 'حدث خطأ في إرسال رمز التحقق');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    setLoading(true);
    Keyboard.dismiss();
    try {
      const userRole = (role === 'farmer' ? 'farmer' : 'buyer') as 'buyer' | 'farmer';

      // Dev shortcut: OTP "1234" creates a real Supabase account using email auth
      if (otpCode === '1234') {
        const devEmail = `${phone.replace(/\D/g, '')}@example.com`;
        const devPassword = `fallahy_${phone}`;

        // Try sign in first, then sign up if new user
        let session = null;
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: devEmail,
          password: devPassword,
        });

        if (signInData?.session) {
          session = signInData.session;
        } else {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: devEmail,
            password: devPassword,
            options: { data: { name: '', role: userRole, phone: fullPhone } },
          });
          if (signUpError) {
            Alert.alert('خطأ', signUpError.message);
            setLoading(false);
            return;
          }
          session = signUpData?.session;
        }

        if (session?.user) {
          const { data: profile } = await getProfile(session.user.id);
          if (profile?.name) {
            login({ id: profile.id, name: profile.name, phone: profile.phone || fullPhone, role: profile.role as 'buyer' | 'farmer', avatar: profile.avatar_url, city: profile.city, address: profile.address }, profile.role as 'buyer' | 'farmer');
            setLoading(false);
            router.replace(profile.role === 'farmer' ? '/(farmer)' : '/(buyer)');
          } else {
            login({ id: session.user.id, name: '', phone: fullPhone, role: userRole }, userRole);
            setLoading(false);
            router.push(userRole === 'farmer' ? '/(auth)/register-farmer' : '/(auth)/register-buyer');
          }
        } else {
          Alert.alert('خطأ', 'فشل إنشاء الحساب');
          setLoading(false);
        }
        return;
      }

      const { data, error } = await verifyOtp(fullPhone, otpCode);
      if (error) {
        Alert.alert('خطأ', error.message);
        setLoading(false);
        return;
      }

      const session = data?.session;
      if (!session?.user) {
        Alert.alert('خطأ', 'فشل التحقق، يرجى المحاولة مرة أخرى');
        setLoading(false);
        return;
      }

      // Check if the user already has a profile
      const { data: profile } = await getProfile(session.user.id);

      if (profile?.name) {
        // Existing user with a complete profile
        const existingRole = (profile.role as 'buyer' | 'farmer') || userRole;
        login(
          {
            id: profile.id,
            name: profile.name,
            phone: profile.phone || fullPhone,
            role: existingRole,
            avatar: profile.avatar_url,
            city: profile.city,
            address: profile.address,
          },
          existingRole
        );
        setLoading(false);
        if (existingRole === 'farmer') {
          router.replace('/(farmer)');
        } else {
          router.replace('/(buyer)');
        }
      } else {
        // New user — navigate to registration screen
        setLoading(false);
        if (userRole === 'farmer') {
          router.push('/(auth)/register-farmer');
        } else {
          router.push('/(auth)/register-buyer');
        }
      }
    } catch (err: any) {
      Alert.alert('خطأ', err?.message || 'حدث خطأ في التحقق');
      setLoading(false);
    }
  };

  const handleOTPChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <Ionicons name="leaf" size={48} color={colors.primary} style={styles.logo} />
              <Text style={styles.title}>مرحباً بك</Text>

              <View style={styles.phoneRow}>
                <View style={styles.phoneInput}>
                  <TextInput
                    style={styles.input}
                    placeholder="رقم الهاتف"
                    placeholderTextColor={colors.textMuted}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    textAlign="right"
                    maxLength={10}
                  />
                </View>
                <TouchableOpacity
                  style={styles.countryCode}
                  onPress={() => setShowCountryPicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.countryCodeText}>
                    {selectedCountry.flag} {selectedCountry.code}
                  </Text>
                  <Text style={styles.chevron}>▼</Text>
                </TouchableOpacity>
              </View>

              {!showOTP ? (
                <Button
                  title="إرسال رمز التحقق"
                  onPress={handleSendOTP}
                  fullWidth
                  size="lg"
                  disabled={phone.length < 9}
                  loading={sendingOtp}
                />
              ) : (
                <>
                  <Text style={styles.otpLabel}>أدخل رمز التحقق</Text>
                  <View style={styles.otpRow}>
                    {otp.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={(ref) => { otpRefs.current[index] = ref; }}
                        style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                        value={digit}
                        onChangeText={(text) => handleOTPChange(text, index)}
                        onKeyPress={({ nativeEvent }) => handleOTPKeyPress(index, nativeEvent.key)}
                        keyboardType="number-pad"
                        maxLength={1}
                        textAlign="center"
                      />
                    ))}
                  </View>
                  <Button
                    title="تحقق"
                    onPress={handleVerify}
                    fullWidth
                    size="lg"
                    loading={loading}
                  />
                </>
              )}

              <Text
                style={styles.link}
                onPress={() => {
                  if (role === 'farmer') {
                    router.push('/(auth)/register-farmer');
                  } else {
                    router.push('/(auth)/register-buyer');
                  }
                }}
              >
                تسجيل حساب جديد
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      {/* Country Code Picker Modal */}
      <Modal visible={showCountryPicker} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowCountryPicker(false)}>
          <View style={styles.modalBackdrop} />
        </TouchableWithoutFeedback>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>اختر رمز الدولة</Text>
          <FlatList
            data={countryCodes}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.countryItem,
                  selectedCountry.code === item.code && styles.countryItemSelected,
                ]}
                onPress={() => {
                  setSelectedCountry(item);
                  setShowCountryPicker(false);
                }}
              >
                <Text style={styles.countryItemCode}>{item.code}</Text>
                <View style={styles.countryItemRight}>
                  <Text style={styles.countryItemName}>{item.name}</Text>
                  <Text style={styles.countryItemFlag}>{item.flag}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  logo: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 28,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  phoneRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: colors.surfaceDim,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  input: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 16,
    color: colors.textPrimary,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceDim,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    height: 52,
    paddingHorizontal: spacing.md,
    gap: 6,
  },
  countryCodeText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
  },
  chevron: {
    fontSize: 10,
    color: colors.textMuted,
  },
  otpLabel: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: spacing.lg,
  },
  otpBox: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    fontFamily: 'Cairo_700Bold',
    fontSize: 24,
    color: colors.textPrimary,
  },
  otpBoxFilled: {
    borderColor: colors.primary,
    backgroundColor: '#F5F9F2',
  },
  link: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 15,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
    paddingBottom: 34,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  modalTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  countryItemSelected: {
    backgroundColor: '#F5F9F2',
  },
  countryItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  countryItemFlag: {
    fontSize: 24,
  },
  countryItemName: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 16,
    color: colors.textPrimary,
  },
  countryItemCode: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 15,
    color: colors.textMuted,
  },
});
