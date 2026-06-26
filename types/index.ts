export interface Product {
  id: string;
  name: string;
  farmerId: string;
  farmerName: string;
  farmerAvatar: string;
  image: string;
  retailPrice: number;
  wholesalePrice: number;
  marketPrice: number;
  unit: string;
  available: number;
  harvestDate: string;
  isOrganic: boolean;
  isFresh: boolean;
  origin: string;
  rating: number;
  reviewCount: number;
  category: string;
  savings: number;
}

export interface Farmer {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  distance: number;
  isVerified: boolean;
  location: { latitude: number; longitude: number };
  story: string;
  specialty: string[];
  totalProducts: number;
}

export interface PriceTickerItem {
  name: string;
  price: number;
  change: 'up' | 'down' | 'flat';
  symbol: string;
}

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  status: 'received' | 'preparing' | 'on_the_way' | 'delivered';
  farmerName: string;
  farmerAvatar: string;
  farmerPhone: string;
  items: OrderItem[];
  total: number;
  estimatedArrival: string;
  placedAt: string;
  address: string;
}

export interface Savings {
  thisMonth: number;
  totalOrders: number;
  totalSaved: number;
  rank: string;
  points: number;
  nextRank: string;
  pointsToNext: number;
}

export interface Alert {
  id: string;
  type: 'warning' | 'info' | 'success';
  message: string;
  action: string;
  actionRoute: string;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  priceType: 'retail' | 'wholesale';
}

export interface User {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  role: 'buyer' | 'farmer';
  city?: string;
  address?: string;
}
