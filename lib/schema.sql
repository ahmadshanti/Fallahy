-- Fallahy Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- 1. Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('buyer', 'farmer')) DEFAULT 'buyer',
  avatar_url TEXT,
  city TEXT,
  address TEXT,
  is_verified BOOLEAN DEFAULT false,
  farm_name TEXT,
  farm_story TEXT,
  specialty TEXT[],
  location JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  image_url TEXT,
  retail_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  wholesale_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  market_price NUMERIC(10,2) DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'كغ',
  available INTEGER NOT NULL DEFAULT 0,
  harvest_date TEXT,
  is_organic BOOLEAN DEFAULT false,
  is_fresh BOOLEAN DEFAULT false,
  origin TEXT DEFAULT 'فلسطيني المنشأ',
  category TEXT NOT NULL DEFAULT 'خضار',
  savings_percent INTEGER DEFAULT 0,
  is_self_pick BOOLEAN DEFAULT false,
  is_adoptable BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  buyer_id UUID REFERENCES profiles(id) NOT NULL,
  farmer_id UUID REFERENCES profiles(id) NOT NULL,
  status TEXT CHECK (status IN ('received', 'preparing', 'on_the_way', 'delivered', 'cancelled')) DEFAULT 'received',
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_type TEXT CHECK (delivery_type IN ('delivery', 'pickup', 'self')) DEFAULT 'delivery',
  payment_method TEXT DEFAULT 'cash',
  address TEXT,
  estimated_arrival TEXT,
  placed_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_type TEXT CHECK (price_type IN ('retail', 'wholesale')) DEFAULT 'retail'
);

-- 5. Farmer alerts table
CREATE TABLE IF NOT EXISTS farmer_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('warning', 'info', 'success')) NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  action TEXT,
  action_route TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Price alerts table (buyer)
CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_name TEXT NOT NULL,
  target_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  current_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT CHECK (status IN ('waiting', 'triggered')) DEFAULT 'waiting',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Buyer savings table
CREATE TABLE IF NOT EXISTS buyer_savings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  total_saved NUMERIC(10,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  rank TEXT DEFAULT 'عضو جديد'
);

-- ===== ROW LEVEL SECURITY =====

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_savings ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone can read, users update their own
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Products: anyone can read, farmers manage their own
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);
CREATE POLICY "Farmers can insert own products" ON products FOR INSERT WITH CHECK (auth.uid() = farmer_id);
CREATE POLICY "Farmers can update own products" ON products FOR UPDATE USING (auth.uid() = farmer_id);
CREATE POLICY "Farmers can delete own products" ON products FOR DELETE USING (auth.uid() = farmer_id);

-- Orders: buyers see their orders, farmers see orders to them
CREATE POLICY "Buyers can view own orders" ON orders FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = farmer_id);
CREATE POLICY "Buyers can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Farmers can update order status" ON orders FOR UPDATE USING (auth.uid() = farmer_id);

-- Order items: visible if order is visible
CREATE POLICY "Order items viewable by order participants" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.buyer_id = auth.uid() OR orders.farmer_id = auth.uid()))
);
CREATE POLICY "Order items insertable by buyer" ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.buyer_id = auth.uid())
);

-- Farmer alerts: farmers see their own
CREATE POLICY "Farmers see own alerts" ON farmer_alerts FOR SELECT USING (auth.uid() = farmer_id);
CREATE POLICY "System can insert alerts" ON farmer_alerts FOR INSERT WITH CHECK (true);

-- Price alerts: buyers see their own
CREATE POLICY "Buyers see own price alerts" ON price_alerts FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Buyers can create price alerts" ON price_alerts FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Buyer savings: buyers see their own
CREATE POLICY "Buyers see own savings" ON buyer_savings FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "System can manage savings" ON buyer_savings FOR ALL USING (true);

-- ===== AUTO-CREATE PROFILE ON SIGNUP =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'role', 'buyer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== AUTO-CREATE BUYER SAVINGS ON BUYER SIGNUP =====
CREATE OR REPLACE FUNCTION public.handle_new_buyer_savings()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'buyer' THEN
    INSERT INTO public.buyer_savings (buyer_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_buyer_profile_created ON profiles;
CREATE TRIGGER on_buyer_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_buyer_savings();
