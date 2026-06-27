import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import CategoryFilter from '../../components/buyer/CategoryFilter';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { useFarmers } from '../../hooks/useFarmers';
import { aiServiceConfigured, nearbyFarmers, ApiFarmer } from '../../lib/aiService';

const categories = ['الكل', 'خضار', 'فواكه', 'زيوت'];
// Ramallah default — replace with expo-location later if you want true GPS
const DEFAULT_LAT = 31.9038;
const DEFAULT_LNG = 35.2034;

export default function MapScreen() {
  const router = useRouter();
  const { data: dbFarmers = [], isLoading } = useFarmers();
  const [aiFarmers, setAiFarmers] = useState<ApiFarmer[]>([]);
  const [aiSource, setAiSource] = useState<'azure' | 'haversine' | null>(null);
  const [selectedFarmer, setSelectedFarmer] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState('الكل');

  // Try Rwan's /api/maps/nearby-farmers; if it returns rows, prefer them
  useEffect(() => {
    if (!aiServiceConfigured) return;
    nearbyFarmers(DEFAULT_LAT, DEFAULT_LNG, 50)
      .then((res) => { setAiFarmers(res.farmers); setAiSource(res.source); })
      .catch(() => setAiFarmers([]));
  }, []);

  // Use AI farmers if we got any (shape: ApiFarmer), otherwise the Supabase ones
  const farmers: any[] = aiFarmers.length > 0
    ? aiFarmers.map((f) => ({
        id: f.id,
        farm_name: f.name,
        city: f.city,
        owner_avatar_url: '',
        distance_km: f.distance_km,
      }))
    : dbFarmers;

  useEffect(() => {
    if (farmers.length && !selectedFarmer) {
      setSelectedFarmer(farmers[0]);
    }
  }, [farmers]);

  return (
    <View style={styles.container}>
      {/* Map Placeholder */}
      <View style={styles.mapPlaceholder}>
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <>
            <Ionicons name="map-outline" size={60} color={colors.primary} />
            <Text style={styles.mapText}>خريطة تفاعلية</Text>
            <Text style={styles.mapSubtext}>سيتم عرض مواقع المزارعين هنا</Text>

            {/* Farmer Markers (simulated) */}
            {farmers.map((farmer, i) => {
              const label = (farmer.farm_name || farmer.name || '').substring(0, 10);
              return (
                <TouchableOpacity
                  key={farmer.id}
                  style={[styles.marker, { top: 150 + i * 80, left: 80 + i * 100 }]}
                  onPress={() => setSelectedFarmer(farmer)}
                >
                  <Ionicons name="location" size={28} color={colors.primary} />
                  <Text style={styles.markerLabel}>{label}</Text>
                </TouchableOpacity>
              );
            })}
            {aiSource && (
              <View style={styles.aiSourceBadge}>
                <Ionicons name="sparkles" size={11} color="#7C3AED" />
                <Text style={styles.aiSourceText}>
                  {aiSource === 'azure' ? 'Azure Maps' : 'حساب المسافات'}
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* Top Controls */}
      <SafeAreaView style={styles.topControls}>
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
            <Ionicons name="arrow-forward" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.locationBtn}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.locationText}>موقعي</Text>
              <Ionicons name="navigate-outline" size={16} color={colors.primary} />
            </View>
          </TouchableOpacity>
        </View>
        <CategoryFilter categories={categories} selected={selectedCategory} onSelect={setSelectedCategory} />
      </SafeAreaView>

      {/* Bottom Sheet */}
      {selectedFarmer && (
        <View style={styles.bottomSheet}>
          <View style={styles.handle} />
          <View style={styles.farmerInfo}>
            <Avatar uri={selectedFarmer.owner_avatar_url || selectedFarmer.avatar} size={50} />
            <View style={styles.farmerDetails}>
              <Text style={styles.farmerName}>
                {selectedFarmer.farm_name || selectedFarmer.name || ''}
              </Text>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                <Text style={styles.distance}>
                  {selectedFarmer.distance_km != null
                    ? `${selectedFarmer.distance_km.toFixed(1)} كم`
                    : selectedFarmer.city || ''}
                </Text>
              </View>
            </View>
          </View>
          <Button title="طلب الآن" onPress={() => router.push(`/(buyer)/farmer/${selectedFarmer.id}`)} fullWidth />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapPlaceholder: {
    flex: 1, backgroundColor: '#E8F0E2',
    alignItems: 'center', justifyContent: 'center',
  },
  mapEmoji: { fontSize: 60 },
  mapText: { fontFamily: 'Cairo_700Bold', fontSize: 20, color: colors.primary, marginTop: 8 },
  mapSubtext: { fontFamily: 'Cairo_400Regular', fontSize: 14, color: colors.textMuted, marginTop: 4 },
  marker: {
    position: 'absolute', alignItems: 'center',
  },
  markerIcon: { fontSize: 28 },
  markerLabel: {
    fontFamily: 'Cairo_600SemiBold', fontSize: 10, color: colors.primary,
    backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, marginTop: 2,
  },
  topControls: {
    position: 'absolute', top: 0, left: 0, right: 0,
  },
  topRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingTop: spacing.sm,
  },
  backCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    ...{ elevation: 2 },
  },
  backArrow: { fontSize: 20 },
  locationBtn: {
    backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: radius.full, elevation: 2,
  },
  locationText: { fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: colors.primary },
  bottomSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.md, paddingBottom: 34,
    elevation: 10,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md,
  },
  farmerInfo: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm,
    marginBottom: spacing.md,
  },
  farmerDetails: { flex: 1 },
  farmerName: {
    fontFamily: 'Cairo_700Bold', fontSize: 16, color: colors.textPrimary,
    textAlign: 'right', writingDirection: 'rtl',
  },
  distance: {
    fontFamily: 'Cairo_400Regular', fontSize: 13, color: colors.textMuted,
    textAlign: 'right', marginTop: 2,
  },
  aiSourceBadge: {
    position: 'absolute', bottom: 12, right: 12,
    flexDirection: 'row-reverse', alignItems: 'center', gap: 4,
    backgroundColor: '#FFFFFF', borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 5,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4,
  },
  aiSourceText: { fontFamily: 'Cairo_600SemiBold', fontSize: 10, color: '#7C3AED' },
});
