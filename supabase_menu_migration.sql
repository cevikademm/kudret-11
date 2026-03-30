-- ============================================================
-- KUDRET KEBAB HOUSE — Menü Migration
-- Tarih: 2026-03-30
-- Bu dosyayı Supabase Dashboard > SQL Editor'de çalıştırın
-- ============================================================

-- 1. Kategorileri temizle ve yeniden oluştur
DELETE FROM categories;

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
('icecekler',  '🥤');

-- 2. Mevcut tüm ürünleri temizle (yeniden yüklemek için)
DELETE FROM products;

-- 3. Tüm menü ürünlerini ekle
INSERT INTO products (name, description, price, category, allergens, spice_level, available) VALUES

-- KAHVALTI
('Serpme Kahvaltı', 'Türk usulü serpme kahvaltı, sınırsız çay dahil (fiyat kişi başıdır)', 14.90, 'kahvalti', '{}', 0, true),

-- ÇORBALAR
('Mercimek Çorbası', 'Linsensuppe / Lentil soup', 6.50, 'corbalar', '{}', 0, true),
('Kelle Paça Çorbası', 'Lammkopfsuppe / Lamb head soup', 7.00, 'corbalar', '{}', 0, true),

-- SALATALAR
('Karışık Salata Küçük', 'Gemischter Salat klein / Mixed salad small', 5.50, 'salatalar', '{}', 0, true),
('Karışık Salata Büyük', 'Gemischter Salat groß / Mixed salad large', 7.50, 'salatalar', '{}', 0, true),
('Çoban Salatası', 'Bauernsalat / Shepherd''s salad', 7.00, 'salatalar', '{}', 0, true),
('Tavuk Salatası', 'Salat mit Hähnchenbruststreifen / Salad with chicken breast strips', 15.90, 'salatalar', '{}', 0, true),

-- MEZELER (Soğuk Vorspeisen)
('Antep Ezme', 'Scharf gewürztes Püree aus Tomaten, Paprika und Zwiebeln', 6.00, 'mezeler', '{}', 2, true),
('Haydari', 'Joghurt verfeinert mit Knoblauch und Dill', 6.00, 'mezeler', '{}', 0, true),
('Havuç Ezme', 'Joghurt mit pürierten Möhren und Knoblauch', 5.50, 'mezeler', '{}', 0, true),
('Patlıcan Ezme', 'Joghurt mit gegrillter Aubergine verfeinert mit Knoblauch', 6.00, 'mezeler', '{}', 0, true),
('Karışık Meze Tabağı', 'Gemischter Vorspeisenteller', 13.90, 'mezeler', '{}', 0, true),
('Pommes Frites', 'Pommes Frites', 4.90, 'mezeler', '{}', 0, true),
('Mantar Şiş (Meze)', 'Gegrillte Champignons / Grilled mushrooms', 9.90, 'mezeler', '{}', 0, true),

-- VEJETERİYAN
('Mantar Saç Tava', 'Gebratene Champignons mit Gemüse und Reis', 15.90, 'vejeteryan', '{}', 0, true),
('Mantar Izgara (Yoğurtlu)', 'Gegrillte Champignons mit Joghurt, Reis und Salat', 15.90, 'vejeteryan', '{}', 0, true),
('Sebze Tava', 'Vegetarische Gemüsepfanne mit Reis', 15.90, 'vejeteryan', '{}', 0, true),
('Ispanaklı-Peynirli Pide', 'Teig mit Spinat und Weichkäse', 10.90, 'vejeteryan', '{}', 0, true),
('Ispanaklı-Peynirli-Yumurtalı Pide', 'Teig mit Spinat, Weichkäse und Ei', 11.90, 'vejeteryan', '{Yumurta}', 0, true),
('Mantar Şiş (Pilavlı ve Salatalı)', 'Champignonspieß mit Salat und Reis oder Pommes Frites', 14.90, 'vejeteryan', '{}', 0, true),
('Falafel Tabağı', 'Falafel Teller mit Salat und Reis', 15.90, 'vejeteryan', '{}', 0, true),

-- LAHMACUN
('Lahmacun To Go', 'Türkische Pizza / Turkish pizza', 5.00, 'lahmacun', '{}', 0, true),
('Salatalı Lahmacun Tabak', 'Türkische Pizza mit Salat', 8.90, 'lahmacun', '{}', 0, true),
('Salatalı Dönerli Lahmacun Tabak', 'Türkische Pizza mit Dönerfleisch und Salat', 14.90, 'lahmacun', '{}', 0, true),

