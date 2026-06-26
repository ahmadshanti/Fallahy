import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Badge from '../ui/Badge';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function HeroBanner() {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=800' }}
        style={styles.image}
        contentFit="cover"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)']}
        style={styles.gradient}
      />
      <View style={styles.badge}>
        <Badge label="طازج الآن" variant="fresh" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>طلع اليوم الصبح</Text>
        <Text style={styles.subtitle}>خضروات قُطفت الفجر من مزارعنا في جنين</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH - spacing.md * 2,
    height: 180,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginHorizontal: spacing.md,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  textContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  title: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 20,
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
