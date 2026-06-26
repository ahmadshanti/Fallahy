import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';

const alerts = [
  { id: '1', product: 'بندورة', targetPrice: 2.5, currentPrice: 3.0, status: 'waiting' },
  { id: '2', product: 'خيار', targetPrice: 1.5, currentPrice: 2.0, status: 'waiting' },
  { id: '3', product: 'زيت زيتون', targetPrice: 2.0, currentPrice: 3.0, status: 'triggered' },
];

export default function AlertsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backIcon}>→</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تنبيهات الأسعار</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {alerts.map((alert) => (
          <View key={alert.id} style={styles.alertCard}>
            <View style={styles.alertRow}>
              <Text style={styles.alertProduct}>{alert.product}</Text>
              <Text style={styles.alertIcon}>🔔</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>السعر الحالي: ₪{alert.currentPrice}</Text>
              <Text style={styles.priceLabel}>السعر المطلوب: ₪{alert.targetPrice}</Text>
            </View>
            <View style={[
              styles.statusBadge,
              { backgroundColor: alert.status === 'triggered' ? '#E8F5E1' : '#FFF3D6' }
            ]}>
              <Text style={[
                styles.statusText,
                { color: alert.status === 'triggered' ? colors.success : colors.secondary }
              ]}>
                {alert.status === 'triggered' ? 'وصل السعر المطلوب!' : 'قيد الانتظار'}
              </Text>
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
  list: { padding: spacing.md },
  alertCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  alertRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  alertIcon: { fontSize: 20 },
  alertProduct: {
    fontFamily: 'Cairo_700Bold', fontSize: 16, color: colors.textPrimary, textAlign: 'right',
  },
  priceRow: {
    flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: spacing.sm,
  },
  priceLabel: {
    fontFamily: 'Cairo_400Regular', fontSize: 13, color: colors.textSecondary,
  },
  statusBadge: {
    alignSelf: 'flex-end', paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: radius.full, marginTop: spacing.sm,
  },
  statusText: { fontFamily: 'Cairo_600SemiBold', fontSize: 12 },
});
