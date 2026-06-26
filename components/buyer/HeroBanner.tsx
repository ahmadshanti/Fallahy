import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Badge from '../ui/Badge';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function HeroBanner() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, '#1a3a0a']}
        style={styles.gradient}
      />
      <View style={styles.badge}>
        <Badge label="طازج الآن" variant="fresh" />
      </View>
      <View style={styles.content}>
        <Ionicons name="leaf" size={32} color="rgba(255,255,255,0.3)" style={styles.bgIcon} />
        <Text style={styles.title}>من الأرض لبيتك</Text>
        <Text style={styles.subtitle}>منتجات طازجة مباشرة من مزارعين محليين</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH - spacing.md * 2,
    height: 160,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginHorizontal: spacing.md,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  bgIcon: {
    position: 'absolute',
    top: -10,
    left: -5,
    transform: [{ rotate: '-20deg' }],
    fontSize: 80,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  title: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 22,
    color: '#FFFFFF',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 2,
  },
});
