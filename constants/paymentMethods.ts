import type React from 'react';
import { Ionicons } from '@expo/vector-icons';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

export interface PaymentMethod {
  key: 'cash' | 'card' | 'wallet';
  label: string;
  icon: IoniconsName;
}

export const paymentMethods: PaymentMethod[] = [
  { key: 'cash', label: 'نقداً عند الاستلام', icon: 'cash-outline' },
  { key: 'card', label: 'بطاقة ائتمان', icon: 'card-outline' },
  { key: 'wallet', label: 'محفظة إلكترونية', icon: 'phone-portrait-outline' },
];
