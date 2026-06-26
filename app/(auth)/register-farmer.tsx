import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';

const specialties = ['خضار', 'فواكه', 'زيوت', 'أعشاب'];

export default function RegisterFarmerScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [farmName, setFarmName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [city, setCity] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [idDoc, setIdDoc] = useState<string | null>(null);

  const toggleSpecialty = (s: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled) {
      setIdDoc(result.assets[0].uri);
    }
  };

  const handleRegister = () => {
    login(
      { id: 'f1', name: farmName, phone: '+970591234567', role: 'farmer', city },
      'farmer'
    );
    router.replace('/(farmer)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>تسجيل مزرعة جديدة</Text>

        <Input label="اسم المزرعة" value={farmName} onChangeText={setFarmName} placeholder="مثال: مزرعة أبو أحمد" />
        <Input label="اسم المالك" value={ownerName} onChangeText={setOwnerName} placeholder="الاسم الكامل" />
        <Input label="المدينة" value={city} onChangeText={setCity} placeholder="المدينة أو القرية" />

        <View style={styles.fieldWrapper}>
          <Text style={styles.label}>التخصص</Text>
          <View style={styles.chipsRow}>
            {specialties.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, selectedSpecialties.includes(s) && styles.chipSelected]}
                onPress={() => toggleSpecialty(s)}
              >
                <Text style={[styles.chipText, selectedSpecialties.includes(s) && styles.chipTextSelected]}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button
          title={idDoc ? 'تم رفع الوثيقة ✓' : 'أرفع وثيقة التوثيق'}
          onPress={pickImage}
          variant="outlined"
          fullWidth
          style={{ marginBottom: spacing.lg }}
        />

        <Button
          title="تسجيل المزرعة"
          onPress={handleRegister}
          fullWidth
          size="lg"
          disabled={!farmName || !ownerName}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: 40 },
  title: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 24,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    writingDirection: 'rtl',
  },
  fieldWrapper: { marginBottom: spacing.md },
  label: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  chipsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.primary,
  },
  chipText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: colors.primary,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
});
