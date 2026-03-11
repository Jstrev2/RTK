-- Running Apparel Database Seed
-- Generated 2026-03-04 from web research of 2025-2026 popular running products
-- ~200 items across tops, bottoms, outerwear, accessories from 38+ brands

-- ============================================================
-- TOPS: Singlets
-- ============================================================
INSERT INTO attire_items (item_key, name, brand, category, gender, price, personas, weather, features, is_active) VALUES
('nike-aeroswift-singlet', 'AeroSwift Dri-FIT ADV Singlet', 'Nike', 'tops', 'mens', 70, ARRAY['speed_demon'], ARRAY['hot','warm'], ARRAY['ultralight','bonded seams','perforated ventilation'], true),
('nike-aeroswift-singlet-w', 'AeroSwift Dri-FIT ADV Singlet', 'Nike', 'tops', 'womens', 70, ARRAY['speed_demon'], ARRAY['hot','warm'], ARRAY['ultralight','bonded seams','perforated ventilation'], true),
('tracksmith-van-cortlandt-singlet', 'Van Cortlandt Singlet', 'Tracksmith', 'tops', 'mens', 70, ARRAY['speed_demon','vibe_runner'], ARRAY['hot','warm'], ARRAY['racerback','lightweight mesh','heritage design'], true),
('tracksmith-van-cortlandt-singlet-w', 'Van Cortlandt Singlet', 'Tracksmith', 'tops', 'womens', 70, ARRAY['speed_demon','vibe_runner'], ARRAY['hot','warm'], ARRAY['racerback','lightweight mesh','heritage design'], true),
('tracksmith-twilight-singlet', 'Twilight Singlet', 'Tracksmith', 'tops', 'mens', 65, ARRAY['speed_demon','creative_cruiser'], ARRAY['hot','warm'], ARRAY['ultralight','racerback','fast-drying'], true),
('rabbit-go-time-singlet-w', 'Go Time Singlet', 'Rabbit', 'tops', 'womens', 58, ARRAY['speed_demon','vibe_runner'], ARRAY['hot','warm'], ARRAY['built-in bra','antibacterial','fast-drying'], true),
('saysky-flow-singlet', 'Flow Singlet', 'Saysky', 'tops', 'mens', 65, ARRAY['speed_demon','creative_cruiser'], ARRAY['hot','warm'], ARRAY['46g ultralight','racerback','bold prints'], true),
('saysky-pace-singlet-w', 'Pace Singlet', 'Saysky', 'tops', 'womens', 60, ARRAY['speed_demon','creative_cruiser'], ARRAY['hot','warm'], ARRAY['lightweight','bold prints','stretchy'], true),
('hoka-performance-singlet', 'Performance Run Singlet', 'Hoka', 'tops', 'mens', 48, ARRAY['speed_demon','minimalist_pro'], ARRAY['hot','warm'], ARRAY['moisture-wicking','lightweight','reflective'], true),
('adidas-adizero-singlet', 'Adizero Running Singlet', 'Adidas', 'tops', 'mens', 45, ARRAY['speed_demon'], ARRAY['hot','warm'], ARRAY['AEROREADY','lightweight mesh','race-fit'], true),
('oiselle-flyout-singlet-w', 'Flyout Singlet', 'Oiselle', 'tops', 'womens', 62, ARRAY['speed_demon','vibe_runner'], ARRAY['hot','warm'], ARRAY['plya fabric','racerback','sweat-wicking'], true),
('on-performance-singlet', 'Performance Singlet', 'On Running', 'tops', 'mens', 60, ARRAY['speed_demon','minimalist_pro'], ARRAY['hot','warm'], ARRAY['ultralight','seamless','moisture-wicking'], true);

-- ============================================================
-- TOPS: Tanks
-- ============================================================
INSERT INTO attire_items (item_key, name, brand, category, gender, price, personas, weather, features, is_active) VALUES
('nike-dri-fit-race-tank', 'Dri-FIT Race Tank', 'Nike', 'tops', 'mens', 40, ARRAY['speed_demon','minimalist_pro'], ARRAY['hot','warm'], ARRAY['Dri-FIT','lightweight','breathable mesh'], true),
('nike-dri-fit-race-tank-w', 'Dri-FIT Race Tank', 'Nike', 'tops', 'womens', 40, ARRAY['speed_demon','minimalist_pro'], ARRAY['hot','warm'], ARRAY['Dri-FIT','lightweight','breathable mesh'], true),
('brooks-sprint-free-tank-w', 'Sprint Free Tank', 'Brooks', 'tops', 'womens', 42, ARRAY['creative_cruiser','vibe_runner'], ARRAY['hot','warm'], ARRAY['DriLayer','anti-odor','relaxed fit'], true),
('new-balance-accelerate-tank', 'Accelerate Tank', 'New Balance', 'tops', 'mens', 35, ARRAY['minimalist_pro','speed_demon'], ARRAY['hot','warm'], ARRAY['NB DRY','lightweight','classic fit'], true),
('asics-ventilate-tank', 'Ventilate Actibreeze Tank', 'ASICS', 'tops', 'mens', 50, ARRAY['speed_demon','all_weather'], ARRAY['hot','warm'], ARRAY['3D ventilation','ultralight','cooling'], true),
('saucony-stopwatch-tank', 'Stopwatch Graphic Tank', 'Saucony', 'tops', 'mens', 38, ARRAY['creative_cruiser','vibe_runner'], ARRAY['hot','warm'], ARRAY['RunDry','odor-resistant','relaxed fit'], true),
('lululemon-fast-free-tank-w', 'Fast and Free Race Tank', 'Lululemon', 'tops', 'womens', 58, ARRAY['speed_demon','vibe_runner'], ARRAY['hot','warm'], ARRAY['Nulux fabric','no-bounce','built-in bra'], true),
('janji-groundwork-tank', 'Groundwork Tank', 'Janji', 'tops', 'mens', 52, ARRAY['creative_cruiser','vibe_runner'], ARRAY['hot','warm'], ARRAY['recycled materials','artist collab','moisture-wicking'], true),
('satisfy-mothtech-tank', 'MothTech Tank', 'Satisfy', 'tops', 'mens', 95, ARRAY['vibe_runner','creative_cruiser'], ARRAY['hot','warm'], ARRAY['engineered ventilation holes','luxury fabric','minimalist'], true),
('under-armour-iso-chill-tank', 'Iso-Chill Run Tank', 'Under Armour', 'tops', 'mens', 40, ARRAY['minimalist_pro','all_weather'], ARRAY['hot','warm'], ARRAY['Iso-Chill cooling','anti-odor','mesh panels'], true),
('athleta-chi-tank-w', 'Chi Tank', 'Athleta', 'tops', 'womens', 49, ARRAY['creative_cruiser','vibe_runner'], ARRAY['hot','warm'], ARRAY['Sculptek fabric','built-in bra','inclusive sizing'], true),
('girlfriend-collective-run-tank-w', 'Run Tank', 'Girlfriend Collective', 'tops', 'womens', 48, ARRAY['vibe_runner','creative_cruiser'], ARRAY['hot','warm'], ARRAY['recycled materials','inclusive sizing','moisture-wicking'], true);

