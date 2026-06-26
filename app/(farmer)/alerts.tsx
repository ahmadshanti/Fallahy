import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AlertCard from '../../components/farmer/AlertCard';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { useAuthStore } from '../../store/authStore';
import { useFarmerAlerts } from '../../hooks/useAlerts';

export default function FarmerAlertsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: alerts = [], isLoading } = useFarmerAlerts(user?.id || '');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>التنبيهات الذكية</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {alerts.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 80 }}>
              <Ionicons name="notifications-off-outline" size={60} color={colors.textMuted} />
              <Text style={{ fontFamily: 'Cairo_600SemiBold', fontSize: 16, color: colors.textMuted, marginTop: spacing.md }}>
                لا توجد تنبيهات حالياً
              </Text>
            </View>
          ) : (
            alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onAction={() => alert.actionRoute ? router.push(alert.actionRoute as any) : undefined}
              />
            ))
          )}
        </ScrollView>
      )}
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
});
