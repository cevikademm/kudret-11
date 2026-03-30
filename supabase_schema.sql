
-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  icon TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories if not exists
INSERT INTO categories (id, icon) VALUES
('all',        '🍽️'),
('kahvalti',   '☕'),
('corbalar',   '🍲'),
('salatalar',  '🥗'),
('mezeler',    '🫙'),
('vejeteryan', '🥦'),
('lahmacun',   '🫓'),
('pide',       '🍕'),
('doner',      '🥙'),
('durumlar',   '🌯'),
('kebaplar',   '🍖'),
('tava',       '🍳'),
('tatlilar',   '🍰'),
('icecekler',  '🥤')
ON CONFLICT (id) DO NOTHING;

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  image TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'all',
  allergens TEXT[] DEFAULT '{}',
  spice_level INTEGER DEFAULT 0,
  upsell_items TEXT[] DEFAULT '{}',
  available BOOLEAN DEFAULT TRUE,
  stock INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_number TEXT NOT NULL,
  customer_name TEXT DEFAULT '',
  items JSONB NOT NULL DEFAULT '[]',
  total_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'RECEIVED',
  note TEXT DEFAULT '',
  feedback TEXT DEFAULT '',
  customer_language TEXT DEFAULT 'TR',
  completed_by TEXT,
  stock_deducted BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create waiter_calls table
CREATE TABLE IF NOT EXISTS waiter_calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_number TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'WAITER',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  completed_by TEXT,
  completed_at TIMESTAMPTZ,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create staff table
CREATE TABLE IF NOT EXISTS staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Garson',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create logs table
CREATE TABLE IF NOT EXISTS logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  details TEXT,
  user_name TEXT,
  user_role TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Alter tables (for existing deployments)
ALTER TABLE products ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER;

ALTER TABLE waiter_calls ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';
ALTER TABLE waiter_calls ADD COLUMN IF NOT EXISTS completed_by TEXT;
ALTER TABLE waiter_calls ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS completed_by TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_deducted BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS feedback TEXT DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_language TEXT DEFAULT 'TR';