-- ============================================================
-- TOPS: T-Shirts
-- ============================================================
INSERT INTO attire_items (item_key, name, brand, category, gender, price, personas, weather, features, is_active) VALUES
('nike-dri-fit-uv-miler-tee', 'Dri-FIT UV Miler Tee', 'Nike', 'tops', 'mens', 45, ARRAY['minimalist_pro','all_weather'], ARRAY['warm','hot'], ARRAY['UPF 40+','Dri-FIT','reflective'], true),
('nike-dri-fit-uv-miler-tee-w', 'Dri-FIT UV Miler Tee', 'Nike', 'tops', 'womens', 45, ARRAY['minimalist_pro','all_weather'], ARRAY['warm','hot'], ARRAY['UPF 40+','Dri-FIT','reflective'], true),
('adidas-own-the-run-tee', 'Own The Run Tee', 'Adidas', 'tops', 'mens', 35, ARRAY['minimalist_pro','creative_cruiser'], ARRAY['warm','hot'], ARRAY['AEROREADY','recycled materials','reflective'], true),
('brooks-distance-tee', 'Distance Graphic Tee', 'Brooks', 'tops', 'mens', 40, ARRAY['creative_cruiser','vibe_runner'], ARRAY['warm','hot'], ARRAY['DriLayer','anti-odor','relaxed fit'], true),
('on-performance-tee', 'Performance-T', 'On Running', 'tops', 'mens', 60, ARRAY['minimalist_pro','speed_demon'], ARRAY['warm','hot'], ARRAY['Swiss engineered','ultralight','seamless'], true),
('hoka-airolite-tee', 'Airolite Run Tee', 'Hoka', 'tops', 'mens', 42, ARRAY['minimalist_pro','speed_demon'], ARRAY['warm','hot'], ARRAY['ultralight','moisture-wicking','breathable'], true),
('saucony-stopwatch-tee', 'Stopwatch Short Sleeve', 'Saucony', 'tops', 'mens', 40, ARRAY['minimalist_pro','creative_cruiser'], ARRAY['warm','hot'], ARRAY['RunDry','ventilated','odor-resistant'], true),
('puma-run-favorite-tee', 'Run Favorite Velocity Tee', 'Puma', 'tops', 'mens', 35, ARRAY['minimalist_pro','creative_cruiser'], ARRAY['warm','hot'], ARRAY['dryCELL','lightweight','reflective'], true),
('craft-adv-essence-tee', 'ADV Essence Tee', 'Craft', 'tops', 'mens', 40, ARRAY['minimalist_pro','all_weather'], ARRAY['warm','cool'], ARRAY['moisture transport','ergonomic fit','flatlock seams'], true),
('vuori-strato-tech-tee', 'Strato Tech Tee', 'Vuori', 'tops', 'mens', 58, ARRAY['vibe_runner','creative_cruiser'], ARRAY['warm','hot'], ARRAY['DreamKnit fabric','anti-odor','versatile'], true),
('saysky-pace-tee', 'Pace T-Shirt', 'Saysky', 'tops', 'mens', 55, ARRAY['creative_cruiser','vibe_runner'], ARRAY['warm','hot'], ARRAY['bold prints','soft interior','stretchy'], true),
('rabbit-ezrun-tee', 'EZRun Tee', 'Rabbit', 'tops', 'mens', 48, ARRAY['vibe_runner','minimalist_pro'], ARRAY['warm','hot'], ARRAY['baby-soft fabric','anti-odor','relaxed fit'], true);