-- PİDE
('Kıymalı Pide', 'Teig mit Hackfleischfüllung', 10.90, 'pide', '{}', 0, true),
('Kıymalı-Yumurtalı Pide', 'Teig mit Hackfleischfüllung und Ei', 11.90, 'pide', '{Yumurta}', 0, true),
('Kıymalı-Yumurtalı Kaşarlı Pide', 'Teig mit Hackfleischfüllung, Gouda Käse und Ei', 11.90, 'pide', '{Yumurta}', 0, true),
('Kaşarlı Pide', 'Teig mit Gouda Käse', 10.90, 'pide', '{Laktose}', 0, true),
('Sucuklu-Kaşarlı Pide', 'Teig mit türk. Knoblauchwurst und Gouda Käse', 10.90, 'pide', '{Laktose}', 0, true),
('Kuşbaşılı Pide', 'Teig mit Lammfleischstücken, Paprika und Tomaten', 12.90, 'pide', '{}', 0, true),
('Kuşbaşılı-Yumurtalı Pide', 'Teig mit Lammfleischstücken, Paprika, Tomaten und Ei', 12.90, 'pide', '{Yumurta}', 0, true),
('Dönerli Pide', 'Teigschiffchen mit Dönerfleisch', 12.90, 'pide', '{}', 0, true),

-- DÖNER TABAK
('Steak Döner Tabak', 'Dönerfleisch mit pikanter Würzmischung mit Reis oder Pommes und Salat', 16.90, 'doner', '{}', 1, true),
('Tavuk Döner Tabak', 'Geflügelfleischdöner mit Reis oder Pommes und Salat', 14.90, 'doner', '{}', 0, true),
('Karışık Döner Tabak', 'Gemischter Dönerteller mit Reis oder Pommes und Salat', 15.90, 'doner', '{}', 0, true),
('Bursa İskender', 'Dönerfleisch mit pikanter Würzmischung auf Fladenbrot mit Joghurt, Tomatensauce und Butter', 18.90, 'doner', '{Laktose, Gluten}', 1, true),

-- DÜRÜMLER (Wraps)
('Urfa Kebap Dürüm (Acısız)', 'Hackspieß Lammfleisch nach Urfa Art, mild', 11.90, 'durumlar', '{}', 0, true),
('Adana Kebap Dürüm (Acılı)', 'Hackspieß Lammfleisch nach Adana Art, scharf', 11.90, 'durumlar', '{}', 3, true),
('Tavuk Şiş Dürüm', 'Hähnchenbrustspieß Wrap', 11.90, 'durumlar', '{}', 0, true),
('Kuzu Şiş Dürüm', 'Lammspieß Wrap', 12.90, 'durumlar', '{}', 0, true),
('Ciğer Dürüm', 'Leberspieß Wrap', 9.90, 'durumlar', '{}', 0, true),
('Falafel Dürüm', 'Falafel Wrap', 8.90, 'durumlar', '{}', 0, true),

-- KEBAPLAR (Izgara — Tabak)
('Kremalı Tavuk', 'Hähnchenbrustfilet mit Champignons in Sahnesoße, mit Reis und Salat', 19.90, 'kebaplar', '{Laktose}', 0, true),
('Çökertme Kebabı', 'Lammspieß mit Tomaten, Paprika, Joghurt und Frittierte Kartoffeln', 19.90, 'kebaplar', '{Laktose}', 0, true),
('Çökertme Kebabı Dönerli', 'Dönerfleisch mit Tomaten, Paprika, Joghurt und Frittierte Kartoffeln', 17.90, 'kebaplar', '{Laktose}', 0, true),
('Çökertme Kebabı Tavuk Dönerli', 'Geflügelfleischdöner mit Tomaten, Paprika, Joghurt und Frittierte Kartoffeln', 16.90, 'kebaplar', '{Laktose}', 0, true),
('Paşalı Tantuni', 'Lammspieß zerkleinert mit Tomaten, Zwiebeln, Petersilie in Fladenbrot, Joghurt', 17.90, 'kebaplar', '{Laktose, Gluten}', 0, true),
('Adana Kebap', 'Hackspieß Lammfleisch nach Adana Art (Scharf), mit Reis und Salat', 19.50, 'kebaplar', '{}', 3, true),
('Urfa Kebap', 'Hackspieß Lammfleisch nach Urfa Art (mild), mit Reis und Salat', 19.50, 'kebaplar', '{}', 0, true),
('Kuzu Kaburga', 'Lammrippchen / Lamb ribs, mit Reis und Salat', 17.90, 'kebaplar', '{}', 0, true),
('Kuzu Şiş', 'Lammspieß, mit Reis und Salat', 22.90, 'kebaplar', '{}', 0, true),
('Izgara Köfte', 'Gegrillte Frikadellen / Grilled meatballs, mit Reis und Salat', 19.50, 'kebaplar', '{}', 0, true),
('Tavuk Şiş', 'Hähnchenbrustspieß, mit Reis und Salat', 19.50, 'kebaplar', '{}', 0, true),
('Ciğer Şiş', 'Leberspieß / Liver skewer, mit Reis und Salat', 17.90, 'kebaplar', '{}', 0, true),
('Tavuk Kanat', 'Hähnchenflügel / Chicken wings, mit Reis und Salat', 18.90, 'kebaplar', '{}', 0, true),
('Kuzu Pirzola (4 Adet)', 'Lammkotelett 4 Stück / Lamb chops 4 pieces, mit Reis und Salat', 23.90, 'kebaplar', '{}', 0, true),
('Beyti Sarma', 'Hackspieß in Fladenbrot mit Knoblauch-Joghurtsauce, Butter und Tomatensauce', 19.90, 'kebaplar', '{Laktose, Gluten}', 0, true),
('Adana Kebap Yoğurtlu', 'Hackspieß in Joghurt- und Tomatensauce auf geröstetem Fladenbrot', 19.90, 'kebaplar', '{Laktose, Gluten}', 3, true),
('Kuzu Şiş Yoğurtlu', 'Lammspieß in Joghurt- und Tomatensauce auf geröstetem Fladenbrot', 22.90, 'kebaplar', '{Laktose, Gluten}', 0, true),
('Ali Nazik', 'Lammspieß mit Auberginenpüree und Knoblauch-Joghurtsauce', 22.90, 'kebaplar', '{Laktose}', 1, true),
('Karışık Izgara', 'Gemischter Grillteller / Mixed grill plate, mit Reis und Salat', 24.90, 'kebaplar', '{}', 0, true),
('Kudret Spezial Izgara (2 Kişilik)', 'Kudret Spezial Grillteller für 2 Personen', 47.90, 'kebaplar', '{}', 0, true),

