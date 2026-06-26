import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Button from '../../components/ui/Button';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';

const farms = [
  {
    id: '1', name: 'مزرعة أبو صبري', location: 'جنين', distance: '12 كم',
    crops: ['فراولة', 'بندورة', 'خيار'], price: 15,
    image: 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=400',
  },
  {
    id: '2', name: 'بستان الزيتون', location: 'نابلس', distance: '25 كم',
    crops: ['زيتون', 'تين'], price: 20,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400',
  },
];

export default function PickYourOwnScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>اقطف بنفسك</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.description}>
          زر المزرعة واقطف المنتجات بنفسك! تجربة عائلية ممتعة وأسعار أرخص.
        </Text>

        {farms.map((farm) => (
          <View key={farm.id} style={styles.farmCard}>
            <Image source={{ uri: farm.image }} style={styles.farmImage} contentFit="cover" />
            <View style={styles.farmInfo}>
              <Text style={styles.farmName}>{farm.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 }}>
                <Text style={[styles.farmLocation, { marginTop: 0 }]}>{farm.location} - {farm.distance}</Text>
                <Ionicons name="location-outline" size={14} color={colors.textMuted} />
              </View>
              <Text style={styles.farmCrops}>المحاصيل: {farm.crops.join('، ')}</Text>
              <View style={styles.farmBottom}>
                <Button title="احجز زيارة" onPress={() => {}} size="sm" />
                <Text style={styles.farmPrice}>₪{farm.price}/شخص</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  backIcon: { fontSize: 24 },
  headerTitle: { fontFamily: 'Cairo_700Bold', fontSize: 18, color: colors.textPrimary },
  content: { padding: spacing.md },
  description: {
    fontFamily: 'Cairo_400Regular', fontSize: 15, color: colors.textSecondary,
    textAlign: 'right', writingDirection: 'rtl', lineHeight: 24, marginBottom: spacing.lg,
  },
  farmCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    overflow: 'hidden', marginBottom: spacing.md,
  },
  farmImage: { width: '100%', height: 160 },
  farmInfo: { padding: spacing.md },
  farmName: {
    fontFamily: 'Cairo_700Bold', fontSize: 18, color: colors.textPrimary,
    textAlign: 'right', writingDirection: 'rtl',
  },
  farmLocation: {
    fontFamily: 'Cairo_400Regular', fontSize: 13, color: colors.textMuted,
    textAlign: 'right', marginTop: 4,
  },
  farmCrops: {
    fontFamily: 'Cairo_400Regular', fontSize: 14, color: colors.textSecondary,
    textAlign: 'right', writingDirection: 'rtl', marginTop: 4,
  },
  farmBottom: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.sm,
  },
  farmPrice: {
    fontFamily: 'Cairo_700Bold', fontSize: 16, color: colors.success,
  },
});