-- ============================================================
-- TOPS: Long Sleeves
-- ============================================================
INSERT INTO attire_items (item_key, name, brand, category, gender, price, personas, weather, features, is_active) VALUES
('nike-dri-fit-element-half-zip', 'Dri-FIT Element Half-Zip', 'Nike', 'tops', 'mens', 75, ARRAY['all_weather','minimalist_pro'], ARRAY['cool','cold'], ARRAY['Dri-FIT','thumbholes','half-zip ventilation'], true),
('nike-dri-fit-element-half-zip-w', 'Dri-FIT Element Half-Zip', 'Nike', 'tops', 'womens', 75, ARRAY['all_weather','minimalist_pro'], ARRAY['cool','cold'], ARRAY['Dri-FIT','thumbholes','half-zip ventilation'], true),
('brooks-dash-half-zip', 'Dash Half-Zip', 'Brooks', 'tops', 'mens', 72, ARRAY['all_weather','minimalist_pro'], ARRAY['cool','cold'], ARRAY['DriLayer','recycled polyester','semi-fitted'], true),
('brooks-notch-thermal-ls', 'Notch Thermal Long Sleeve 3.0', 'Brooks', 'tops', 'mens', 68, ARRAY['all_weather','minimalist_pro'], ARRAY['cold','cool'], ARRAY['thermal fabric','DriLayer','reflective'], true),
('new-balance-heat-grid-half-zip', 'Athletics Heat Grid Half-Zip', 'New Balance', 'tops', 'mens', 80, ARRAY['all_weather','minimalist_pro'], ARRAY['cold','cool','wind'], ARRAY['3D waffle knit','thumbholes','extra-long sleeves'], true),
('new-balance-accelerate-ls', 'Accelerate Long Sleeve', 'New Balance', 'tops', 'mens', 50, ARRAY['minimalist_pro','all_weather'], ARRAY['cool','cold'], ARRAY['NB DRY','pindot mesh','quick-dry'], true),
('on-weather-shirt', 'Weather Shirt', 'On Running', 'tops', 'mens', 100, ARRAY['all_weather','minimalist_pro'], ARRAY['cool','cold','wind'], ARRAY['weather protection','breathable','lightweight'], true),
('tracksmith-brighton-base-layer', 'Brighton Base Layer', 'Tracksmith', 'tops', 'mens', 88, ARRAY['all_weather','vibe_runner'], ARRAY['cold','cool'], ARRAY['merino blend','odor-resistant','heritage design'], true),
('craft-core-dry-active-ls', 'Core Dry Active Comfort LS', 'Craft', 'tops', 'mens', 45, ARRAY['all_weather','minimalist_pro'], ARRAY['cold','cool'], ARRAY['baselayer','moisture transport','flatlock seams'], true),
('craft-adv-subz-wool-ls', 'ADV SubZ Wool Running Tee', 'Craft', 'tops', 'mens', 90, ARRAY['all_weather','minimalist_pro'], ARRAY['cold','cool','wind'], ARRAY['merino wool blend','thermal','breathable'], true),
('asics-metarun-ls', 'Metarun Long Sleeve', 'ASICS', 'tops', 'mens', 65, ARRAY['speed_demon','all_weather'], ARRAY['cool','cold'], ARRAY['moisture management','seamless','reflective'], true),
('under-armour-qualifier-cold-ls', 'Qualifier Cold Long Sleeve', 'Under Armour', 'tops', 'mens', 55, ARRAY['all_weather','minimalist_pro'], ARRAY['cold','cool','wind'], ARRAY['ColdGear','brushed interior','thumbholes'], true),
('smartwool-classic-thermal-ls', 'Classic Thermal Merino Base Layer', 'Smartwool', 'tops', 'unisex', 100, ARRAY['all_weather','minimalist_pro'], ARRAY['cold','cool','wind'], ARRAY['merino wool','temperature regulating','odor-resistant'], true),
('patagonia-capilene-cool-ls', 'Capilene Cool Daily Long Sleeve', 'Patagonia', 'tops', 'mens', 55, ARRAY['all_weather','creative_cruiser'], ARRAY['cool','warm'], ARRAY['Fair Trade','UPF 50+','recycled polyester'], true);

-- ============================================================
-- TOPS: Sports Bras
-- ============================================================
INSERT INTO attire_items (item_key, name, brand, category, gender, price, personas, weather, features, is_active) VALUES
('brooks-3-pocket-run-bra', '3 Pocket Run Bra', 'Brooks', 'tops', 'womens', 54, ARRAY['speed_demon','minimalist_pro'], ARRAY['warm','hot'], ARRAY['3 pockets','high support A-E cups','compression fit'], true),
('lululemon-energy-bra', 'Energy Bra High Support', 'Lululemon', 'tops', 'womens', 58, ARRAY['speed_demon','vibe_runner'], ARRAY['warm','hot'], ARRAY['Luxtreme fabric','high support','moisture-wicking'], true),
('lululemon-run-times-bra', 'Run Times Bra', 'Lululemon', 'tops', 'womens', 68, ARRAY['speed_demon','vibe_runner'], ARRAY['warm','hot'], ARRAY['high impact','no bounce','breathable'], true),
('oiselle-flyout-bra', 'Flyout Bra', 'Oiselle', 'tops', 'womens', 78, ARRAY['speed_demon','vibe_runner'], ARRAY['warm','hot'], ARRAY['wide straps','A-D support','no pressure points'], true),
('oiselle-race-day-bra', 'Race Day Bra', 'Oiselle', 'tops', 'womens', 64, ARRAY['speed_demon'], ARRAY['warm','hot'], ARRAY['longline','bib-compatible','Plya fabric'], true),
('nike-swoosh-medium-support-bra', 'Swoosh Medium Support Bra', 'Nike', 'tops', 'womens', 38, ARRAY['minimalist_pro','creative_cruiser'], ARRAY['warm','hot'], ARRAY['Dri-FIT','removable pads','medium support'], true),
('athleta-ultimate-bra', 'Ultimate Run Bra', 'Athleta', 'tops', 'womens', 64, ARRAY['all_weather','vibe_runner'], ARRAY['warm','hot'], ARRAY['high support','accurate sizing','encapsulation design'], true),
('under-armour-infinity-high-bra', 'Infinity High Sports Bra', 'Under Armour', 'tops', 'womens', 60, ARRAY['speed_demon','all_weather'], ARRAY['warm','hot'], ARRAY['UA Infinity','high support','crossback design'], true),
('girlfriend-collective-run-bra', 'Run Bra High Impact', 'Girlfriend Collective', 'tops', 'womens', 52, ARRAY['vibe_runner','creative_cruiser'], ARRAY['warm','hot'], ARRAY['recycled materials','inclusive sizing XXS-6XL','high support'], true),
('alo-yoga-airlift-bra', 'Airlift Intrigue Bra', 'Alo Yoga', 'tops', 'womens', 62, ARRAY['vibe_runner','creative_cruiser'], ARRAY['warm','hot'], ARRAY['Airlift fabric','medium support','sleek design'], true);

