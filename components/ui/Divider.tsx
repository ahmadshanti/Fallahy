import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';

interface DividerProps {
  marginVertical?: number;
}

export default function Divider({ marginVertical = spacing.md }: DividerProps) {
  return <View style={[styles.divider, { marginVertical }]} />;
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: colors.border,
    width: '100%',
  },
});