-- TAVA YEMEKLERİ
('Kuzu Saç Tava', 'Gebratenes Lammfleisch mit Tomaten und Paprika, mit Reis', 21.90, 'tava', '{}', 0, true),
('Tavuk Saç Tava', 'Gebratenes Hähnchenfleisch mit Tomaten und Paprika, mit Reis', 19.90, 'tava', '{}', 0, true),

-- TATLILAR
('Künefe', 'Nudelteig mit Käse und Honig / Shredded pastry with cheese and honey', 7.90, 'tatlilar', '{Laktose, Gluten}', 0, true),
('Künefe Kaymaklı Fıstıklı', 'Nudelteig mit Käse, Honig, Natursahne und Pistazien', 8.90, 'tatlilar', '{Laktose, Gluten, Kuruyemiş}', 0, true),
('Fırın Sütlaç', 'Milchreis aus dem Backofen / Baked rice pudding', 4.90, 'tatlilar', '{Laktose}', 0, true),
('Havuç Dilim Baklava Dondurmalı', 'Baklava mit Eis / Baklava with ice cream', 7.90, 'tatlilar', '{Gluten, Kuruyemiş}', 0, true),

-- SOĞUK İÇECEKLER
('Coca-Cola', '0,2 L', 3.20, 'icecekler', '{}', 0, true),
('Coca-Cola Light', '0,2 L', 3.20, 'icecekler', '{}', 0, true),
('Coca-Cola Zero', '0,2 L', 3.20, 'icecekler', '{}', 0, true),
('Fanta', '0,2 L', 3.20, 'icecekler', '{}', 0, true),
('Sprite', '0,2 L', 3.20, 'icecekler', '{}', 0, true),
('Mezzo Mix', '0,2 L', 3.20, 'icecekler', '{}', 0, true),
('FuzeTea (Pfirsich/Zitrone)', '0,3 L', 3.50, 'icecekler', '{}', 0, true),
('Ayran / Joghurtgetränk', '0,25 L', 2.30, 'icecekler', '{Laktose}', 0, true),
('Uludağ Gazoz', '0,25 L', 3.20, 'icecekler', '{}', 0, true),
('Apfelschorle', '0,25 L', 3.20, 'icecekler', '{}', 0, true),
('Mineralwasser Still (0,25 L)', '0,25 L', 3.20, 'icecekler', '{}', 0, true),
('Mineralwasser Sprudel (0,25 L)', '0,25 L', 3.20, 'icecekler', '{}', 0, true),
('Mineralwasser Still (0,75 L)', '0,75 L', 5.90, 'icecekler', '{}', 0, true),
('Mineralwasser Sprudel (0,75 L)', '0,75 L', 5.90, 'icecekler', '{}', 0, true),

-- SICAK İÇECEKLER
('Türk Çayı Küçük', 'Türkischer Tee klein / Small Turkish tea', 1.50, 'icecekler', '{}', 0, true),
('Türk Çayı Büyük', 'Türkischer Tee groß / Large Turkish tea', 2.50, 'icecekler', '{}', 0, true),
('Türk Kahvesi', 'Türkischer Mokka / Turkish coffee', 2.90, 'icecekler', '{}', 0, true);

-- 4. Özet
SELECT category, COUNT(*) as urun_sayisi
FROM products
GROUP BY category
ORDER BY category;

-- ============================================================
-- RLS POLİTİKALARI — Herkese okuma izni
-- ============================================================

-- Products tablosu: herkes okuyabilir
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "products_public_read" ON products;
CREATE POLICY "products_public_read" ON products FOR SELECT USING (true);

-- Categories tablosu: herkes okuyabilir  
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories_public_read" ON categories;
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (true);