-- ============================================================
-- BOTTOMS: Shorts (Split, Lined, Unlined)
-- ============================================================
INSERT INTO attire_items (item_key, name, brand, category, gender, price, personas, weather, features, is_active) VALUES
('nike-aeroswift-split-short-2in', 'AeroSwift 2" Split Short', 'Nike', 'bottoms', 'mens', 72, ARRAY['speed_demon'], ARRAY['hot','warm'], ARRAY['Flyvent waistband','deep V-notch split','featherlight'], true),
('nike-aeroswift-split-short-4in', 'AeroSwift 4" Split Short', 'Nike', 'bottoms', 'mens', 72, ARRAY['speed_demon'], ARRAY['hot','warm'], ARRAY['Flyvent waistband','perforated splits','race-ready'], true),
('nike-stride-5in-lined', 'Dri-FIT Stride 5" Lined Short', 'Nike', 'bottoms', 'mens', 50, ARRAY['minimalist_pro','creative_cruiser'], ARRAY['hot','warm'], ARRAY['Dri-FIT','brief liner','side zip pocket'], true),
('patagonia-strider-pro-5in', 'Strider Pro 5" Short', 'Patagonia', 'bottoms', 'mens', 69, ARRAY['creative_cruiser','vibe_runner'], ARRAY['hot','warm'], ARRAY['multiple pockets','recycled nylon','breathable'], true),
('rabbit-fuel-n-fly-3in', 'Fuel N Fly 3" Split Short', 'Rabbit', 'bottoms', 'mens', 56, ARRAY['speed_demon'], ARRAY['hot','warm'], ARRAY['true split','lightweight','gel pockets'], true),
('tracksmith-twilight-split', 'Twilight Split Short', 'Tracksmith', 'bottoms', 'mens', 68, ARRAY['speed_demon','vibe_runner'], ARRAY['hot','warm'], ARRAY['split design','lightweight','heritage aesthetic'], true),
('janji-5in-multi-short', '5" Multi Short', 'Janji', 'bottoms', 'mens', 68, ARRAY['creative_cruiser','vibe_runner'], ARRAY['hot','warm'], ARRAY['trail-ready','ample storage','artist collab prints'], true),
('adidas-own-the-run-short', 'Own The Run Short', 'Adidas', 'bottoms', 'mens', 35, ARRAY['minimalist_pro','creative_cruiser'], ARRAY['hot','warm'], ARRAY['AEROREADY','recycled materials','budget-friendly'], true),
('brooks-sherpa-7in', 'Sherpa 7" 2-in-1 Short', 'Brooks', 'bottoms', 'mens', 60, ARRAY['minimalist_pro','all_weather'], ARRAY['warm','hot'], ARRAY['built-in liner','DriLayer','anti-odor'], true),
('brooks-chaser-short-w', 'Chaser 5" Short', 'Brooks', 'bottoms', 'womens', 48, ARRAY['minimalist_pro','creative_cruiser'], ARRAY['hot','warm'], ARRAY['wide waistband','DriLayer','sweat-wicking'], true),
('on-running-short-5in', 'Running Short 5"', 'On Running', 'bottoms', 'mens', 70, ARRAY['minimalist_pro','speed_demon'], ARRAY['hot','warm'], ARRAY['lightweight woven','built-in brief','side splits'], true),
('hoka-performance-short-5in', 'Performance 5" Short', 'Hoka', 'bottoms', 'mens', 52, ARRAY['minimalist_pro','speed_demon'], ARRAY['hot','warm'], ARRAY['moisture-wicking','lightweight','reflective'], true),
('saucony-outpace-5in', 'Outpace 5" Short', 'Saucony', 'bottoms', 'mens', 42, ARRAY['minimalist_pro','creative_cruiser'], ARRAY['hot','warm'], ARRAY['RunDry','ventilated','back zip pocket'], true),
('new-balance-rc-3in-split', 'RC Short 3" Split', 'New Balance', 'bottoms', 'mens', 55, ARRAY['speed_demon'], ARRAY['hot','warm'], ARRAY['NB DRY','race split','ultralight'], true),
('satisfy-short-distance-3in', 'Short Distance 3" Short', 'Satisfy', 'bottoms', 'mens', 130, ARRAY['vibe_runner','speed_demon'], ARRAY['hot','warm'], ARRAY['luxury fabric','race weight','Parisian design'], true),
('puma-run-favorite-5in', 'Run Favorite Velocity 5" Short', 'Puma', 'bottoms', 'mens', 35, ARRAY['minimalist_pro','creative_cruiser'], ARRAY['hot','warm'], ARRAY['dryCELL','lightweight','reflective'], true),
('vuori-kore-short', 'Kore Short 7"', 'Vuori', 'bottoms', 'mens', 68, ARRAY['vibe_runner','creative_cruiser'], ARRAY['warm','hot'], ARRAY['DreamKnit lining','versatile','anti-odor'], true),
('oiselle-mac-roga-short-w', 'Mac Roga Short', 'Oiselle', 'bottoms', 'womens', 62, ARRAY['vibe_runner','creative_cruiser'], ARRAY['hot','warm'], ARRAY['phone pocket','relaxed fit','Plya fabric'], true),
('lululemon-hotty-hot-4in-w', 'Hotty Hot Low-Rise 4" Short', 'Lululemon', 'bottoms', 'womens', 68, ARRAY['vibe_runner','speed_demon'], ARRAY['hot','warm'], ARRAY['Swift Ultra fabric','lightweight','continuous drawcord'], true),
('under-armour-launch-5in', 'Launch Run 5" Short', 'Under Armour', 'bottoms', 'mens', 40, ARRAY['minimalist_pro','all_weather'], ARRAY['hot','warm'], ARRAY['HeatGear','built-in brief','mesh liner'], true);

