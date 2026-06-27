import React from 'react';
import { View, Image as RNImage, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

interface AvatarProps {
  uri?: string;
  size?: number;
  style?: object;
}

export default function Avatar({ uri, size = 50, style }: AvatarProps) {
  const hasImage = !!uri && uri.length > 5;

  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }, style]}>
      {hasImage ? (
        <RNImage
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }]}>
          <Ionicons name="person" size={size * 0.45} color={colors.textMuted} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#E8E3D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
