export interface User {
  id: string;
  phone: string;
  full_name: string;
  city?: string;
  avatar_url?: string;
}

export interface Farmer {
  id: string;
  user_id?: string;
  owner_name: string;
  farm_name: string;
  owner_avatar_url?: string;
  farm_images?: string[];
  city: string;
  location_lat?: number;
  location_lng?: number;
  about?: string;
  whatsapp_number?: string;
  is_verified?: boolean;
}

export interface Product {
  id: string;
  farmer_id: string;
  name: string;
  image_url?: string;
  quantity_available: number;
  unit: string;
  sale_type: string;
  retail_price?: number;
  wholesale_price?: number;
  discount_percent?: number;
  is_organic?: boolean;
  description?: string;
  is_available?: boolean;
  farmers?: Farmer;
}

export interface Tree {
  id: string;
  farmer_id: string;
  tree_type: string;
  suggested_name?: string;
  age_years?: number;
  image_url?: string;
  annual_price: number;
  available_count: number;
  production_season?: string;
  soil_type?: string;
  extra_info?: string;
  farmers?: Farmer;
}

export interface AdoptedTree {
  id: string;
  tree_id: string;
  buyer_id: string;
  custom_name: string;
  adopted_at: string;
  expires_at?: string;
  status: string;
  trees?: Tree & { farmers?: { farm_name: string; city: string } };
}

export interface Order {
  id: string;
  buyer_id: string;
  farmer_id: string;
  status: string;
  total_price: number;
  payment_method: string;
  delivery_address?: string;
  notes?: string;
  created_at: string;
  order_items?: OrderItem[];
  farmers?: Farmer;
  users?: User;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  sale_type: string;
  products?: { name: string; image_url?: string };
}

export interface Conversation {
  id: string;
  buyer_id: string;
  farmer_id: string;
  order_id?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  farmers?: { id: string; farm_name: string; owner_avatar_url?: string };
  users?: { id: string; full_name: string; avatar_url?: string };
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface PickRequest {
  id: string;
  buyer_id: string;
  farmer_id: string;
  product_id: string;
  requested_date: string;
  requested_time: string;
  quantity?: number;
  status: string;
  products?: { name: string; image_url?: string };
  farmers?: { farm_name: string; city: string; whatsapp_number?: string };
  users?: { full_name: string; avatar_url?: string; phone: string };
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data?: any;
  is_read: boolean;
  created_at: string;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  saleType: 'retail' | 'wholesale';
}
