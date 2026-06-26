import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Keyboard,
  TouchableWithoutFeedback, Modal, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';

const countryCodes = [
  { code: '+970', flag: '🇵🇸', name: 'فلسطين' },
  { code: '+962', flag: '🇯🇴', name: 'الأردن' },
  { code: '+966', flag: '🇸🇦', name: 'السعودية' },
  { code: '+971', flag: '🇦🇪', name: 'الإمارات' },
  { code: '+961', flag: '🇱🇧', name: 'لبنان' },
  { code: '+20', flag: '🇪🇬', name: 'مصر' },
  { code: '+964', flag: '🇮🇶', name: 'العراق' },
  { code: '+968', flag: '🇴🇲', name: 'عُمان' },
  { code: '+974', flag: '🇶🇦', name: 'قطر' },
  { code: '+965', flag: '🇰🇼', name: 'الكويت' },
  { code: '+973', flag: '🇧🇭', name: 'البحرين' },
  { code: '+90', flag: '🇹🇷', name: 'تركيا' },
  { code: '+1', flag: '🇺🇸', name: 'أمريكا' },
];

export default function LoginScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role: string }>();
  const login = useAuthStore((s) => s.login);
  const [phone, setPhone] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countryCodes[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const otpRefs = useRef<(TextInput | null)[]>([]);

  const handleSendOTP = () => {
    if (phone.length >= 9) {
      Keyboard.dismiss();
      setShowOTP(true);
    }
  };

  const handleVerify = () => {
    setLoading(true);
    Keyboard.dismiss();
    setTimeout(() => {
      const userRole = (role === 'farmer' ? 'farmer' : 'buyer') as 'buyer' | 'farmer';
      login(
        {
          id: '1',
          name: userRole === 'farmer' ? 'مزرعة أبو أحمد' : 'أحمد محمد',
          phone: `${selectedCountry.code}${phone}`,
          role: userRole,
        },
        userRole
      );
      setLoading(false);
      if (userRole === 'farmer') {
        router.replace('/(farmer)');
      } else {
        router.replace('/(buyer)');
      }
    }, 1000);
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
