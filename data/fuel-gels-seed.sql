-- Fuel Gels Seed Data
-- Generated 2026-03-04 from web research
-- 48 products across 16 brands
-- Sources: manufacturer websites, REI, Running Warehouse, The Feed, Amazon

-- Create table if not exists
CREATE TABLE IF NOT EXISTS fuel_gels (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  item_key text UNIQUE NOT NULL,
  name text NOT NULL,
  brand text NOT NULL,
  carbs_g numeric,
  calories numeric,
  sodium_mg numeric,
  caffeine_mg numeric,
  flavors text[] DEFAULT '{}',
  notes text,
  image_url text,
  image_source text,
  product_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- GU Energy Labs
-- ============================================================

INSERT INTO fuel_gels (item_key, name, brand, carbs_g, calories, sodium_mg, caffeine_mg, notes, is_active) VALUES
('gu-original-energy-gel', 'GU Original Energy Gel', 'GU', 22, 100, 60, 0, 'Dual-source carbs (maltodextrin + fructose). 450mg amino acids. Non-caffeinated flavors.', true),
('gu-original-energy-gel-caffeinated', 'GU Original Energy Gel (Caffeinated)', 'GU', 22, 100, 60, 40, 'Dual-source carbs (maltodextrin + fructose). 450mg amino acids. 20-40mg caffeine depending on flavor.', true),
('gu-roctane-energy-gel', 'GU Roctane Ultra Endurance Energy Gel', 'GU', 21, 100, 125, 0, '3x amino acids (1425mg) and 2x sodium vs Original. Dual-source carbs. For high-intensity efforts.', true),
('gu-roctane-energy-gel-caffeinated', 'GU Roctane Ultra Endurance Energy Gel (Caffeinated)', 'GU', 21, 100, 125, 35, '3x amino acids (1425mg) and 2x sodium vs Original. 35mg caffeine. For high-intensity efforts.', true),
('gu-liquid-energy-gel', 'GU Liquid Energy Gel', 'GU', 22, 100, 75, 0, 'Thinner, more liquid consistency. 60g packet. 450mg amino acids. No water needed.', true),
('gu-liquid-energy-gel-caffeinated', 'GU Liquid Energy Gel (Caffeinated)', 'GU', 22, 100, 75, 40, 'Thinner, more liquid consistency. 60g packet. 40mg caffeine. 450mg amino acids.', true)
ON CONFLICT (item_key) DO UPDATE SET
  name = EXCLUDED.name, brand = EXCLUDED.brand, carbs_g = EXCLUDED.carbs_g,
  calories = EXCLUDED.calories, sodium_mg = EXCLUDED.sodium_mg, caffeine_mg = EXCLUDED.caffeine_mg,
  notes = EXCLUDED.notes, is_active = EXCLUDED.is_active, updated_at = now();

-- ============================================================
-- Maurten
-- ============================================================

INSERT INTO fuel_gels (item_key, name, brand, carbs_g, calories, sodium_mg, caffeine_mg, notes, is_active) VALUES
('maurten-gel-100', 'Maurten Gel 100', 'Maurten', 25, 100, 20, 0, 'Patented hydrogel technology. 0.8:1 fructose:glucose ratio. Minimal taste. 40g packet.', true),
('maurten-gel-100-caf-100', 'Maurten Gel 100 CAF 100', 'Maurten', 25, 100, 22, 100, 'Hydrogel technology with 100mg caffeine. 0.8:1 fructose:glucose ratio. 40g packet.', true),
('maurten-gel-160', 'Maurten Gel 160', 'Maurten', 40, 160, 30, 0, 'Larger hydrogel packet with 40g carbs. 0.8:1 fructose:glucose ratio. 65g packet. Premium price point.', true)
ON CONFLICT (item_key) DO UPDATE SET
  name = EXCLUDED.name, brand = EXCLUDED.brand, carbs_g = EXCLUDED.carbs_g,
  calories = EXCLUDED.calories, sodium_mg = EXCLUDED.sodium_mg, caffeine_mg = EXCLUDED.caffeine_mg,
  notes = EXCLUDED.notes, is_active = EXCLUDED.is_active, updated_at = now();

-- ============================================================
-- Science in Sport (SiS)
-- ============================================================

INSERT INTO fuel_gels (item_key, name, brand, carbs_g, calories, sodium_mg, caffeine_mg, notes, is_active) VALUES
('sis-go-isotonic-energy-gel', 'SiS GO Isotonic Energy Gel', 'Science in Sport', 22, 87, 10, 0, 'World''s first isotonic gel. No water needed. Maltodextrin-based. 60ml packet.', true),
('sis-go-energy-caffeine-gel', 'SiS GO Energy + Caffeine Gel', 'Science in Sport', 22, 87, 10, 75, 'Isotonic formula with 75mg caffeine. Same easy-digest base as standard GO gel. 60ml packet.', true),
('sis-go-energy-electrolyte-gel', 'SiS GO Energy + Electrolyte Gel', 'Science in Sport', 22, 87, 118, 0, 'Enhanced electrolytes: 118mg sodium, 9.5mg potassium, 1.5mg magnesium. Not isotonic.', true)
ON CONFLICT (item_key) DO UPDATE SET
  name = EXCLUDED.name, brand = EXCLUDED.brand, carbs_g = EXCLUDED.carbs_g,
  calories = EXCLUDED.calories, sodium_mg = EXCLUDED.sodium_mg, caffeine_mg = EXCLUDED.caffeine_mg,
  notes = EXCLUDED.notes, is_active = EXCLUDED.is_active, updated_at = now();

-- ============================================================
-- Huma
-- ============================================================

INSERT INTO fuel_gels (item_key, name, brand, carbs_g, calories, sodium_mg, caffeine_mg, notes, is_active) VALUES
('huma-chia-energy-gel', 'Huma Chia Energy Gel', 'Huma', 21, 100, 105, 0, 'Real-food based with chia seeds. Made with fruit purees. Gentle on stomach.', true),
('huma-chia-energy-gel-plus', 'Huma Chia Energy Gel Plus', 'Huma', 21, 100, 245, 0, 'Double electrolytes vs Original: 245mg sodium, 50-145mg potassium, plus magnesium and calcium.', true),
('huma-chia-energy-gel-caffeinated', 'Huma Chia Energy Gel (Caffeinated)', 'Huma', 24, 100, 105, 25, 'Real-food based with chia seeds plus 25mg caffeine. Same gentle formula as Original.', true)
ON CONFLICT (item_key) DO UPDATE SET
  name = EXCLUDED.name, brand = EXCLUDED.brand, carbs_g = EXCLUDED.carbs_g,
  calories = EXCLUDED.calories, sodium_mg = EXCLUDED.sodium_mg, caffeine_mg = EXCLUDED.caffeine_mg,
  notes = EXCLUDED.notes, is_active = EXCLUDED.is_active, updated_at = now();

-- ============================================================
-- Honey Stinger
-- ============================================================

INSERT INTO fuel_gels (item_key, name, brand, carbs_g, calories, sodium_mg, caffeine_mg, notes, is_active) VALUES
('honey-stinger-organic-energy-gel', 'Honey Stinger Organic Energy Gel', 'Honey Stinger', 24, 100, 50, 0, 'Honey-based organic formula. Contains B vitamins. USDA Organic. 31g packet.', true),
('honey-stinger-organic-energy-gel-caffeinated', 'Honey Stinger Organic Energy Gel (Caffeinated)', 'Honey Stinger', 24, 100, 50, 32, 'Honey-based with 32mg caffeine from green tea. USDA Organic. 31g packet.', true),
('honey-stinger-gold-energy-gel', 'Honey Stinger Gold Energy Gel', 'Honey Stinger', 24, 90, 45, 0, 'Gluten-free. Pure honey base with B vitamins. Simpler ingredient list than Organic line. 31g packet.', true)
ON CONFLICT (item_key) DO UPDATE SET
  name = EXCLUDED.name, brand = EXCLUDED.brand, carbs_g = EXCLUDED.carbs_g,
  calories = EXCLUDED.calories, sodium_mg = EXCLUDED.sodium_mg, caffeine_mg = EXCLUDED.caffeine_mg,
  notes = EXCLUDED.notes, is_active = EXCLUDED.is_active, updated_at = now();

-- ============================================================
-- Precision Fuel & Hydration
-- ============================================================

INSERT INTO fuel_gels (item_key, name, brand, carbs_g, calories, sodium_mg, caffeine_mg, notes, is_active) VALUES
('precision-fuel-pf-30-gel', 'PF 30 Gel', 'Precision Fuel & Hydration', 30, 120, 0, 0, '30g carbs in a compact 50g packet. Designed to separate fueling from hydration. Very mild flavor.', true),
('precision-fuel-pf-30-caffeine-gel', 'PF 30 Caffeine Gel', 'Precision Fuel & Hydration', 30, 120, 0, 100, '30g carbs + 100mg caffeine. 51g packet. Separate fueling from hydration philosophy.', true)
ON CONFLICT (item_key) DO UPDATE SET
  name = EXCLUDED.name, brand = EXCLUDED.brand, carbs_g = EXCLUDED.carbs_g,
  calories = EXCLUDED.calories, sodium_mg = EXCLUDED.sodium_mg, caffeine_mg = EXCLUDED.caffeine_mg,
  notes = EXCLUDED.notes, is_active = EXCLUDED.is_active, updated_at = now();

-- ============================================================
-- Neversecond
-- ============================================================

INSERT INTO fuel_gels (item_key, name, brand, carbs_g, calories, sodium_mg, caffeine_mg, notes, is_active) VALUES
('neversecond-c30-energy-gel', 'Neversecond C30 Energy Gel', 'Neversecond', 30, 120, 200, 0, '2:1 glucose:fructose ratio. 30g carbs per 60ml gel. High sodium content (200mg).', true),
('neversecond-c30-plus-caffeine-gel', 'Neversecond C30+ Caffeine Energy Gel', 'Neversecond', 30, 120, 200, 75, '2:1 glucose:fructose ratio with 75mg caffeine. 30g carbs per 60ml gel. High sodium (200mg).', true)
ON CONFLICT (item_key) DO UPDATE SET
  name = EXCLUDED.name, brand = EXCLUDED.brand, carbs_g = EXCLUDED.carbs_g,
  calories = EXCLUDED.calories, sodium_mg = EXCLUDED.sodium_mg, caffeine_mg = EXCLUDED.caffeine_mg,
  notes = EXCLUDED.notes, is_active = EXCLUDED.is_active, updated_at = now();

-- ============================================================
-- Spring Energy
-- ============================================================

INSERT INTO fuel_gels (item_key, name, brand, carbs_g, calories, sodium_mg, caffeine_mg, notes, is_active) VALUES
('spring-energy-awesome-sauce', 'Spring Energy Awesome Sauce', 'Spring Energy', 28, 180, 45, 0, 'Vegan real-food gel. Reformulated 2024. 60g packet. 7g fat. Note: past label accuracy controversy.', true),
('spring-energy-canaberry', 'Spring Energy CanaBerry', 'Spring Energy', 17, 100, 30, 0, 'Vegan real-food gel. Lighter option. 46g packet. Rice, banana, strawberry, coconut.', true),
('spring-energy-hill-aid', 'Spring Energy Hill Aid', 'Spring Energy', 19, 100, 35, 30, 'Real-food gel with 30mg caffeine. Mango, rice, banana, honey, coconut, mint. Designed for climbs.', true),
('spring-energy-speednut', 'Spring Energy Speednut', 'Spring Energy', 33, 250, 50, 50, 'High-calorie real-food gel with 50mg caffeine. Medium-chain fatty acids. For extreme efforts.', true),
('spring-energy-long-haul', 'Spring Energy Long Haul', 'Spring Energy', 30, 200, 40, 0, 'High-calorie real-food gel for ultras. Rice, banana, peanuts, honey, molasses, chia seeds.', true)
ON CONFLICT (item_key) DO UPDATE SET
  name = EXCLUDED.name, brand = EXCLUDED.brand, carbs_g = EXCLUDED.carbs_g,
  calories = EXCLUDED.calories, sodium_mg = EXCLUDED.sodium_mg, caffeine_mg = EXCLUDED.caffeine_mg,
  notes = EXCLUDED.notes, is_active = EXCLUDED.is_active, updated_at = now();

-- ============================================================
-- Clif
-- ============================================================

INSERT INTO fuel_gels (item_key, name, brand, carbs_g, calories, sodium_mg, caffeine_mg, notes, is_active) VALUES
('clif-shot-energy-gel', 'Clif Shot Energy Gel', 'Clif', 25, 100, 40, 0, '85-90% organic ingredients. Organic cane sugar. Litter Leash packaging. Non-caffeinated flavors.', true),
('clif-shot-energy-gel-25mg-caffeine', 'Clif Shot Energy Gel (25mg Caffeine)', 'Clif', 25, 100, 40, 25, '85-90% organic. 25mg caffeine from green tea extract. Litter Leash packaging.', true),
('clif-shot-energy-gel-50mg-caffeine', 'Clif Shot Energy Gel (50mg Caffeine)', 'Clif', 25, 100, 40, 50, '85-90% organic. 50mg caffeine from green tea extract. Litter Leash packaging.', true),
('clif-shot-energy-gel-100mg-caffeine', 'Clif Shot Energy Gel (100mg Caffeine)', 'Clif', 25, 100, 40, 100, '85-90% organic. 100mg caffeine from green tea extract. High-caffeine option.', true)
ON CONFLICT (item_key) DO UPDATE SET
  name = EXCLUDED.name, brand = EXCLUDED.brand, carbs_g = EXCLUDED.carbs_g,
  calories = EXCLUDED.calories, sodium_mg = EXCLUDED.sodium_mg, caffeine_mg = EXCLUDED.caffeine_mg,
  notes = EXCLUDED.notes, is_active = EXCLUDED.is_active, updated_at = now();

-- ============================================================
-- Skratch Labs
-- ============================================================

INSERT INTO fuel_gels (item_key, name, brand, carbs_g, calories, sodium_mg, caffeine_mg, notes, is_active) VALUES
('skratch-labs-energy-chews-sport-fuel', 'Skratch Labs Energy Chews Sport Fuel', 'Skratch Labs', 40, 160, 80, 0, 'Chew format (not gel). Real fruit ingredients. 40g carbs per package. Gel alternative.', true),
('skratch-labs-energy-chews-caffeinated', 'Skratch Labs Energy Chews Sport Fuel (Caffeinated)', 'Skratch Labs', 40, 160, 80, 50, 'Chew format with 50mg caffeine from green tea. Real fruit. 40g carbs per package.', true)
ON CONFLICT (item_key) DO UPDATE SET
  name = EXCLUDED.name, brand = EXCLUDED.brand, carbs_g = EXCLUDED.carbs_g,
  calories = EXCLUDED.calories, sodium_mg = EXCLUDED.sodium_mg, caffeine_mg = EXCLUDED.caffeine_mg,
  notes = EXCLUDED.notes, is_active = EXCLUDED.is_active, updated_at = now();

-- ============================================================
-- Naak
-- ============================================================

INSERT INTO fuel_gels (item_key, name, brand, carbs_g, calories, sodium_mg, caffeine_mg, notes, is_active) VALUES
('naak-ultra-energy-gel', 'Naak Ultra Energy Gel', 'Naak', 27, 200, 187, 0, '1:1 short/complex carb ratio. 2g protein with BCAAs. 460mg total electrolytes. High calorie density.', true),
('naak-ultra-energy-gel-caffeine', 'Naak Ultra Energy Gel (Caffeine)', 'Naak', 27, 200, 187, 35, '1:1 short/complex carb ratio. 2g protein with BCAAs. 460mg total electrolytes. 35mg caffeine.', true)
ON CONFLICT (item_key) DO UPDATE SET
  name = EXCLUDED.name, brand = EXCLUDED.brand, carbs_g = EXCLUDED.carbs_g,
  calories = EXCLUDED.calories, sodium_mg = EXCLUDED.sodium_mg, caffeine_mg = EXCLUDED.caffeine_mg,
  notes = EXCLUDED.notes, is_active = EXCLUDED.is_active, updated_at = now();

-- ============================================================
-- Hammer Nutrition
-- ============================================================

INSERT INTO fuel_gels (item_key, name, brand, carbs_g, calories, sodium_mg, caffeine_mg, notes, is_active) VALUES
('hammer-nutrition-hammer-gel', 'Hammer Gel', 'Hammer Nutrition', 22, 90, 25, 0, 'Concentrated complex carb gel (syrup consistency). 33g serving. Available in packets and jugs.', true),
('hammer-nutrition-hammer-gel-espresso', 'Hammer Gel Espresso', 'Hammer Nutrition', 22, 90, 25, 50, 'Concentrated complex carb gel with 50mg caffeine. Syrup consistency. 33g serving.', true),
('hammer-nutrition-hammer-gel-tropical', 'Hammer Gel Tropical', 'Hammer Nutrition', 22, 90, 25, 25, 'Concentrated complex carb gel with 25mg caffeine. Syrup consistency. 33g serving.', true)
ON CONFLICT (item_key) DO UPDATE SET
  name = EXCLUDED.name, brand = EXCLUDED.brand, carbs_g = EXCLUDED.carbs_g,
  calories = EXCLUDED.calories, sodium_mg = EXCLUDED.sodium_mg, caffeine_mg = EXCLUDED.caffeine_mg,
  notes = EXCLUDED.notes, is_active = EXCLUDED.is_active, updated_at = now();

-- ============================================================
-- PowerBar
-- ============================================================

INSERT INTO fuel_gels (item_key, name, brand, carbs_g, calories, sodium_mg, caffeine_mg, notes, is_active) VALUES
('powerbar-powergel-original', 'PowerBar PowerGel Original', 'PowerBar', 27, 107, 200, 0, 'Dual-source carbs (maltodextrin + fructose). 41g packet. C2MAX carb blend. High sodium (200mg).', true),
('powerbar-powergel-caffeinated', 'PowerBar PowerGel Original (Caffeinated)', 'PowerBar', 27, 107, 200, 50, 'Dual-source carbs with 50mg caffeine. 41g packet. C2MAX carb blend. High sodium (200mg).', true)
ON CONFLICT (item_key) DO UPDATE SET
  name = EXCLUDED.name, brand = EXCLUDED.brand, carbs_g = EXCLUDED.carbs_g,
  calories = EXCLUDED.calories, sodium_mg = EXCLUDED.sodium_mg, caffeine_mg = EXCLUDED.caffeine_mg,
  notes = EXCLUDED.notes, is_active = EXCLUDED.is_active, updated_at = now();

-- ============================================================
-- Torq
-- ============================================================

INSERT INTO fuel_gels (item_key, name, brand, carbs_g, calories, sodium_mg, caffeine_mg, notes, is_active) VALUES
('torq-energy-gel', 'Torq Energy Gel', 'Torq', 30, 113, 49, 0, '2:1 maltodextrin:fructose. All 5 electrolytes included. 45g serving. Research-proven ratio.', true),
('torq-energy-gel-caffeinated', 'Torq Energy Gel (Caffeinated)', 'Torq', 30, 113, 49, 89, '2:1 maltodextrin:fructose with 89mg caffeine from guarana. All 5 electrolytes. 45g serving.', true)
ON CONFLICT (item_key) DO UPDATE SET
  name = EXCLUDED.name, brand = EXCLUDED.brand, carbs_g = EXCLUDED.carbs_g,
  calories = EXCLUDED.calories, sodium_mg = EXCLUDED.sodium_mg, caffeine_mg = EXCLUDED.caffeine_mg,
  notes = EXCLUDED.notes, is_active = EXCLUDED.is_active, updated_at = now();

-- ============================================================
-- UnTapped
-- ============================================================

INSERT INTO fuel_gels (item_key, name, brand, carbs_g, calories, sodium_mg, caffeine_mg, notes, is_active) VALUES
('untapped-maple-energy-gel', 'UnTapped Maple Energy Gel', 'UnTapped', 26, 100, 5, 0, 'Pure Vermont maple syrup. Single ingredient. Low glycemic. Natural minerals. 38g packet.', true),
('untapped-salted-cocoa-energy-gel', 'UnTapped Salted Cocoa Energy Gel', 'UnTapped', 26, 100, 60, 0, 'Maple syrup + organic cocoa + sea salt. Higher sodium than plain maple. 38g packet.', true),
('untapped-coffee-energy-gel', 'UnTapped Coffee Energy Gel', 'UnTapped', 26, 100, 5, 27, 'Maple syrup + organic coffee. 27mg naturally occurring caffeine. Low glycemic. 38g packet.', true)
ON CONFLICT (item_key) DO UPDATE SET
  name = EXCLUDED.name, brand = EXCLUDED.brand, carbs_g = EXCLUDED.carbs_g,
  calories = EXCLUDED.calories, sodium_mg = EXCLUDED.sodium_mg, caffeine_mg = EXCLUDED.caffeine_mg,
  notes = EXCLUDED.notes, is_active = EXCLUDED.is_active, updated_at = now();

-- ============================================================
-- Muir Energy
-- ============================================================

INSERT INTO fuel_gels (item_key, name, brand, carbs_g, calories, sodium_mg, caffeine_mg, notes, is_active) VALUES
('muir-energy-fast-burning-gel', 'Muir Energy Fast Burning Gel', 'Muir Energy', 28, 120, 40, 0, '4-6 organic whole food ingredients. Fast-burning for quick energy. 100% organic, vegan, gluten-free.', true),
('muir-energy-slow-burning-gel', 'Muir Energy Slow Burning Gel', 'Muir Energy', 22, 150, 40, 0, 'Raw nut/seed butter base for slow sustained energy. Best for ultras and long efforts. 100% organic.', true),
('muir-energy-mate-caffeinated-gel', 'Muir Energy Mate Caffeinated Gel', 'Muir Energy', 25, 140, 40, 90, '90mg caffeine from yerba mate. Organic whole food ingredients. Over 300mg potassium per packet.', true)
ON CONFLICT (item_key) DO UPDATE SET
  name = EXCLUDED.name, brand = EXCLUDED.brand, carbs_g = EXCLUDED.carbs_g,
  calories = EXCLUDED.calories, sodium_mg = EXCLUDED.sodium_mg, caffeine_mg = EXCLUDED.caffeine_mg,
  notes = EXCLUDED.notes, is_active = EXCLUDED.is_active, updated_at = now();
