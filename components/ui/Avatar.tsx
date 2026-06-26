import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

interface AvatarProps {
  uri: string;
  size?: number;
  style?: object;
}

export default function Avatar({ uri, size = 50, style }: AvatarProps) {
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
        contentFit="cover"
        transition={200}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
