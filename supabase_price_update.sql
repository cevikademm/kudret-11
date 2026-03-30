-- ============================================================
-- KUDRET KEBAB HOUSE — Fiyat & İçerik Güncellemeleri
-- Tarih: 2026-03-30
-- ============================================================

-- 1. FİYAT GÜNCELLEMELERİ
UPDATE products SET price = 6.90  WHERE name = 'Mercimek Çorbası';
UPDATE products SET price = 7.90  WHERE name = 'Kelle Paça Çorbası';
UPDATE products SET price = 8.50  WHERE name = 'Karışık Salata Büyük';
UPDATE products SET price = 16.90 WHERE name = 'Tavuk Salatası';
UPDATE products SET price = 18.90 WHERE name = 'Salatalı Dönerli Lahmacun Tabak';
UPDATE products SET price = 19.90 WHERE name = 'Paşalı Tantuni';
UPDATE products SET price = 18.90 WHERE name = 'Kuzu Kaburga';
UPDATE products SET price = 21.90 WHERE name = 'Beyti Sarma';

-- 2. KARIŞIK MEZE TABAĞI — fiyat + açıklama
UPDATE products
SET price = 11.90,
    description = '4 farklı meze, 2 falafel ve 2 sarma'
WHERE name = 'Karışık Meze Tabağı';

-- 3. ÇÖKERTME — isim + fiyat güncellemeleri
UPDATE products
SET name = 'Çökertme Classic (Steak Dönerli)',
    price = 18.90,
    description = 'Steak Dönerfleisch mit Tomaten, Paprika, Joghurt und Frittierte Kartoffeln. Tellergerichte mit Pommes +1€ statt mit Reis.'
WHERE name = 'Çökertme Kebabı Dönerli';

UPDATE products
SET price = 17.90,
    description = 'Geflügelfleischdöner mit Tomaten, Paprika, Joghurt und Frittierte Kartoffeln. Tellergerichte mit Pommes +1€ statt mit Reis.'
WHERE name = 'Çökertme Kebabı Tavuk Dönerli';

-- 4. HAVUÇ DİLİMİ BAKLAVA — isim + fiyat
UPDATE products
SET name = 'Havuç Dilimi Baklava mit Eis',
    price = 8.90,
    description = 'Baklava mit Eis / Baklava with ice cream'
WHERE name = 'Havuç Dilim Baklava Dondurmalı';

-- 5. YENİ ÜRÜNLER
INSERT INTO products (name, description, price, category, allergens, spice_level, available) VALUES

-- Çökertme yeni varyantlar
('Çökertme Kuzu Şiş',
 'Lammspieß mit Tomaten, Paprika, Joghurt und Frittierte Kartoffeln. Tellergerichte mit Pommes +1€ statt mit Reis.',
 21.90, 'kebaplar', '{Laktose}', 0, true),

('Çökertme Tavuk Şiş',
 'Hähnchenbrustspieß mit Tomaten, Paprika, Joghurt und Frittierte Kartoffeln. Tellergerichte mit Pommes +1€ statt mit Reis.',
 20.90, 'kebaplar', '{Laktose}', 0, true),

-- Tatlılar yeni
('Havuç Dilimi Baklava',
 'Havuç dilimi baklava / Carrot slice baklava',
 6.90, 'tatlilar', '{Gluten, Kuruyemiş}', 0, true),

('Kare Baklava (4 Stk)',
 'Kare baklava 4 Stück / Square baklava 4 pieces',
 7.90, 'tatlilar', '{Gluten, Kuruyemiş}', 0, true);

-- 6. TABAK YEMEKLERİNE POMMES NOTU EKLE
-- (Reis yerine Pommes +1€ notu — ilgili tüm tabak yemeklerine)
UPDATE products SET description = description || ' Tellergerichte mit Pommes +1€ statt mit Reis.'
WHERE name IN (
  'Steak Döner Tabak',
  'Tavuk Döner Tabak',
  'Karışık Döner Tabak',
  'Bursa İskender',
  'Kremalı Tavuk',
  'Çökertme Kebabı',
  'Ali Nazik',
  'Adana Kebap',
  'Urfa Kebap',
  'Kuzu Kaburga',
  'Izgara Köfte',
  'Tavuk Şiş',
  'Ciğer Şiş',
  'Tavuk Kanat',
  'Kuzu Pirzola (4 Adet)',
  'Beyti Sarma',
  'Adana Kebap Yoğurtlu',
  'Kuzu Şiş Yoğurtlu',
  'Kuzu Şiş',
  'Karışık Izgara',
  'Kudret Spezial Izgara (2 Kişilik)',
  'Kuzu Saç Tava',
  'Tavuk Saç Tava'
);

-- 7. KONTROL
SELECT name, price, category FROM products ORDER BY category, name;
