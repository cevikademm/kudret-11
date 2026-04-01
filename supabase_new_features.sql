-- ============================================================
-- KUDRET KEBAB HOUSE — Yeni Özellikler için DB Migration
-- ============================================================

-- 1. SADAKAT MÜŞTERİLERİ
CREATE TABLE IF NOT EXISTS loyalty_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  total_points INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  last_visit TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. REZERVASYONLAR
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  table_number TEXT,
  date_time TIMESTAMPTZ NOT NULL,
  party_size INTEGER DEFAULT 2,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING','CONFIRMED','SEATED','CANCELLED')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. LOKASYONLAR (Çok Şube)
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SITE_SETTINGS — Yeni Anahtarlar
-- Google Review URL
INSERT INTO site_settings (key, value)
VALUES ('google_review_url', '"https://search.google.com/local/writereview?placeid=YOUR_PLACE_ID"')
ON CONFLICT (key) DO NOTHING;

-- Stripe Payment URL
INSERT INTO site_settings (key, value)
VALUES ('stripe_payment_url', '""')
ON CONFLICT (key) DO NOTHING;

-- 5. SUPABASE STORAGE — Ürün Fotoğrafları için Bucket
-- Bu komutu Supabase Dashboard > Storage > New Bucket üzerinden de yapabilirsiniz.
-- Bucket adı: product-images, Public: true

-- 6. RLS POLİTİKALARI (Temel Güvenlik)
-- Sadakat tablosu: Herkes okuyabilir, sadece authenticated kullanıcılar yazabilir
ALTER TABLE loyalty_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "loyalty_public_read" ON loyalty_customers FOR SELECT USING (true);
CREATE POLICY "loyalty_auth_write" ON loyalty_customers FOR ALL USING (true); -- Geçici: tam açık

-- Rezervasyonlar: Herkes okuyabilir ve ekleyebilir (müşteri rezervasyon yapabilsin)
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reservations_public_all" ON reservations FOR ALL USING (true);

-- Lokasyonlar: Herkes okuyabilir
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "locations_public_read" ON locations FOR SELECT USING (true);
CREATE POLICY "locations_auth_write" ON locations FOR INSERT WITH CHECK (true);
CREATE POLICY "locations_auth_update" ON locations FOR UPDATE USING (true);

-- 7. STAFF — Şifre sütunu kontrolü (zaten varsa skip)
ALTER TABLE staff ADD COLUMN IF NOT EXISTS password TEXT;

-- 9. LOYALTY_CUSTOMERS — Sipariş geçmişi sütunu
ALTER TABLE loyalty_customers ADD COLUMN IF NOT EXISTS order_history JSONB DEFAULT '[]'::jsonb;

-- 8. ÖRNEK VERİLER

-- Örnek lokasyon (tek şube için gerek yok, sadece çok şubeli işletmeler için)
-- INSERT INTO locations (name, address) VALUES ('Kudret Merkez', 'Hauptstrasse 1, Berlin');
-- INSERT INTO locations (name, address) VALUES ('Kudret Schöneberg', 'Musterstrasse 5, Berlin');

-- Örnek admin personel (şifreli)
-- INSERT INTO staff (name, email, password, role, status)
-- VALUES ('Adem Çevik', 'cevikademm@gmail.com', 'guvenlisifre123', 'Yönetici', 'active')
-- ON CONFLICT (email) DO UPDATE SET password = 'guvenlisifre123';

-- ============================================================
-- KONTROL
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('loyalty_customers', 'reservations', 'locations', 'staff', 'site_settings')
ORDER BY table_name;