-- ============================================================
-- BOTTOMS: Tights, Capris, Half Tights
-- ============================================================
INSERT INTO attire_items (item_key, name, brand, category, gender, price, personas, weather, features, is_active) VALUES
('nike-phenom-elite-tight', 'Phenom Elite Running Tight', 'Nike', 'bottoms', 'mens', 110, ARRAY['speed_demon','all_weather'], ARRAY['cold','cool','wind'], ARRAY['Dri-FIT','zip ankles','reflective'], true),
('lululemon-fast-free-tight-w', 'Fast and Free High-Rise Tight 28"', 'Lululemon', 'bottoms', 'womens', 128, ARRAY['speed_demon','vibe_runner'], ARRAY['cold','cool'], ARRAY['Nulux fabric','phone pockets','weightless feel'], true),
('lululemon-wunder-train-tight-w', 'Wunder Train High-Rise Tight 28"', 'Lululemon', 'bottoms', 'womens', 98, ARRAY['vibe_runner','creative_cruiser'], ARRAY['cold','cool'], ARRAY['Everlux fabric','fast-drying','13 colors'], true),
('2xu-light-speed-compression-tight', 'Light Speed Compression Tight', '2XU', 'bottoms', 'mens', 160, ARRAY['speed_demon','minimalist_pro'], ARRAY['cold','cool'], ARRAY['PWX compression','muscle support','flatlock seams'], true),
('2xu-light-speed-compression-tight-w', 'Light Speed Compression Tight', '2XU', 'bottoms', 'womens', 160, ARRAY['speed_demon','minimalist_pro'], ARRAY['cold','cool'], ARRAY['PWX compression','muscle support','flatlock seams'], true),
('under-armour-heatgear-tight-w', 'HeatGear High No-Slip Ankle Tight', 'Under Armour', 'bottoms', 'womens', 50, ARRAY['minimalist_pro','all_weather'], ARRAY['cool','cold'], ARRAY['HeatGear fabric','mesh panels','no-slip waistband'], true),
('brooks-greenlight-tight', 'Greenlight Tight', 'Brooks', 'bottoms', 'mens', 80, ARRAY['all_weather','minimalist_pro'], ARRAY['cold','cool'], ARRAY['DriLayer','reflective','zip pocket'], true),
('on-running-tight', 'Running Tights', 'On Running', 'bottoms', 'mens', 120, ARRAY['minimalist_pro','speed_demon'], ARRAY['cold','cool','wind'], ARRAY['Swiss engineered','seamless','reflective'], true),
('tracksmith-turnover-tight', 'Turnover Tight', 'Tracksmith', 'bottoms', 'mens', 118, ARRAY['all_weather','vibe_runner'], ARRAY['cold','cool'], ARRAY['thermal brushed','zip ankles','heritage design'], true),
('asics-icon-tight', 'Icon Tight', 'ASICS', 'bottoms', 'mens', 70, ARRAY['all_weather','minimalist_pro'], ARRAY['cold','cool'], ARRAY['moisture management','reflective','zip pocket'], true),
('compressport-run-under-control-tight', 'Run Under Control Tight', 'Compressport', 'bottoms', 'mens', 130, ARRAY['speed_demon','minimalist_pro'], ARRAY['cold','cool'], ARRAY['targeted compression','ultralight','seamless'], true),
('girlfriend-collective-compressive-tight-w', 'Compressive High-Rise Legging', 'Girlfriend Collective', 'bottoms', 'womens', 78, ARRAY['vibe_runner','creative_cruiser'], ARRAY['cold','cool'], ARRAY['recycled bottles','XXS-6XL','compressive hold'], true),
('athleta-rainier-tight-w', 'Rainier Tight', 'Athleta', 'bottoms', 'womens', 109, ARRAY['all_weather','vibe_runner'], ARRAY['cold','cool','wind'], ARRAY['Polartec fleece','water-resistant','wind-blocking'], true),
('nike-fast-half-tight', 'Dri-FIT Fast Half Tight', 'Nike', 'bottoms', 'mens', 55, ARRAY['speed_demon'], ARRAY['warm','cool'], ARRAY['Dri-FIT','above-knee length','race-ready'], true),
('cep-run-compression-3-0-tight', 'Run Compression 3.0 Tight', 'CEP', 'bottoms', 'mens', 100, ARRAY['speed_demon','minimalist_pro'], ARRAY['cold','cool'], ARRAY['medical-grade compression','recovery support','moisture-wicking'], true);

