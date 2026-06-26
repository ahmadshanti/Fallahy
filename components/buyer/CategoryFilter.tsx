import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, I18nManager } from 'react-native';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';

interface CategoryFilterProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
}

export default function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scroll}
    >
      {categories.map((cat) => (
        <TouchableOpacity
          key={cat}
          style={[styles.chip, selected === cat && styles.chipActive]}
          onPress={() => onSelect(cat)}
        >
          <Text style={[styles.chipText, selected === cat && styles.chipTextActive]}>
            {cat}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginVertical: spacing.xs,
  },
  container: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    flexDirection: 'row-reverse',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
});
