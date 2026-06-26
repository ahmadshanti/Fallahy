import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Avatar from '../ui/Avatar';
import RatingStars from '../ui/RatingStars';
import Badge from '../ui/Badge';
import { colors } from '../../constants/colors';
import { radius, shadow, spacing } from '../../constants/spacing';
import { Farmer } from '../../types';

interface FarmerCardProps {
  farmer: Farmer;
  onPress: () => void;
}

export default function FarmerCard({ farmer, onPress }: FarmerCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.row}>
        <View style={styles.avatarSection}>
          <Avatar uri={farmer.avatar} size={50} />
          {farmer.isVerified && (
            <Badge label="موثّق ✓" variant="verified" style={styles.verifiedBadge} />
          )}
        </View>
        <View style={styles.content}>
          <Text style={styles.name}>{farmer.name}</Text>
          <RatingStars rating={farmer.rating} reviewCount={farmer.reviewCount} />
          <Text style={styles.distance}>📍 {farmer.distance} كم</Text>
        </View>
        <TouchableOpacity style={styles.visitButton} onPress={onPress}>
          <Text style={styles.visitText}>زيارة</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    ...shadow.card,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  avatarSection: {
    alignItems: 'center',
  },
  verifiedBadge: {
    marginTop: 4,
  },
  content: {
    flex: 1,
    marginRight: spacing.sm,
    marginLeft: spacing.sm,
  },
  name: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  distance: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: 2,
  },
  visitButton: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  visitText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: colors.primary,
  },
});
