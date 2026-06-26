import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { colors } from '../../constants/colors';
import { shadow } from '../../constants/spacing';
import { PriceTickerItem } from '../../types';

const ITEM_WIDTH = 120;

interface PriceTickerProps {
  items: PriceTickerItem[];
}

export default function PriceTicker({ items }: PriceTickerProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const totalWidth = items.length * ITEM_WIDTH;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: -totalWidth,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const getArrow = (change: string) => {
    switch (change) {
      case 'down': return { arrow: '↓', color: colors.priceDown };
      case 'up': return { arrow: '↑', color: colors.priceUp };
      default: return { arrow: '→', color: colors.priceFlat };
    }
  };

  const doubled = [...items, ...items];

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.ticker, { transform: [{ translateX }] }]}>
        {doubled.map((item, index) => {
          const { arrow, color } = getArrow(item.change);
          return (
            <View key={index} style={styles.item}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={[styles.price, { color }]}>{item.symbol}{item.price}</Text>
              <Text style={[styles.arrow, { color }]}>{arrow}</Text>
              {index < doubled.length - 1 && <View style={styles.separator} />}
            </View>
          );
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...shadow.card,
  },
  ticker: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    width: ITEM_WIDTH,
  },
  name: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: colors.textPrimary,
    marginRight: 6,
  },
  price: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 13,
    marginRight: 4,
  },
  arrow: {
    fontSize: 14,
  },
  separator: {
    width: 1,
    height: 20,
    backgroundColor: colors.border,
    position: 'absolute',
    right: 0,
  },
});
