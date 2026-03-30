
-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  icon TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories if not exists
INSERT INTO categories (id, icon) VALUES
('all', '🍽️'),
('haehnchen', '🍗'),
('burger', '🍔'),
('pasta', '🍝'),
('salat', '🥗'),
('dessert', '🍰'),
('drinks', '🥤')
ON CONFLICT (id) DO NOTHING;

-- Create logs table
CREATE TABLE IF NOT EXISTS logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  details TEXT,
  user_name TEXT,
  user_role TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure products table has available column (it should, but just in case)
ALTER TABLE products ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT TRUE;

-- Ensure waiter_calls has status
ALTER TABLE waiter_calls ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';
ALTER TABLE waiter_calls ADD COLUMN IF NOT EXISTS completed_by TEXT;
ALTER TABLE waiter_calls ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Ensure orders has completed_by
ALTER TABLE orders ADD COLUMN IF NOT EXISTS completed_by TEXT;
