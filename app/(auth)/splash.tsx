import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';

export default function SplashScreen() {
  const router = useRouter();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      router.replace('/(auth)/onboarding');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity }]}>
        <Svg width={60} height={60} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
            fill="#98C27B"
          />
        </Svg>
        <Text style={styles.title}>من الأرض</Text>
        <Text style={styles.subtitle}>From The Land</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D5016',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 48,
    color: '#FFFFFF',
    marginTop: 16,
  },
  subtitle: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 16,
    color: '#98C27B',
    marginTop: 8,
  },
});