-- ============================================================
-- OUTERWEAR: Jackets (Rain, Wind, Insulated)
-- ============================================================
INSERT INTO attire_items (item_key, name, brand, category, gender, price, personas, weather, features, is_active) VALUES
('patagonia-storm-racer-jacket', 'Storm Racer Jacket', 'Patagonia', 'outerwear', 'mens', 279, ARRAY['all_weather','minimalist_pro'], ARRAY['rain','wind','cold'], ARRAY['H2No waterproof','ultralight 6.4oz','packable'], true),
('patagonia-houdini-jacket', 'Houdini Jacket', 'Patagonia', 'outerwear', 'unisex', 129, ARRAY['all_weather','creative_cruiser'], ARRAY['wind','rain','cool'], ARRAY['ripstop nylon','packable','Fair Trade'], true),
('arcteryx-norvan-shell', 'Norvan Shell Jacket', 'Arc''teryx', 'outerwear', 'mens', 350, ARRAY['all_weather','minimalist_pro'], ARRAY['rain','wind','cold'], ARRAY['GORE-TEX','6.7oz ultralight','running-specific fit'], true),
('arcteryx-norvan-shell-w', 'Norvan Shell Jacket', 'Arc''teryx', 'outerwear', 'womens', 350, ARRAY['all_weather','minimalist_pro'], ARRAY['rain','wind','cold'], ARRAY['GORE-TEX','ultralight','running-specific fit'], true),
('salomon-bonatti-waterproof', 'Bonatti Waterproof Jacket', 'Salomon', 'outerwear', 'mens', 160, ARRAY['all_weather','minimalist_pro'], ARRAY['rain','wind','cool'], ARRAY['AdvancedSkin Dry','5.29oz light','packable'], true),
('salomon-bonatti-waterproof-w', 'Bonatti Waterproof Jacket', 'Salomon', 'outerwear', 'womens', 160, ARRAY['all_weather','minimalist_pro'], ARRAY['rain','wind','cool'], ARRAY['AdvancedSkin Dry','lightweight','packable'], true),
('nike-windrunner-jacket', 'Windrunner Running Jacket', 'Nike', 'outerwear', 'mens', 110, ARRAY['all_weather','creative_cruiser'], ARRAY['wind','rain','cool'], ARRAY['Storm-FIT','water-resistant','iconic chevron design'], true),
('on-zero-windbreaker', 'Zero Windbreaker', 'On Running', 'outerwear', 'mens', 180, ARRAY['speed_demon','minimalist_pro'], ARRAY['wind','cool'], ARRAY['smallest packable','barely-there weight','wind protection'], true),
('brooks-canopy-jacket', 'Canopy Jacket', 'Brooks', 'outerwear', 'mens', 120, ARRAY['all_weather','minimalist_pro'], ARRAY['rain','wind','cool'], ARRAY['DriLayer','waterproof','reflective'], true),
('hoka-stinson-rain-jacket', 'Stinson Rain Jacket', 'Hoka', 'outerwear', 'mens', 198, ARRAY['all_weather'], ARRAY['rain','wind','cold'], ARRAY['waterproof breathable','fully seam-sealed','packable'], true),
('craft-adv-essence-wind-jacket', 'ADV Essence Wind Jacket', 'Craft', 'outerwear', 'mens', 65, ARRAY['all_weather','minimalist_pro'], ARRAY['wind','cool'], ARRAY['ultralight','wind protection','packable'], true),
('adidas-own-the-run-jacket', 'Own The Run Jacket', 'Adidas', 'outerwear', 'mens', 75, ARRAY['all_weather','creative_cruiser'], ARRAY['wind','rain','cool'], ARRAY['RAIN.RDY','recycled materials','reflective'], true),
('saucony-razor-jacket', 'Razor Running Jacket', 'Saucony', 'outerwear', 'mens', 100, ARRAY['all_weather','minimalist_pro'], ARRAY['wind','rain','cool'], ARRAY['VaporTECH','packable','reflective 360'], true),
('new-balance-impact-run-jacket', 'Impact Run Light Pack Jacket', 'New Balance', 'outerwear', 'mens', 90, ARRAY['all_weather','minimalist_pro'], ARRAY['wind','rain','cool'], ARRAY['NB DRY','packable into pocket','reflective'], true),
('tracksmith-rain-jacket', 'Bislett Jacket', 'Tracksmith', 'outerwear', 'mens', 198, ARRAY['all_weather','vibe_runner'], ARRAY['rain','wind','cold'], ARRAY['3-layer waterproof','running-specific cut','premium design'], true);

