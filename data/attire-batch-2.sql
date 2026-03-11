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
