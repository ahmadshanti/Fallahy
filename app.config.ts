import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'من الأرض',
  slug: 'min-elard',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  scheme: 'minelard',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.minelard.app',
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#2D5016',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
    },
    package: 'com.minelard.app',
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: ['expo-router'],
  extra: {
    direction: 'rtl',
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    devOtpBypass: process.env.EXPO_PUBLIC_DEV_OTP_BYPASS === 'true',
    devAuthRole:
      process.env.EXPO_PUBLIC_DEV_AUTH_ROLE === 'buyer' ||
      process.env.EXPO_PUBLIC_DEV_AUTH_ROLE === 'farmer'
        ? process.env.EXPO_PUBLIC_DEV_AUTH_ROLE
        : undefined,
    devMode: process.env.EXPO_PUBLIC_DEV_MODE === 'true',
    azureSpeechKey: process.env.EXPO_PUBLIC_AZURE_SPEECH_KEY,
    azureSpeechRegion: process.env.EXPO_PUBLIC_AZURE_SPEECH_REGION,
    elevenLabsKey: process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY,
    replicateToken: process.env.EXPO_PUBLIC_REPLICATE_API_TOKEN,
    // Rwan's Python service (services/ai-service). Default = local dev server.
    aiServiceUrl: process.env.EXPO_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000',
  },
});
