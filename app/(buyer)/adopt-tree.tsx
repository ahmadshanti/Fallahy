import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Button from '../../components/ui/Button';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';

const trees = [
  { id: '1', name: 'شجرة زيتون رومي', age: '200 سنة', price: 150, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400' },
  { id: '2', name: 'شجرة تين بلدي', age: '50 سنة', price: 80, image: 'https://images.unsplash.com/photo-1601379760883-1bb497c558ee?w=400' },
];

export default function AdoptTreeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تبنّى شجرة</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.description}>
          تبنّى شجرة من مزارع فلسطين واحصل على إنتاجها السنوي مباشرة. ادعم المزارع وحافظ على التراث الزراعي.
        </Text>

        {trees.map((tree) => (
          <View key={tree.id} style={styles.treeCard}>
            <Image source={{ uri: tree.image }} style={styles.treeImage} contentFit="cover" />
            <View style={styles.treeInfo}>
              <Text style={styles.treeName}>{tree.name}</Text>
              <Text style={styles.treeAge}>العمر: {tree.age}</Text>
              <Text style={styles.treePrice}>₪{tree.price} / سنوياً</Text>
              <Button title="تبنّى الآن" onPress={() => {}} size="sm" style={{ marginTop: 8 }} />
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
  treeCard: {
    flexDirection: 'row-reverse', backgroundColor: colors.surface,
    borderRadius: radius.xl, overflow: 'hidden', marginBottom: spacing.md,
  },
  treeImage: { width: 120, height: 150 },
  treeInfo: {
    flex: 1, padding: spacing.md, justifyContent: 'center',
  },
  treeName: {
    fontFamily: 'Cairo_700Bold', fontSize: 16, color: colors.textPrimary,
    textAlign: 'right', writingDirection: 'rtl',
  },
  treeAge: {
    fontFamily: 'Cairo_400Regular', fontSize: 13, color: colors.textMuted,
    textAlign: 'right', marginTop: 4,
  },
  treePrice: {
    fontFamily: 'Cairo_700Bold', fontSize: 18, color: colors.success,
    textAlign: 'right', marginTop: 4,
  },
});
