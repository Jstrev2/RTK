INSERT INTO attire_items (item_key, name, brand, category, gender, price, personas, weather, features, is_active) VALUES
('salomon-adv-skin-12', 'ADV Skin 12L Hydration Vest', 'Salomon', 'accessories', 'unisex', 160, ARRAY['all_weather','minimalist_pro'], ARRAY['warm','hot','cool'], ARRAY['12L capacity','flask included','trail-ready'], true),
('salomon-adv-skin-5', 'ADV Skin 5L Hydration Vest', 'Salomon', 'accessories', 'unisex', 130, ARRAY['speed_demon','minimalist_pro'], ARRAY['warm','hot'], ARRAY['5L capacity','race-ready','minimal bounce'], true),
('nathan-pinnacle-12l-w', 'Pinnacle 12L Hydration Vest', 'Nathan', 'accessories', 'womens', 170, ARRAY['all_weather','minimalist_pro'], ARRAY['warm','hot','cool'], ARRAY['13 pockets','women-specific fit','bladder compatible'], true),
('nathan-vaporkrar-4l', 'VaporKrar 4L Hydration Vest', 'Nathan', 'accessories', 'unisex', 140, ARRAY['speed_demon','minimalist_pro'], ARRAY['warm','hot'], ARRAY['4L race pack','dual flasks','minimal bounce'], true);

-- ============================================================
-- ACCESSORIES: Headlamps
-- ============================================================

INSERT INTO attire_items (item_key, name, brand, category, gender, price, personas, weather, features, is_active) VALUES
('petzl-nao-rl', 'NAO RL Headlamp', 'Petzl', 'accessories', 'unisex', 170, ARRAY['all_weather','speed_demon'], ARRAY['dark','cold','cool'], ARRAY['1500 lumen max','reactive lighting','rechargeable'], true),
('petzl-swift-rl', 'Swift RL Headlamp', 'Petzl', 'accessories', 'unisex', 130, ARRAY['all_weather','minimalist_pro'], ARRAY['dark','cold'], ARRAY['1100 lumen max','USB-C','reactive lighting'], true),
('petzl-actik-core', 'Actik Core Headlamp', 'Petzl', 'accessories', 'unisex', 70, ARRAY['all_weather','minimalist_pro'], ARRAY['dark','cold'], ARRAY['625 lumens','red light mode','rechargeable battery'], true),
('black-diamond-spot-400', 'Spot 400 Headlamp', 'Black Diamond', 'accessories', 'unisex', 45, ARRAY['all_weather','minimalist_pro'], ARRAY['dark','cold'], ARRAY['400 lumens','waterproof','red night vision'], true),
('biolite-headlamp-800-pro', 'HeadLamp 800 Pro', 'BioLite', 'accessories', 'unisex', 100, ARRAY['all_weather','minimalist_pro'], ARRAY['dark','cold'], ARRAY['800 lumens','7.5hr runtime','no-bounce fit'], true),
('nathan-neutron-fire-rx', 'Neutron Fire RX Headlamp', 'Nathan', 'accessories', 'unisex', 45, ARRAY['all_weather','minimalist_pro'], ARRAY['dark','cold'], ARRAY['running-specific angle','lightweight','rechargeable'], true);

-- ============================================================
-- ACCESSORIES: Sunglasses
-- ============================================================

INSERT INTO attire_items (item_key, name, brand, category, gender, price, personas, weather, features, is_active) VALUES
('goodr-og-sunglasses', 'OG Running Sunglasses', 'Goodr', 'accessories', 'unisex', 25, ARRAY['creative_cruiser','vibe_runner'], ARRAY['warm','hot'], ARRAY['no-slip matte','polarized','fun colorways'], true),
('goodr-wrap-g-sunglasses', 'Wrap G Running Sunglasses', 'Goodr', 'accessories', 'unisex', 35, ARRAY['creative_cruiser','vibe_runner'], ARRAY['warm','hot'], ARRAY['wraparound coverage','polarized','lightweight'], true),
('roka-sr-1x', 'SR-1X Performance Sunglasses', 'Roka', 'accessories', 'unisex', 195, ARRAY['speed_demon','minimalist_pro'], ARRAY['warm','hot'], ARRAY['C3 ultra-clarity lens','titanium frame','barely-there weight'], true),
('roka-phantom-ti', 'Phantom Titanium Sunglasses', 'Roka', 'accessories', 'unisex', 245, ARRAY['speed_demon','vibe_runner'], ARRAY['warm','hot'], ARRAY['titanium frame','ultralight','anti-fog'], true),
('oakley-radar-ev-path', 'Radar EV Path Prizm', 'Oakley', 'accessories', 'unisex', 204, ARRAY['speed_demon','all_weather'], ARRAY['warm','hot'], ARRAY['Prizm polarized','wraparound coverage','sweat management'], true),
('oakley-flak-2-0-xl-trail', 'Flak 2.0 XL Prizm Trail', 'Oakley', 'accessories', 'unisex', 201, ARRAY['all_weather','speed_demon'], ARRAY['warm','hot'], ARRAY['Prizm Trail Torch lens','tall lens coverage','O Matter frame'], true),
('nike-skylon-ace-sunglasses', 'Skylon Ace Sunglasses', 'Nike', 'accessories', 'unisex', 99, ARRAY['minimalist_pro','speed_demon'], ARRAY['warm','hot'], ARRAY['wraparound design','rubberized nose pad','ventilated lens'], true);

