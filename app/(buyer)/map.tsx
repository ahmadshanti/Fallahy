import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Avatar from '../../components/ui/Avatar';
import RatingStars from '../../components/ui/RatingStars';
import Button from '../../components/ui/Button';
import CategoryFilter from '../../components/buyer/CategoryFilter';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { mockFarmers } from '../../constants/mockData';

const categories = ['الكل', 'خضار', 'فواكه', 'زيوت'];

export default function MapScreen() {
  const router = useRouter();
  const [selectedFarmer, setSelectedFarmer] = useState(mockFarmers[0]);
  const [selectedCategory, setSelectedCategory] = useState('الكل');

  return (
    <View style={styles.container}>
      {/* Map Placeholder */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapEmoji}>🗺</Text>
        <Text style={styles.mapText}>خريطة تفاعلية</Text>
        <Text style={styles.mapSubtext}>سيتم عرض مواقع المزارعين هنا</Text>

        {/* Farmer Markers (simulated) */}
        {mockFarmers.map((farmer, i) => (
          <TouchableOpacity
            key={farmer.id}
            style={[styles.marker, { top: 150 + i * 80, left: 80 + i * 100 }]}
            onPress={() => setSelectedFarmer(farmer)}
          >
            <Text style={styles.markerIcon}>📍</Text>
            <Text style={styles.markerLabel}>{farmer.name.substring(0, 10)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Top Controls */}
      <SafeAreaView style={styles.topControls}>
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
            <Text style={styles.backArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.locationBtn}>
            <Text style={styles.locationText}>📍 موقعي</Text>
          </TouchableOpacity>
        </View>
        <CategoryFilter categories={categories} selected={selectedCategory} onSelect={setSelectedCategory} />
      </SafeAreaView>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        <View style={styles.handle} />
        <View style={styles.farmerInfo}>
          <Avatar uri={selectedFarmer.avatar} size={50} />
          <View style={styles.farmerDetails}>
            <Text style={styles.farmerName}>{selectedFarmer.name}</Text>
            <RatingStars rating={selectedFarmer.rating} reviewCount={selectedFarmer.reviewCount} />
            <Text style={styles.distance}>📍 {selectedFarmer.distance} كم</Text>
          </View>
        </View>
        <Button title="طلب الآن" onPress={() => router.push(`/(buyer)/farmer/${selectedFarmer.id}`)} fullWidth />
      </View>
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
});