-- ============================================================
-- OUTERWEAR: Vests & Hoodies
-- ============================================================
INSERT INTO attire_items (item_key, name, brand, category, gender, price, personas, weather, features, is_active) VALUES
('nike-therma-fit-repel-vest', 'Therma-FIT Repel Running Vest', 'Nike', 'outerwear', 'mens', 90, ARRAY['all_weather','minimalist_pro'], ARRAY['cold','cool','wind'], ARRAY['synthetic fill','water-repellent','packable'], true),
('patagonia-nano-puff-vest', 'Nano Puff Vest', 'Patagonia', 'outerwear', 'mens', 189, ARRAY['all_weather','creative_cruiser'], ARRAY['cold','cool','wind'], ARRAY['PrimaLoft insulation','Fair Trade','packable'], true),
('on-climate-vest', 'Climate Vest', 'On Running', 'outerwear', 'mens', 190, ARRAY['all_weather','minimalist_pro'], ARRAY['cold','cool','wind'], ARRAY['wind-blocking front','breathable back','lightweight'], true),
('brooks-shield-hybrid-vest', 'Shield Hybrid Vest', 'Brooks', 'outerwear', 'mens', 110, ARRAY['all_weather','minimalist_pro'], ARRAY['cold','cool','wind'], ARRAY['wind-resistant front','stretch fleece back','reflective'], true),
('nike-therma-fit-run-hoodie', 'Therma-FIT Run Division Hoodie', 'Nike', 'outerwear', 'mens', 95, ARRAY['all_weather','creative_cruiser'], ARRAY['cold','cool'], ARRAY['Therma-FIT','soft fleece','run-ready cut'], true),
('lululemon-down-for-it-all-vest-w', 'Down for It All Vest', 'Lululemon', 'outerwear', 'womens', 198, ARRAY['all_weather','vibe_runner'], ARRAY['cold','cool','wind'], ARRAY['700-fill down','water-repellent','glyde fabric'], true),
('tracksmith-ndo-hoodie', 'NDO Hoodie', 'Tracksmith', 'outerwear', 'mens', 148, ARRAY['all_weather','vibe_runner'], ARRAY['cold','cool'], ARRAY['Polartec thermal','thumbholes','heritage design'], true),
('under-armour-storm-hoodie', 'Storm Run Hoodie', 'Under Armour', 'outerwear', 'mens', 80, ARRAY['all_weather','minimalist_pro'], ARRAY['cold','rain','wind'], ARRAY['UA Storm','water-resistant','reflective'], true);

-- ============================================================
-- ACCESSORIES: Hats, Caps & Visors
-- ============================================================
INSERT INTO attire_items (item_key, name, brand, category, gender, price, personas, weather, features, is_active) VALUES
('ciele-gocap-standard', 'GOCap SC - Standard', 'Ciele Athletics', 'accessories', 'unisex', 40, ARRAY['vibe_runner','creative_cruiser'], ARRAY['hot','warm'], ARRAY['COOLwick fabric','UPF 40+','quick-dry'], true),
('ciele-alzcap-sc', 'ALZCap SC', 'Ciele Athletics', 'accessories', 'unisex', 45, ARRAY['vibe_runner','creative_cruiser'], ARRAY['hot','warm'], ARRAY['COOLmatic mesh','UPF 40+','bold patterns'], true),
('ciele-fstvisor', 'FSTVisor', 'Ciele Athletics', 'accessories', 'unisex', 35, ARRAY['speed_demon','vibe_runner'], ARRAY['hot','warm'], ARRAY['UPF 40+','ultralight','quick-dry'], true),
('nike-dri-fit-pro-trail-cap', 'Dri-FIT Pro Trail Cap', 'Nike', 'accessories', 'unisex', 30, ARRAY['all_weather','minimalist_pro'], ARRAY['hot','warm'], ARRAY['Dri-FIT','mesh back','sweat-wicking'], true),
('nike-aerobill-tailwind-cap', 'AeroBill Tailwind Cap', 'Nike', 'accessories', 'unisex', 28, ARRAY['minimalist_pro','speed_demon'], ARRAY['hot','warm'], ARRAY['AeroBill','perforated','lightweight'], true),
('on-lightweight-cap', 'Lightweight Cap', 'On Running', 'accessories', 'unisex', 35, ARRAY['minimalist_pro','speed_demon'], ARRAY['hot','warm'], ARRAY['barely-there feel','moisture-wicking','reflective'], true),
('buff-pack-speed-visor', 'Pack Speed Visor', 'Buff', 'accessories', 'unisex', 28, ARRAY['speed_demon','creative_cruiser'], ARRAY['hot','warm'], ARRAY['no top panel','stretchy wicking','packable'], true),
('tracksmith-eliot-cap', 'Eliot Runner Cap', 'Tracksmith', 'accessories', 'unisex', 38, ARRAY['vibe_runner','creative_cruiser'], ARRAY['hot','warm'], ARRAY['performance mesh','heritage design','adjustable'], true),
('salomon-xa-cap', 'XA Cap', 'Salomon', 'accessories', 'unisex', 30, ARRAY['all_weather','minimalist_pro'], ARRAY['hot','warm'], ARRAY['AdvancedSkin Dry','lightweight','trail-ready'], true);

