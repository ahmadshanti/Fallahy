-- Fallahy v2 Database Schema
-- Run in Supabase SQL Editor

-- Drop old tables if they exist (careful in production!)
DROP TABLE IF EXISTS buyer_savings CASCADE;
DROP TABLE IF EXISTS price_alerts CASCADE;
DROP TABLE IF EXISTS farmer_alerts CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 1. Users (buyers)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,
  full_name TEXT,
  city TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Farmers
CREATE TABLE farmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  owner_name TEXT NOT NULL,
  farm_name TEXT NOT NULL,
  owner_avatar_url TEXT,
  farm_images TEXT[],
  city TEXT NOT NULL,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  about TEXT,
  whatsapp_number TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_url TEXT,
  quantity_available NUMERIC NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'كغ',
  sale_type TEXT DEFAULT 'both',
  retail_price NUMERIC,
  wholesale_price NUMERIC,
  discount_percent NUMERIC DEFAULT 0,
  is_organic BOOLEAN DEFAULT false,
  description TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Trees
CREATE TABLE trees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  tree_type TEXT NOT NULL,
  suggested_name TEXT,
  age_years INTEGER,
  image_url TEXT,
  annual_price NUMERIC NOT NULL,
  available_count INTEGER NOT NULL DEFAULT 1,
  production_season TEXT,
  soil_type TEXT,
  extra_info TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Adopted Trees
CREATE TABLE adopted_trees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id UUID REFERENCES trees(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  custom_name TEXT NOT NULL,
  adopted_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active'
);

-- 6. Pick Requests
CREATE TABLE pick_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  requested_date DATE NOT NULL,
  requested_time TEXT NOT NULL,
  quantity NUMERIC,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  total_price NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  delivery_address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Order Items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity NUMERIC NOT NULL,
  unit_price NUMERIC NOT NULL,
  sale_type TEXT DEFAULT 'retail'
);

-- 9. Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(buyer_id, farmer_id)
);

-- 10. Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== ROW LEVEL SECURITY =====
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE adopted_trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE pick_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Public read for products, farmers, trees, users
CREATE POLICY "Public read users" ON users FOR SELECT USING (true);
CREATE POLICY "Public read farmers" ON farmers FOR SELECT USING (true);
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Public read trees" ON trees FOR SELECT USING (true);

-- Authenticated insert/update
CREATE POLICY "Auth insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth update users" ON users FOR UPDATE USING (true);
CREATE POLICY "Auth insert farmers" ON farmers FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth update farmers" ON farmers FOR UPDATE USING (true);
CREATE POLICY "Auth manage products" ON products FOR ALL USING (true);
CREATE POLICY "Auth manage trees" ON trees FOR ALL USING (true);
CREATE POLICY "Auth manage adopted_trees" ON adopted_trees FOR ALL USING (true);
CREATE POLICY "Auth manage pick_requests" ON pick_requests FOR ALL USING (true);
CREATE POLICY "Auth manage orders" ON orders FOR ALL USING (true);
CREATE POLICY "Auth manage order_items" ON order_items FOR ALL USING (true);
CREATE POLICY "Auth manage conversations" ON conversations FOR ALL USING (true);
CREATE POLICY "Auth manage messages" ON messages FOR ALL USING (true);
CREATE POLICY "Auth manage notifications" ON notifications FOR ALL USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE pick_requests;
