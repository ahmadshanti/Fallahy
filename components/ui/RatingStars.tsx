import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

interface RatingStarsProps {
  rating: number;
  reviewCount?: number;
  size?: number;
}

export default function RatingStars({ rating, reviewCount, size = 14 }: RatingStarsProps) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;

  return (
    <View style={styles.container}>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Text key={i} style={[styles.star, { fontSize: size }]}>
            {i <= fullStars ? '★' : i === fullStars + 1 && hasHalf ? '★' : '☆'}
          </Text>
        ))}
      </View>
      <Text style={styles.rating}>{rating}</Text>
      {reviewCount !== undefined && (
        <Text style={styles.count}>({reviewCount})</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  stars: {
    flexDirection: 'row',
  },
  star: {
    color: '#F5A623',
  },
  rating: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: colors.textSecondary,
  },
  count: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
});