-- ============================================================
-- ACCESSORIES: Gloves & Arm Sleeves
-- ============================================================
INSERT INTO attire_items (item_key, name, brand, category, gender, price, personas, weather, features, is_active) VALUES
('nathan-hypernight-convertible-mitt', 'HyperNight Reflective Convertible Mitt', 'Nathan', 'accessories', 'unisex', 35, ARRAY['all_weather','minimalist_pro'], ARRAY['cold','dark'], ARRAY['convertible mitt/glove','geo-reflective','StrobeLight pocket'], true),
('nike-lightweight-tech-glove', 'Lightweight Tech Running Glove', 'Nike', 'accessories', 'unisex', 28, ARRAY['all_weather','minimalist_pro'], ARRAY['cold','cool'], ARRAY['Dri-FIT','touchscreen tips','silicone grip'], true),
('tracksmith-fens-mittens', 'Fens Mittens', 'Tracksmith', 'accessories', 'unisex', 48, ARRAY['all_weather','vibe_runner'], ARRAY['cold'], ARRAY['merino wool','convertible','heritage design'], true),
('outdoor-research-vigor-glove', 'Vigor Midweight Sensor Glove', 'Outdoor Research', 'accessories', 'unisex', 35, ARRAY['all_weather'], ARRAY['cold','cool','wind'], ARRAY['touchscreen','moisture-wicking','fleece-lined'], true),
('brooks-greenlight-glove', 'Greenlight Glove', 'Brooks', 'accessories', 'unisex', 30, ARRAY['all_weather','minimalist_pro'], ARRAY['cold','cool'], ARRAY['DriLayer','reflective','touchscreen'], true),
('smartwool-liner-glove', 'Merino Sport Liner Glove', 'Smartwool', 'accessories', 'unisex', 30, ARRAY['all_weather','minimalist_pro'], ARRAY['cold','cool'], ARRAY['merino wool','touchscreen','odor-resistant'], true),
('cep-ultralight-arm-sleeve', 'Ultralight Compression Arm Sleeve', 'CEP', 'accessories', 'unisex', 35, ARRAY['speed_demon','minimalist_pro'], ARRAY['cool','warm'], ARRAY['medical-grade compression','UV protection','moisture control'], true),
('2xu-flex-compression-arm-sleeve', 'Flex Compression Arm Sleeve', '2XU', 'accessories', 'unisex', 30, ARRAY['speed_demon','minimalist_pro'], ARRAY['cool','warm'], ARRAY['seamless construction','articulated elbow','compression support'], true),
('compressport-armforce-ultralight', 'ArmForce Ultralight Sleeve', 'Compressport', 'accessories', 'unisex', 30, ARRAY['speed_demon','minimalist_pro'], ARRAY['cool','warm'], ARRAY['ultralight','muscle support','UV protection'], true);

-- ============================================================
-- ACCESSORIES: Socks
-- ============================================================
INSERT INTO attire_items (item_key, name, brand, category, gender, price, personas, weather, features, is_active) VALUES
('feetures-elite-light-cushion-no-show', 'Elite Light Cushion No Show Tab', 'Feetures', 'accessories', 'unisex', 18, ARRAY['speed_demon','minimalist_pro'], ARRAY['warm','hot'], ARRAY['anatomical fit','targeted compression','seamless toe'], true),
('feetures-elite-max-cushion-no-show', 'Elite Max Cushion No Show Tab', 'Feetures', 'accessories', 'unisex', 18, ARRAY['minimalist_pro','all_weather'], ARRAY['warm','cool'], ARRAY['max cushion','blister tab','iWick fibers'], true),
('balega-hidden-comfort', 'Hidden Comfort No Show', 'Balega', 'accessories', 'unisex', 17, ARRAY['minimalist_pro','creative_cruiser'], ARRAY['warm','hot'], ARRAY['plush cushioning','moisture management','hand-linked toe'], true),
('balega-blister-resist-no-show', 'Blister Resist No Show', 'Balega', 'accessories', 'unisex', 17, ARRAY['all_weather','minimalist_pro'], ARRAY['warm','hot'], ARRAY['double-layer construction','blister prevention','Drynamix moisture'], true),
('smartwool-run-targeted-cushion-crew', 'Run Targeted Cushion Crew', 'Smartwool', 'accessories', 'unisex', 22, ARRAY['all_weather','minimalist_pro'], ARRAY['cold','cool'], ARRAY['merino wool','mesh zones','temperature regulating'], true),
('smartwool-run-targeted-cushion-ankle', 'Run Targeted Cushion Ankle', 'Smartwool', 'accessories', 'unisex', 20, ARRAY['all_weather','minimalist_pro'], ARRAY['warm','cool'], ARRAY['merino wool','arch support','indestructawool'], true),
('cep-run-compression-3-0-sock', 'Run Compression 3.0 Low Cut', 'CEP', 'accessories', 'unisex', 24, ARRAY['speed_demon','minimalist_pro'], ARRAY['warm','cool'], ARRAY['18-20mmHg compression','moisture-wicking','padded heel'], true),
('compressport-pro-racing-v4-sock', 'Pro Racing Socks v4.0 Low Cut', 'Compressport', 'accessories', 'unisex', 20, ARRAY['speed_demon','minimalist_pro'], ARRAY['warm','hot'], ARRAY['3D dots grip','ultralight','targeted compression'], true),
('nike-multiplier-crew-sock', 'Multiplier Running Crew Sock', 'Nike', 'accessories', 'unisex', 16, ARRAY['minimalist_pro','creative_cruiser'], ARRAY['warm','cool'], ARRAY['Dri-FIT','arch support','cushioned'], true),
('on-performance-mid-sock', 'Performance Mid Sock', 'On Running', 'accessories', 'unisex', 22, ARRAY['minimalist_pro','speed_demon'], ARRAY['warm','cool'], ARRAY['targeted cushioning','recycled materials','arch support'], true);

-- ============================================================
-- ACCESSORIES: Hydration Vests
-- ============================================================
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
