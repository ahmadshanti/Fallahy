import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';

export default function LoginScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role: string }>();
  const login = useAuthStore((s) => s.login);
  const [phone, setPhone] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);

  const handleSendOTP = () => {
    if (phone.length >= 9) {
      setShowOTP(true);
    }
  };

  const handleVerify = () => {
    setLoading(true);
    setTimeout(() => {
      const userRole = (role === 'farmer' ? 'farmer' : 'buyer') as 'buyer' | 'farmer';
      login(
        {
          id: '1',
          name: userRole === 'farmer' ? 'مزرعة أبو أحمد' : 'أحمد محمد',
          phone: `+970${phone}`,
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
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>🌿</Text>
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
          <View style={styles.countryCode}>
            <Text style={styles.countryCodeText}>970+</Text>
          </View>
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
                  style={styles.otpBox}
                  value={digit}
                  onChangeText={(text) => handleOTPChange(text, index)}
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

        <TouchableText
          text="تسجيل حساب جديد"
          onPress={() => {
            if (role === 'farmer') {
              router.push('/(auth)/register-farmer');
            } else {
              router.push('/(auth)/register-buyer');
            }
          }}
        />
      </View>
    </SafeAreaView>
  );
}

function TouchableText({ text, onPress }: { text: string; onPress: () => void }) {
  return (
    <Text style={styles.link} onPress={onPress}>
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
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
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  input: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 16,
    color: colors.textPrimary,
  },
  countryCode: {
    backgroundColor: colors.surfaceDim,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    height: 48,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  countryCodeText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
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
  link: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 15,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
