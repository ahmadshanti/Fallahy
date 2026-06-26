import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const buyerTabs: { name: string; title: string; icon: IoniconsName; iconFocused: IoniconsName }[] = [
  { name: 'index', title: 'الرئيسية', icon: 'home-outline', iconFocused: 'home' },
  { name: 'explore', title: 'تصفح', icon: 'search-outline', iconFocused: 'search' },
  { name: 'trees', title: 'أشجاري', icon: 'leaf-outline', iconFocused: 'leaf' },
  { name: 'chat', title: 'دردشاتي', icon: 'chatbubble-outline', iconFocused: 'chatbubble' },
  { name: 'profile', title: 'حسابي', icon: 'person-outline', iconFocused: 'person' },
];

const hiddenScreens = [
  'product/[id]',
  'farmer/[id]',
  'cart',
  'checkout',
  'order-tracking/[id]',
  'orders',
  'map',
  'pick-your-own',
  'chat-thread/[id]',
  'adopt-tree',
  'alerts',
  'address',
  'settings',
];

export default function BuyerLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      {buyerTabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? tab.iconFocused : tab.icon}
                size={24}
                color={color}
              />
            ),
          }}
        />
      ))}
      {hiddenScreens.map((name) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{ href: null, tabBarStyle: { display: 'none' } }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 85 : 70,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingTop: 8,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  tabLabel: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 11,
    marginTop: 2,
  },
});
