import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';

type Role = 'buyer' | 'farmer' | null;

export default function RoleSelectScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<Role>(null);

  const handleContinue = () => {
    if (selected) {
      router.push(`/(auth)/login?role=${selected}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>أنت...</Text>

        <TouchableOpacity
          style={[styles.card, selected === 'buyer' && styles.cardSelected]}
          onPress={() => setSelected('buyer')}
          activeOpacity={0.8}
        >
          <Text style={styles.emoji}>🛒</Text>
          <Text style={styles.cardTitle}>مستهلك</Text>
          <Text style={styles.cardSubtitle}>أريد شراء خضار طازج</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, selected === 'farmer' && styles.cardSelected]}
          onPress={() => setSelected('farmer')}
          activeOpacity={0.8}
        >
          <Text style={styles.emoji}>🌾</Text>
          <Text style={styles.cardTitle}>مزارع</Text>
          <Text style={styles.cardSubtitle}>أريد بيع منتجاتي مباشرة</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottom}>
        <Button
          title="متابعة"
          onPress={handleContinue}
          fullWidth
          size="lg"
          disabled={!selected}
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
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 32,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    height: 160,
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  cardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: '#F5F9F2',
  },
  emoji: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 22,
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  bottom: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