-- ============================================================
-- ACCESSORIES: Belts & Running Packs
-- ============================================================

INSERT INTO attire_items (item_key, name, brand, category, gender, price, personas, weather, features, is_active) VALUES
('flipbelt-classic', 'FlipBelt Classic', 'FlipBelt', 'accessories', 'unisex', 32, ARRAY['minimalist_pro','creative_cruiser'], ARRAY['warm','hot','cool'], ARRAY['no-bounce tubular','multiple openings','machine washable'], true),
('flipbelt-zipper', 'FlipBelt Zipper', 'FlipBelt', 'accessories', 'unisex', 39, ARRAY['minimalist_pro','all_weather'], ARRAY['warm','hot','cool'], ARRAY['secure zip closure','no-bounce','reflective'], true),
('nathan-zipster-max', 'Zipster Max Waistbelt', 'Nathan', 'accessories', 'unisex', 30, ARRAY['minimalist_pro','all_weather'], ARRAY['warm','hot','cool'], ARRAY['widest fitted belt','no-bounce','zip pocket'], true),
('spibelt-original', 'SPIbelt Original', 'SPIbelt', 'accessories', 'unisex', 25, ARRAY['minimalist_pro','speed_demon'], ARRAY['warm','hot'], ARRAY['expandable pocket','bounce-free','fits all phones'], true),
('naked-running-band', 'Running Band', 'Naked', 'accessories', 'unisex', 45, ARRAY['speed_demon','minimalist_pro'], ARRAY['warm','hot','cool'], ARRAY['ultra-minimal','no bounce','phone pocket'], true);

-- ============================================================
-- ACCESSORIES: Neck Gaiters, Headbands & Buffs
-- ============================================================

INSERT INTO attire_items (item_key, name, brand, category, gender, price, personas, weather, features, is_active) VALUES
('buff-original-neckwear', 'Original EcoStretch Neckwear', 'Buff', 'accessories', 'unisex', 22, ARRAY['all_weather','creative_cruiser'], ARRAY['cold','cool','wind'], ARRAY['12+ ways to wear','recycled materials','4-way stretch'], true),
('buff-thermonet-neckwear', 'ThermoNet Neckwear', 'Buff', 'accessories', 'unisex', 29, ARRAY['all_weather'], ARRAY['cold','wind','snow'], ARRAY['thermal insulation','Primaloft lining','lightweight'], true),
('outdoor-research-echo-ubertube', 'Echo Übertube Neck Gaiter', 'Outdoor Research', 'accessories', 'unisex', 22, ARRAY['all_weather','minimalist_pro'], ARRAY['cool','cold','wind'], ARRAY['UPF 15+','lightweight','breathable'], true),
('smartwool-merino-250-neck-gaiter', 'Merino 250 Neck Gaiter', 'Smartwool', 'accessories', 'unisex', 35, ARRAY['all_weather'], ARRAY['cold','wind','snow'], ARRAY['merino wool','temperature regulating','soft next-to-skin'], true),
('nike-dri-fit-headband', 'Dri-FIT Head Tie', 'Nike', 'accessories', 'unisex', 14, ARRAY['minimalist_pro','all_weather'], ARRAY['warm','hot'], ARRAY['Dri-FIT','no-slip silicone','sweat-wicking'], true),
('buff-coolnet-uv-headband', 'CoolNet UV+ Headband', 'Buff', 'accessories', 'unisex', 18, ARRAY['all_weather','creative_cruiser'], ARRAY['hot','warm'], ARRAY['UPF 50+','cooling technology','recycled materials'], true),
('outdoor-research-activeice-headband', 'ActiveIce Headband', 'Outdoor Research', 'accessories', 'unisex', 20, ARRAY['all_weather'], ARRAY['hot','warm'], ARRAY['active cooling','UPF 50+','moisture-wicking'], true),
('smartwool-active-headband', 'Active Ultralite Headband', 'Smartwool', 'accessories', 'unisex', 22, ARRAY['all_weather','minimalist_pro'], ARRAY['cool','cold'], ARRAY['merino blend','sweat-wicking','odor-resistant'], true);
