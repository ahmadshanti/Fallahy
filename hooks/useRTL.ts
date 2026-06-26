import { I18nManager } from 'react-native';

export function useRTL() {
  return {
    isRTL: I18nManager.isRTL,
    direction: 'rtl' as const,
    textAlign: 'right' as const,
    writingDirection: 'rtl' as const,
    flexDirection: 'row-reverse' as const,
  };
}
