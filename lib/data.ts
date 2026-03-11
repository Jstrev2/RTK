export type Shoe = {
  id: string;
  name: string;
  brand: string;
  price: number;
  usageTypes: string[];
  footStrike: string[];
  cadence: string[];
  toeBox: "narrow" | "standard" | "wide" | "extra_wide";
  cushion: "minimal" | "moderate" | "maximum";
  stability: "neutral" | "mild" | "moderate" | "motion_control";
  surfaces: string[];
  weightRange: "lightweight" | "heavyweight" | "all";
  stack: number;
  drop: number;
  weightMens: number;
  weightWomens: number;
  description: string;
  pros: string[];
  cons: string[];
  popularity: number;
  isNew?: boolean;
  release?: string;
  releaseDate?: string;
  releaseYear?: number;
  imageUrl?: string;
  productUrl?: string;
};

export const shoeOptions = {
  usageTypes: [
    { id: "daily_trainer", label: "Daily trainer" },
    { id: "long_run", label: "Long run" },
    { id: "speed_work", label: "Speed work / tempo" },
    { id: "race_day", label: "Race day" },
    { id: "trail_running", label: "Trail running" },
    { id: "recovery_runs", label: "Recovery runs" }
  ],
  footStrike: [
    { id: "heel", label: "Heel strike" },
    { id: "midfoot", label: "Midfoot strike" },
    { id: "forefoot", label: "Forefoot strike" },
    { id: "not_sure", label: "Not sure" }
  ],
  cadence: [
    { id: "low", label: "Low (<160 spm)" },
    { id: "average", label: "Average (160-180 spm)" },
    { id: "high", label: "High (>180 spm)" },
    { id: "not_sure", label: "Not sure" }
  ],
  toeBox: [
    { id: "narrow", label: "Narrow" },
    { id: "standard", label: "Standard" },
    { id: "wide", label: "Wide" },
    { id: "extra_wide", label: "Extra wide" }
  ],
  cushion: [
    { id: "minimal", label: "Minimal" },
    { id: "moderate", label: "Moderate" },
    { id: "maximum", label: "Maximum" }
  ],
  stability: [
    { id: "neutral", label: "Neutral" },
    { id: "mild", label: "Mild stability" },
    { id: "moderate", label: "Moderate stability" },
    { id: "motion_control", label: "Motion control" }
  ],
  surfaces: [
    { id: "road", label: "Road" },
    { id: "track", label: "Track" },
    { id: "mixed", label: "Mixed" }
  ]
};

export const shoes: Shoe[] = [
  {
    id: "brooks-glycerin-max",
    name: "Brooks Glycerin Max",
    brand: "Brooks",
    price: 200,
    usageTypes: ["daily_trainer", "long_run", "recovery_runs"],
    footStrike: ["heel", "midfoot"],
    cadence: ["low", "average"],
    toeBox: "standard",
    cushion: "maximum",
    stability: "neutral",
    surfaces: ["road", "treadmill", "mixed"],
    weightRange: "heavyweight",
    stack: 45,
    drop: 6,
    weightMens: 11.3,
    weightWomens: 9.9,
    description: "Max cushion cruiser designed for long, easy miles.",
    pros: ["Plush", "Protective", "Stable ride"],
    cons: ["Heavier", "Premium price"],
    popularity: 86,
    isNew: true,
    release: "2024"
  },
  {
    id: "nike-alphafly-3",
    name: "Nike Alphafly 3",
    brand: "Nike",
    price: 285,
    usageTypes: ["race_day", "speed_work"],
    footStrike: ["midfoot", "forefoot"],
    cadence: ["high"],
    toeBox: "standard",
    cushion: "moderate",
    stability: "neutral",
    surfaces: ["road", "track"],
    weightRange: "lightweight",
    stack: 40,
    drop: 8,
    weightMens: 7.3,
    weightWomens: 6.3,
    description: "Flagship marathon racer tuned for efficiency and speed.",
    pros: ["Fast", "Efficient", "Energy return"],
    cons: ["Expensive", "Narrow fit"],
    popularity: 98,
    isNew: true,
    release: "2024"
  },
  {
    id: "adidas-adios-pro-4",
    name: "Adidas Adizero Adios Pro 4",
    brand: "Adidas",
    price: 260,
    usageTypes: ["race_day", "speed_work"],
    footStrike: ["midfoot", "forefoot"],
    cadence: ["high"],
    toeBox: "standard",
    cushion: "moderate",
    stability: "neutral",
    surfaces: ["road", "track"],
    weightRange: "lightweight",
    stack: 39,
    drop: 6.5,
    weightMens: 7.2,
    weightWomens: 6.2,
    description: "Race-day carbon shoe with snappy energy return.",
    pros: ["Fast turnover", "Lightweight", "Race-ready"],
    cons: ["Firm ride", "Pricey"],
    popularity: 90,
    isNew: true,
    release: "2024"
  },
  {
    id: "asics-superblast-2",
    name: "ASICS Superblast 2",
    brand: "ASICS",
    price: 200,
    usageTypes: ["long_run", "speed_work"],
    footStrike: ["midfoot", "forefoot"],
    cadence: ["average", "high"],
    toeBox: "standard",
    cushion: "maximum",
    stability: "neutral",
    surfaces: ["road", "track"],
    weightRange: "all",
    stack: 45,
    drop: 8,
    weightMens: 9.2,
    weightWomens: 8.1,
    description: "High stack trainer built for long runs and uptempo days.",
    pros: ["Bouncy", "Versatile", "Light for stack"],
    cons: ["Tall platform", "Premium price"],
    popularity: 88,
    isNew: true,
    release: "2024"
  },
  {
    id: "hoka-skyward-x",
    name: "Hoka Skyward X",
    brand: "Hoka",
    price: 225,
    usageTypes: ["long_run", "recovery_runs"],
    footStrike: ["heel", "midfoot"],
    cadence: ["low", "average"],
    toeBox: "standard",
    cushion: "maximum",
    stability: "neutral",
    surfaces: ["road", "treadmill"],
    weightRange: "heavyweight",
    stack: 48,
    drop: 5,
    weightMens: 11.0,
    weightWomens: 9.5,
    description: "Max cushion platform for deep mileage and recovery runs.",
    pros: ["Soft landing", "Stable", "Protective"],
    cons: ["Heavy", "Bulky"],
    popularity: 84,
    isNew: true,
    release: "2024"
  },
  {
    id: "asics-novablast-5",
    name: "ASICS Novablast 5",
    brand: "ASICS",
    price: 150,
    usageTypes: ["daily_trainer", "long_run", "speed_work"],
    footStrike: ["midfoot", "forefoot"],
    cadence: ["average", "high"],
    toeBox: "standard",
    cushion: "moderate",
    stability: "neutral",
    surfaces: ["road", "track", "treadmill"],
    weightRange: "all",
    stack: 41,
    drop: 8,
    weightMens: 9.1,
    weightWomens: 7.7,
    description: "Lively daily trainer that can handle uptempo efforts.",
    pros: ["Energy return", "Versatile", "Smooth ride"],
    cons: ["Tall stack", "Less stable at slow pace"],
    popularity: 89,
    isNew: true,
    release: "2025"
  },
  {
    id: "adidas-evo-sl",
    name: "Adidas Evo SL",
    brand: "Adidas",
    price: 170,
    usageTypes: ["speed_work", "race_day"],
    footStrike: ["midfoot", "forefoot"],
    cadence: ["high"],
    toeBox: "standard",
    cushion: "moderate",
    stability: "neutral",
    surfaces: ["road", "track"],
    weightRange: "lightweight",
    stack: 36,
    drop: 6,
    weightMens: 7.9,
    weightWomens: 6.8,
    description: "Fast, lightweight trainer geared for sharp workouts.",
    pros: ["Lightweight", "Quick turnover", "Race-ready feel"],
    cons: ["Firm ride", "Less cushioning for recovery days"],
    popularity: 86,
    isNew: true,
    release: "2025"
  },
  {
    id: "nike-pegasus-41",
    name: "Nike Pegasus 41",
    brand: "Nike",
    price: 139,
    usageTypes: ["daily_trainer", "long_run"],
    footStrike: ["heel", "midfoot"],
    cadence: ["average", "high"],
    toeBox: "standard",
    cushion: "moderate",
    stability: "neutral",
    surfaces: ["road", "track", "treadmill", "mixed"],
    weightRange: "all",
    stack: 36,
    drop: 10,
    weightMens: 10.0,
    weightWomens: 8.6,
    description: "Classic daily trainer with a smooth, reliable ride.",
    pros: ["Versatile", "Durable", "Balanced ride"],
    cons: ["Not the lightest", "Average pop"],
    popularity: 96,
    isNew: true,
    release: "2024"
  },
  {
    id: "brooks-ghost-16",
    name: "Brooks Ghost 16",
    brand: "Brooks",
    price: 140,
    usageTypes: ["daily_trainer", "long_run"],
    footStrike: ["heel", "midfoot"],
    cadence: ["low", "average"],
    toeBox: "standard",
    cushion: "moderate",
    stability: "neutral",
    surfaces: ["road", "treadmill"],
    weightRange: "all",
    stack: 36,
    drop: 12,
    weightMens: 10.1,
    weightWomens: 9.0,
    description: "Soft, reliable mileage builder with a stable feel.",
    pros: ["Comfortable", "Predictable", "Great for new runners"],
    cons: ["Less responsive", "Heavier"],
    popularity: 92,
    isNew: true,
    release: "2024"
  },
  {
    id: "asics-gel-nimbus-26",
    name: "ASICS Gel-Nimbus 26",
    brand: "ASICS",
    price: 160,
    usageTypes: ["daily_trainer", "long_run", "recovery_runs"],
    footStrike: ["heel", "midfoot"],
    cadence: ["low", "average"],
    toeBox: "standard",
    cushion: "maximum",
    stability: "neutral",
    surfaces: ["road", "treadmill"],
    weightRange: "heavyweight",
    stack: 41,
    drop: 8,
    weightMens: 10.9,
    weightWomens: 9.4,
    description: "Plush cushioning for long days and easy recovery miles.",
    pros: ["Soft landing", "Protective", "Smooth rocker"],
    cons: ["Pricey", "Warm upper"],
    popularity: 90,
    isNew: true,
    release: "2024"
  },
  {
    id: "hoka-clifton-9",
    name: "Hoka Clifton 9",
    brand: "Hoka",
    price: 145,
    usageTypes: ["daily_trainer", "long_run"],
    footStrike: ["heel", "midfoot"],
    cadence: ["average"],
    toeBox: "standard",
    cushion: "maximum",
    stability: "neutral",
    surfaces: ["road", "treadmill"],
    weightRange: "all",
    stack: 32,
    drop: 5,
    weightMens: 8.7,
    weightWomens: 7.2,
    description: "Light and cushioned with a rocker for easy turnover.",
    pros: ["Lightweight", "Soft ride", "Smooth transitions"],
    cons: ["Lower durability", "Less pop"],
    popularity: 93
  },
  {
    id: "new-balance-1080-v14",
    name: "New Balance 1080 v14",
    brand: "New Balance",
    price: 165,
    usageTypes: ["daily_trainer", "long_run", "recovery_runs"],
    footStrike: ["heel", "midfoot"],
    cadence: ["low", "average"],
    toeBox: "wide",
    cushion: "maximum",
    stability: "neutral",
    surfaces: ["road", "treadmill"],
    weightRange: "all",
    stack: 38,
    drop: 6,
    weightMens: 10.3,
    weightWomens: 8.4,
    description: "Premium cushioning with a roomy forefoot.",
    pros: ["Plush feel", "Roomy fit", "All-day comfort"],
    cons: ["Bulky", "Pricey"],
    popularity: 88,
    isNew: true,
    release: "2024"
  },
  {
    id: "saucony-ride-17",
    name: "Saucony Ride 17",
    brand: "Saucony",
    price: 140,
    usageTypes: ["daily_trainer", "long_run"],
    footStrike: ["heel", "midfoot"],
    cadence: ["average", "high"],
    toeBox: "standard",
    cushion: "moderate",
    stability: "neutral",
    surfaces: ["road", "track", "treadmill"],
    weightRange: "all",
    stack: 35,
    drop: 8,
    weightMens: 9.9,
    weightWomens: 8.5,
    description: "Responsive daily trainer that can pick up the pace.",
    pros: ["Smooth ride", "Durable", "Versatile"],
    cons: ["Less plush", "Average grip"],
    popularity: 85
  },
  {
    id: "asics-novablast-4",
    name: "ASICS Novablast 4",
    brand: "ASICS",
    price: 140,
    usageTypes: ["daily_trainer", "speed_work"],
    footStrike: ["midfoot", "forefoot"],
    cadence: ["average", "high"],
    toeBox: "standard",
    cushion: "moderate",
    stability: "neutral",
    surfaces: ["road", "track"],
    weightRange: "all",
    stack: 41,
    drop: 8,
    weightMens: 9.7,
    weightWomens: 8.3,
    description: "Bouncy midsole for runners who like a lively feel.",
    pros: ["Energy return", "Fun ride", "Good value"],
    cons: ["Tall stack", "Less stable"],
    popularity: 87
  },
  {
    id: "on-cloudmonster-2",
    name: "On Cloudmonster 2",
    brand: "On",
    price: 180,
    usageTypes: ["long_run", "recovery_runs"],
    footStrike: ["heel", "midfoot"],
    cadence: ["low", "average"],
    toeBox: "standard",
    cushion: "maximum",
    stability: "neutral",
    surfaces: ["road", "treadmill"],
    weightRange: "all",
    stack: 36,
    drop: 6,
    weightMens: 10.3,
    weightWomens: 8.7,
    description: "Big cushioning and rocker geometry for easy long runs.",
    pros: ["Protective", "Smooth roll", "Comfortable upper"],
    cons: ["Pricey", "Heavier"],
    popularity: 82
  },
  {
    id: "nike-vaporfly-3",
    name: "Nike Vaporfly 3",
    brand: "Nike",
    price: 250,
    usageTypes: ["race_day", "speed_work"],
    footStrike: ["midfoot", "forefoot"],
    cadence: ["high"],
    toeBox: "standard",
    cushion: "moderate",
    stability: "neutral",
    surfaces: ["road", "track"],
    weightRange: "lightweight",
    stack: 40,
    drop: 8,
    weightMens: 6.6,
    weightWomens: 5.6,
    description: "Race-day rocket built for high speeds.",
    pros: ["Fast", "Light", "Efficient"],
    cons: ["Expensive", "Less stable"],
    popularity: 94
  },
  {
    id: "adidas-adios-pro-3",
    name: "Adidas Adizero Adios Pro 3",
    brand: "Adidas",
    price: 250,
    usageTypes: ["race_day", "speed_work"],
    footStrike: ["midfoot", "forefoot"],
    cadence: ["high"],
    toeBox: "standard",
    cushion: "moderate",
    stability: "neutral",
    surfaces: ["road", "track"],
    weightRange: "lightweight",
    stack: 39,
    drop: 6.5,
    weightMens: 7.4,
    weightWomens: 6.3,
    description: "Carbon race shoe with energy rods for fast turnover.",
    pros: ["Responsive", "Race-ready", "Light"],
    cons: ["Narrow fit", "Pricey"],
    popularity: 91
  },
  {
    id: "saucony-endorphin-speed-4",
    name: "Saucony Endorphin Speed 4",
    brand: "Saucony",
    price: 170,
    usageTypes: ["speed_work", "long_run"],
    footStrike: ["midfoot", "forefoot"],
    cadence: ["average", "high"],
    toeBox: "standard",
    cushion: "moderate",
    stability: "neutral",
    surfaces: ["road", "track"],
    weightRange: "all",
    stack: 36,
    drop: 8,
    weightMens: 8.2,
    weightWomens: 7.2,
    description: "Versatile speed trainer with a snappy feel.",
    pros: ["Fast feel", "Light", "Great for workouts"],
    cons: ["Less stable", "Pricey"],
    popularity: 89
  },
  {
    id: "nb-fuelcell-elite-v4",
    name: "New Balance FuelCell SuperComp Elite v4",
    brand: "New Balance",
    price: 250,
    usageTypes: ["race_day", "speed_work"],
    footStrike: ["midfoot", "forefoot"],
    cadence: ["high"],
    toeBox: "standard",
    cushion: "moderate",
    stability: "neutral",
    surfaces: ["road"],
    weightRange: "lightweight",
    stack: 40,
    drop: 4,
    weightMens: 7.5,
    weightWomens: 6.3,
    description: "Soft and fast racer tuned for marathon pace.",
    pros: ["Energy return", "Light", "Fast"],
    cons: ["Pricey", "Less durable"],
    popularity: 86
  },
  {
    id: "hoka-rocket-x-2",
    name: "Hoka Rocket X 2",
    brand: "Hoka",
    price: 250,
    usageTypes: ["race_day", "speed_work"],
    footStrike: ["midfoot", "forefoot"],
    cadence: ["high"],
    toeBox: "standard",
    cushion: "moderate",
    stability: "neutral",
    surfaces: ["road", "track"],
    weightRange: "lightweight",
    stack: 39,
    drop: 5,
    weightMens: 7.8,
    weightWomens: 6.5,
    description: "Light and aggressive race shoe for fast efforts.",
    pros: ["Fast", "Light", "Race-ready"],
    cons: ["Firm", "Pricey"],
    popularity: 84
  },
  {
    id: "puma-deviate-nitro-3",
    name: "Puma Deviate Nitro 3",
    brand: "Puma",
    price: 160,
    usageTypes: ["speed_work", "long_run"],
    footStrike: ["midfoot", "forefoot"],
    cadence: ["average", "high"],
    toeBox: "standard",
    cushion: "moderate",
    stability: "neutral",
    surfaces: ["road", "track"],
    weightRange: "all",
    stack: 34,
    drop: 8,
    weightMens: 8.8,
    weightWomens: 7.6,
    description: "Fast daily trainer with a plated feel.",
    pros: ["Snappy", "Grip", "Value"],
    cons: ["Firm", "Narrow midfoot"],
    popularity: 80
  },
  {
    id: "brooks-adrenaline-gts-24",
    name: "Brooks Adrenaline GTS 24",
    brand: "Brooks",
    price: 150,
    usageTypes: ["daily_trainer", "long_run"],
    footStrike: ["heel", "midfoot"],
    cadence: ["low", "average"],
    toeBox: "standard",
    cushion: "moderate",
    stability: "moderate",
    surfaces: ["road", "treadmill"],
    weightRange: "all",
    stack: 36,
    drop: 12,
    weightMens: 10.4,
    weightWomens: 9.3,
    description: "Supportive trainer that keeps overpronation in check.",
    pros: ["Stable", "Comfortable", "Reliable"],
    cons: ["Heavier", "Less exciting"],
    popularity: 88
  },
  {
    id: "asics-gt-2000-12",
    name: "ASICS GT-2000 12",
    brand: "ASICS",
    price: 140,
    usageTypes: ["daily_trainer", "long_run"],
    footStrike: ["heel", "midfoot"],
    cadence: ["low", "average"],
    toeBox: "standard",
    cushion: "moderate",
    stability: "mild",
    surfaces: ["road", "treadmill"],
    weightRange: "all",
    stack: 36,
    drop: 8,
    weightMens: 9.9,
    weightWomens: 8.6,
    description: "Light stability shoe with a smooth transition.",
    pros: ["Supportive", "Light", "Durable"],
    cons: ["Less cushioned", "Plain"],
    popularity: 81
  },
  {
    id: "saucony-guide-17",
    name: "Saucony Guide 17",
    brand: "Saucony",
    price: 140,
    usageTypes: ["daily_trainer", "long_run"],
    footStrike: ["heel", "midfoot"],
    cadence: ["average"],
    toeBox: "standard",
    cushion: "moderate",
    stability: "mild",
    surfaces: ["road", "treadmill"],
    weightRange: "all",
    stack: 35,
    drop: 8,
    weightMens: 9.7,
    weightWomens: 8.6,
    description: "Guided stability with a balanced, smooth ride.",
    pros: ["Stable", "Comfortable", "Value"],
    cons: ["Less lively", "Average grip"],
    popularity: 79
  },
  {
    id: "new-balance-860-v14",
    name: "New Balance 860 v14",
    brand: "New Balance",
    price: 150,
    usageTypes: ["daily_trainer", "long_run"],
    footStrike: ["heel", "midfoot"],
    cadence: ["low", "average"],
    toeBox: "standard",
    cushion: "moderate",
    stability: "moderate",
    surfaces: ["road", "treadmill"],
    weightRange: "all",
    stack: 36,
    drop: 10,
    weightMens: 10.5,
    weightWomens: 9.4,
    description: "Stable trainer for runners who want extra support.",
    pros: ["Supportive", "Durable", "Comfortable"],
    cons: ["Heavier", "Firm"],
    popularity: 78
  },
  {
    id: "salomon-speedcross-6",
    name: "Salomon Speedcross 6",
    brand: "Salomon",
    price: 140,
    usageTypes: ["trail_running"],
    footStrike: ["heel", "midfoot"],
    cadence: ["average"],
    toeBox: "narrow",
    cushion: "moderate",
    stability: "moderate",
    surfaces: ["trail_technical"],
    weightRange: "all",
    stack: 32,
    drop: 10,
    weightMens: 11.0,
    weightWomens: 9.9,
    description: "Aggressive traction for technical trails.",
    pros: ["Grip", "Protection", "Secure fit"],
    cons: ["Narrow", "Firm"],
    popularity: 77
  },
  {
    id: "hoka-speedgoat-6",
    name: "Hoka Speedgoat 6",
    brand: "Hoka",
    price: 155,
    usageTypes: ["trail_running", "long_run"],
    footStrike: ["heel", "midfoot"],
    cadence: ["average"],
    toeBox: "standard",
    cushion: "maximum",
    stability: "mild",
    surfaces: ["trail_groomed", "trail_technical"],
    weightRange: "all",
    stack: 35,
    drop: 4,
    weightMens: 9.8,
    weightWomens: 8.3,
    description: "Cushioned trail cruiser with strong grip.",
    pros: ["Protective", "Traction", "Comfortable"],
    cons: ["Tall stack", "Pricey"],
    popularity: 83
  },
  {
    id: "nike-wildhorse-8",
    name: "Nike Wildhorse 8",
    brand: "Nike",
    price: 130,
    usageTypes: ["trail_running"],
    footStrike: ["heel", "midfoot"],
    cadence: ["average"],
    toeBox: "standard",
    cushion: "moderate",
    stability: "mild",
    surfaces: ["trail_groomed", "trail_technical"],
    weightRange: "all",
    stack: 28,
    drop: 8,
    weightMens: 10.1,
    weightWomens: 8.7,
    description: "Trail workhorse with balanced cushion and grip.",
    pros: ["Durable", "Comfortable", "Trail-ready"],
    cons: ["Average traction", "Heavier"],
    popularity: 75
  },
  {
    id: "altra-lone-peak-8",
    name: "Altra Lone Peak 8",
    brand: "Altra",
    price: 150,
    usageTypes: ["trail_running"],
    footStrike: ["midfoot", "forefoot"],
    cadence: ["average"],
    toeBox: "wide",
    cushion: "moderate",
    stability: "neutral",
    surfaces: ["trail_groomed", "trail_technical"],
    weightRange: "all",
    stack: 25,
    drop: 0,
    weightMens: 10.1,
    weightWomens: 8.8,
    description: "Zero-drop trail shoe with a roomy toe box.",
    pros: ["Natural feel", "Roomy fit", "Trail grip"],
    cons: ["Less cushion", "Wide platform"],
    popularity: 80
  }
];

export type AttirePersona = {
  id: string;
  name: string;
  description: string;
  priorities: string[];
  highlight: string;
};

export const attirePersonas: AttirePersona[] = [
  {
    id: "vibe_runner",
    name: "Vibe Runner",
    description: "Colorful, expressive gear that makes every run feel like a party.",
    priorities: ["Fun", "Style", "Confidence"],
    highlight: "Bold colors, playful accessories"
  },
  {
    id: "speed_demon",
    name: "Speed Demon",
    description: "Performance-first kit engineered for PRs and tempo sessions.",
    priorities: ["Speed", "Function", "Minimal"],
    highlight: "Lightweight, race-ready pieces"
  },
  {
    id: "creative_cruiser",
    name: "Creative Cruiser",
    description: "Social-run energy with matching sets and influencer-approved looks.",
    priorities: ["Style", "Fun", "Comfort"],
    highlight: "Coordinated fits, trend-forward"
  },
  {
    id: "minimalist_pro",
    name: "Minimalist Pro",
    description: "Clean silhouettes and reliable staples that just work.",
    priorities: ["Function", "Durability", "Simplicity"],
    highlight: "Neutral palette, timeless pieces"
  },
  {
    id: "all_weather",
    name: "All-Weather Warrior",
    description: "Layering expert prepared for wind, rain, and long miles.",
    priorities: ["Weather-ready", "Warmth", "Protection"],
    highlight: "Smart layering, reflective details"
  },
  {
    id: "custom",
    name: "Create Your Own Persona",
    description: "Design a personal kit with your own priorities and aesthetic.",
    priorities: ["Custom"],
    highlight: "Build your own lane"
  }
];

export type AttireItem = {
  id: string;
  name: string;
  brand: string;
  category: "tops" | "bottoms" | "accessories" | "outerwear";
  gender: "mens" | "womens" | "unisex";
  price?: number | null;
  personas: string[];
  weather: string[];
  features: string[];
  imageUrl?: string;
};

export const attireItems: AttireItem[] = [
  {
    id: "oiselle-firecracker",
    name: "Firecracker Singlet",
    brand: "Oiselle",
    category: "tops",
    gender: "womens",
    price: 68,
    personas: ["vibe_runner", "creative_cruiser"],
    weather: ["warm", "hot"],
    features: ["moisture-wicking", "bold print"]
  },
  {
    id: "tracksmith-aeroweight",
    name: "Aeroweight Tee",
    brand: "Tracksmith",
    category: "tops",
    gender: "mens",
    price: 88,
    personas: ["speed_demon", "minimalist_pro"],
    weather: ["warm", "hot"],
    features: ["lightweight", "breathable"]
  },
  {
    id: "lululemon-fast-free",
    name: "Fast and Free 6 inch",
    brand: "Lululemon",
    category: "bottoms",
    gender: "womens",
    price: 64,
    personas: ["creative_cruiser", "vibe_runner"],
    weather: ["warm", "hot"],
    features: ["pockets", "compressive"]
  },
  {
    id: "nike-aeroswift",
    name: "Aeroswift Split Shorts",
    brand: "Nike",
    category: "bottoms",
    gender: "mens",
    price: 80,
    personas: ["speed_demon"],
    weather: ["warm", "hot"],
    features: ["race fit", "ultralight"]
  },
  {
    id: "saysky-flow",
    name: "Flow Singlet",
    brand: "Saysky",
    category: "tops",
    gender: "unisex",
    price: 75,
    personas: ["speed_demon", "creative_cruiser"],
    weather: ["warm", "hot"],
    features: ["race-ready", "graphic"]
  },
  {
    id: "janji-rainrunner",
    name: "Rainrunner Jacket",
    brand: "Janji",
    category: "outerwear",
    gender: "unisex",
    price: 188,
    personas: ["all_weather", "minimalist_pro"],
    weather: ["rain", "wind"],
    features: ["waterproof", "packable"]
  },
  {
    id: "patagonia-capilene",
    name: "Capilene Cool Long Sleeve",
    brand: "Patagonia",
    category: "tops",
    gender: "unisex",
    price: 59,
    personas: ["minimalist_pro", "all_weather"],
    weather: ["cool"],
    features: ["odor control", "layering"]
  },
  {
    id: "smartwool-base",
    name: "Merino Base Layer",
    brand: "Smartwool",
    category: "tops",
    gender: "unisex",
    price: 95,
    personas: ["all_weather"],
    weather: ["cold", "snow"],
    features: ["thermal", "soft"]
  },
  {
    id: "craft-hydro",
    name: "Hydro Weather Jacket",
    brand: "Craft",
    category: "outerwear",
    gender: "unisex",
    price: 140,
    personas: ["all_weather"],
    weather: ["rain", "wind"],
    features: ["reflective", "water-resistant"]
  },
  {
    id: "vuori-interval",
    name: "Interval Short",
    brand: "Vuori",
    category: "bottoms",
    gender: "mens",
    price: 78,
    personas: ["creative_cruiser", "minimalist_pro"],
    weather: ["warm"],
    features: ["soft liner", "versatile"]
  },
  {
    id: "girlfriend-set",
    name: "Compressive Set",
    brand: "Girlfriend Collective",
    category: "bottoms",
    gender: "womens",
    price: 68,
    personas: ["creative_cruiser", "vibe_runner"],
    weather: ["warm", "cool"],
    features: ["matching set", "recycled"]
  },
  {
    id: "ciele-gocap",
    name: "GOCap",
    brand: "Ciele Athletics",
    category: "accessories",
    gender: "unisex",
    price: 45,
    personas: ["creative_cruiser", "vibe_runner", "minimalist_pro"],
    weather: ["warm", "hot"],
    features: ["packable", "reflective"]
  },
  {
    id: "janji-atlas",
    name: "Atlas Multi Short",
    brand: "Janji",
    category: "bottoms",
    gender: "mens",
    price: 75,
    personas: ["vibe_runner", "creative_cruiser"],
    weather: ["warm", "hot"],
    features: ["bold print", "quick dry"]
  },
  {
    id: "satisfy-justice",
    name: "Justice Tee",
    brand: "Satisfy",
    category: "tops",
    gender: "mens",
    price: 120,
    personas: ["minimalist_pro"],
    weather: ["warm", "hot"],
    features: ["premium knit", "minimal branding"]
  },
  {
    id: "on-weather",
    name: "Weather Jacket",
    brand: "On",
    category: "outerwear",
    gender: "unisex",
    price: 170,
    personas: ["all_weather"],
    weather: ["wind", "cool"],
    features: ["lightweight", "reflective"]
  },
  {
    id: "tracksmith-session",
    name: "Session Shorts",
    brand: "Tracksmith",
    category: "bottoms",
    gender: "mens",
    price: 68,
    personas: ["minimalist_pro", "speed_demon"],
    weather: ["warm"],
    features: ["classic cut", "breathable"]
  },
  {
    id: "rabbit-party",
    name: "Polka Dot Tank",
    brand: "Rabbit",
    category: "tops",
    gender: "womens",
    price: 62,
    personas: ["vibe_runner"],
    weather: ["warm", "hot"],
    features: ["fun print", "lightweight"]
  },
  {
    id: "pro-compression",
    name: "Compression Calf Sleeves",
    brand: "Pro Compression",
    category: "accessories",
    gender: "unisex",
    price: 30,
    personas: ["speed_demon", "all_weather"],
    weather: ["cool", "cold"],
    features: ["compression", "support"]
  },
  {
    id: "nathan-visibility",
    name: "Visibility Vest",
    brand: "Nathan",
    category: "accessories",
    gender: "unisex",
    price: 32,
    personas: ["all_weather", "minimalist_pro"],
    weather: ["dark"],
    features: ["reflective", "lightweight"]
  },
  {
    id: "alo-airlift",
    name: "Airlift Set",
    brand: "Alo Yoga",
    category: "bottoms",
    gender: "womens",
    price: 98,
    personas: ["creative_cruiser"],
    weather: ["cool", "warm"],
    features: ["fashion-forward", "matching set"]
  },
  {
    id: "janji-merino",
    name: "Merino Seamless Tee",
    brand: "Janji",
    category: "tops",
    gender: "unisex",
    price: 90,
    personas: ["minimalist_pro", "all_weather"],
    weather: ["cool", "cold"],
    features: ["temperature control", "soft"]
  },
  {
    id: "ciele-neckwarmer",
    name: "Thermal Neck Warmer",
    brand: "Ciele Athletics",
    category: "accessories",
    gender: "unisex",
    price: 32,
    personas: ["all_weather"],
    weather: ["cold", "wind"],
    features: ["thermal", "packable"]
  },
  {
    id: "nike-aero-singlet",
    name: "Aero Mesh Singlet",
    brand: "Nike",
    category: "tops",
    gender: "mens",
    price: null,
    personas: ["speed_demon"],
    weather: ["warm", "hot"],
    features: ["ultralight", "laser cut"]
  },
  {
    id: "adidas-everyday-tee",
    name: "Everyday Performance Tee",
    brand: "Adidas",
    category: "tops",
    gender: "unisex",
    price: null,
    personas: ["minimalist_pro", "speed_demon"],
    weather: ["warm", "cool"],
    features: ["breathable", "easy care"]
  },
  {
    id: "new-balance-half-zip",
    name: "HeatGrid Half-Zip",
    brand: "New Balance",
    category: "tops",
    gender: "unisex",
    price: null,
    personas: ["all_weather", "minimalist_pro"],
    weather: ["cool", "cold", "wind"],
    features: ["thermal", "half-zip"]
  },
  {
    id: "lululemon-energy-bra",
    name: "High Support Run Bra",
    brand: "Lululemon",
    category: "tops",
    gender: "womens",
    price: null,
    personas: ["creative_cruiser", "vibe_runner"],
    weather: ["warm", "hot"],
    features: ["high support", "sweat-wicking"]
  },
  {
    id: "brooks-momentum-tank",
    name: "Momentum Tank",
    brand: "Brooks",
    category: "tops",
    gender: "womens",
    price: null,
    personas: ["minimalist_pro", "all_weather"],
    weather: ["warm", "hot"],
    features: ["lightweight", "layering"]
  },
  {
    id: "nike-trail-tee",
    name: "Trail Tech Tee",
    brand: "Nike",
    category: "tops",
    gender: "unisex",
    price: null,
    personas: ["all_weather", "minimalist_pro"],
    weather: ["warm", "cool"],
    features: ["trail-ready", "durable"]
  },
  {
    id: "nike-half-tights",
    name: "Compression Half Tights",
    brand: "Nike",
    category: "bottoms",
    gender: "mens",
    price: null,
    personas: ["speed_demon"],
    weather: ["warm", "cool"],
    features: ["compression", "pockets"]
  },
  {
    id: "lululemon-fast-free-tight",
    name: "Fast Free Tight",
    brand: "Lululemon",
    category: "bottoms",
    gender: "womens",
    price: null,
    personas: ["creative_cruiser", "speed_demon"],
    weather: ["cool", "cold"],
    features: ["pockets", "high-rise"]
  },
  {
    id: "salomon-trail-short",
    name: "Trail 5 inch Short",
    brand: "Salomon",
    category: "bottoms",
    gender: "unisex",
    price: null,
    personas: ["all_weather", "minimalist_pro"],
    weather: ["warm", "cool"],
    features: ["trail storage", "durable"]
  },
  {
    id: "brooks-legacy-short",
    name: "Legacy 5 inch Short",
    brand: "Brooks",
    category: "bottoms",
    gender: "mens",
    price: null,
    personas: ["minimalist_pro"],
    weather: ["warm", "hot"],
    features: ["classic fit", "liner"]
  },
  {
    id: "athleta-rainier-tight",
    name: "Rainier Tight",
    brand: "Athleta",
    category: "bottoms",
    gender: "womens",
    price: null,
    personas: ["all_weather"],
    weather: ["cold", "wind"],
    features: ["thermal", "brushed"]
  },
  {
    id: "arcteryx-norvan-shell",
    name: "Norvan Shell",
    brand: "Arc'teryx",
    category: "outerwear",
    gender: "unisex",
    price: null,
    personas: ["all_weather", "minimalist_pro"],
    weather: ["rain", "wind"],
    features: ["waterproof", "ultralight"]
  },
  {
    id: "adidas-windbreaker",
    name: "Packable Windbreaker",
    brand: "Adidas",
    category: "outerwear",
    gender: "unisex",
    price: null,
    personas: ["speed_demon", "minimalist_pro"],
    weather: ["wind", "cool"],
    features: ["windproof", "packable"]
  },
  {
    id: "brooks-insulated-vest",
    name: "Insulated Run Vest",
    brand: "Brooks",
    category: "outerwear",
    gender: "unisex",
    price: null,
    personas: ["all_weather"],
    weather: ["cold", "wind"],
    features: ["insulated", "core warmth"]
  },
  {
    id: "outdoor-research-rain-pants",
    name: "Waterproof Rain Pants",
    brand: "Outdoor Research",
    category: "outerwear",
    gender: "unisex",
    price: null,
    personas: ["all_weather"],
    weather: ["rain", "wind"],
    features: ["waterproof", "packable"]
  },
  {
    id: "nathan-hydration-vest",
    name: "Hydration Vest",
    brand: "Nathan",
    category: "accessories",
    gender: "unisex",
    price: null,
    personas: ["all_weather", "minimalist_pro"],
    weather: ["warm", "cool"],
    features: ["hydration", "storage"]
  },
  {
    id: "salomon-hydration-vest",
    name: "Trail Hydration Vest",
    brand: "Salomon",
    category: "accessories",
    gender: "unisex",
    price: null,
    personas: ["speed_demon", "all_weather"],
    weather: ["warm", "cool"],
    features: ["trail-ready", "high capacity"]
  },
  {
    id: "feetures-elite-socks",
    name: "Elite Cushion Socks",
    brand: "Feetures",
    category: "accessories",
    gender: "unisex",
    price: null,
    personas: ["minimalist_pro", "speed_demon"],
    weather: ["warm", "cool"],
    features: ["blister-resistance", "targeted compression"]
  },
  {
    id: "cep-compression-socks",
    name: "Compression Run Socks",
    brand: "CEP",
    category: "accessories",
    gender: "unisex",
    price: null,
    personas: ["speed_demon", "all_weather"],
    weather: ["cool", "cold"],
    features: ["compression", "circulation"]
  },
  {
    id: "roka-sunglasses",
    name: "Performance Sunglasses",
    brand: "Roka",
    category: "accessories",
    gender: "unisex",
    price: null,
    personas: ["vibe_runner", "minimalist_pro"],
    weather: ["hot", "warm"],
    features: ["anti-slip", "polarized"]
  },
  {
    id: "petzl-headlamp",
    name: "Rechargeable Headlamp",
    brand: "Petzl",
    category: "accessories",
    gender: "unisex",
    price: null,
    personas: ["all_weather", "minimalist_pro"],
    weather: ["dark"],
    features: ["visibility", "rechargeable"]
  },
  {
    id: "nike-visor",
    name: "Run Visor",
    brand: "Nike",
    category: "accessories",
    gender: "unisex",
    price: null,
    personas: ["speed_demon", "vibe_runner"],
    weather: ["hot", "warm"],
    features: ["sun-shield", "sweatband"]
  },
  {
    id: "compressport-arm-sleeves",
    name: "Arm Sleeves",
    brand: "Compressport",
    category: "accessories",
    gender: "unisex",
    price: null,
    personas: ["all_weather", "speed_demon"],
    weather: ["cool", "cold", "wind"],
    features: ["warmth", "compression"]
  },
  {
    id: "buff-neck-gaiter",
    name: "Thermal Neck Gaiter",
    brand: "Buff",
    category: "accessories",
    gender: "unisex",
    price: null,
    personas: ["all_weather"],
    weather: ["cold", "wind"],
    features: ["thermal", "versatile"]
  },
  {
    id: "nathan-reflective-clip",
    name: "Reflective Clip Light",
    brand: "Nathan",
    category: "accessories",
    gender: "unisex",
    price: null,
    personas: ["all_weather", "minimalist_pro"],
    weather: ["dark"],
    features: ["reflective", "lightweight"]
  },
  {
    id: "salomon-trail-gaiter",
    name: "Trail Gaiters",
    brand: "Salomon",
    category: "accessories",
    gender: "unisex",
    price: null,
    personas: ["all_weather"],
    weather: ["rain", "snow"],
    features: ["trail protection", "debris guard"]
  }
];
export type Song = {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  genre: string[];
  energy: "low" | "medium" | "high" | "extreme";
  workout: string[];
  submittedDate: string;
  upvotes: number;
  downvotes: number;
};

export const songs: Song[] = [
  {
    id: "song-1",
    title: "Eye of the Tiger",
    artist: "Survivor",
    bpm: 109,
    genre: ["rock"],
    energy: "high",
    workout: ["tempo_run"],
    submittedDate: "2025-01-12",
    upvotes: 245,
    downvotes: 12
  },
  {
    id: "song-2",
    title: "Stronger",
    artist: "Kanye West",
    bpm: 104,
    genre: ["hip-hop"],
    energy: "high",
    workout: ["easy_run", "tempo_run"],
    submittedDate: "2025-01-05",
    upvotes: 210,
    downvotes: 18
  },
  {
    id: "song-3",
    title: "Blinding Lights",
    artist: "The Weeknd",
    bpm: 171,
    genre: ["pop"],
    energy: "high",
    workout: ["speed_work"],
    submittedDate: "2025-01-10",
    upvotes: 198,
    downvotes: 11
  },
  {
    id: "song-4",
    title: "Titanium",
    artist: "David Guetta",
    bpm: 126,
    genre: ["electronic", "pop"],
    energy: "high",
    workout: ["tempo_run"],
    submittedDate: "2025-01-15",
    upvotes: 185,
    downvotes: 9
  },
  {
    id: "song-5",
    title: "Lose Yourself",
    artist: "Eminem",
    bpm: 171,
    genre: ["hip-hop"],
    energy: "extreme",
    workout: ["speed_work", "finish_kick"],
    submittedDate: "2025-01-08",
    upvotes: 260,
    downvotes: 20
  },
  {
    id: "song-6",
    title: "Good as Hell",
    artist: "Lizzo",
    bpm: 96,
    genre: ["pop"],
    energy: "medium",
    workout: ["easy_run"],
    submittedDate: "2025-01-14",
    upvotes: 144,
    downvotes: 7
  },
  {
    id: "song-7",
    title: "Levels",
    artist: "Avicii",
    bpm: 126,
    genre: ["electronic"],
    energy: "high",
    workout: ["tempo_run", "long_run"],
    submittedDate: "2025-01-03",
    upvotes: 176,
    downvotes: 6
  },
  {
    id: "song-8",
    title: "Run the World",
    artist: "Beyonce",
    bpm: 127,
    genre: ["pop"],
    energy: "high",
    workout: ["tempo_run"],
    submittedDate: "2025-01-11",
    upvotes: 158,
    downvotes: 9
  },
  {
    id: "song-9",
    title: "Cant Hold Us",
    artist: "Macklemore",
    bpm: 146,
    genre: ["hip-hop"],
    energy: "high",
    workout: ["tempo_run", "speed_work"],
    submittedDate: "2025-01-09",
    upvotes: 174,
    downvotes: 8
  },
  {
    id: "song-10",
    title: "Mr. Brightside",
    artist: "The Killers",
    bpm: 148,
    genre: ["rock"],
    energy: "high",
    workout: ["tempo_run"],
    submittedDate: "2025-01-07",
    upvotes: 168,
    downvotes: 10
  },
  {
    id: "song-11",
    title: "Levitating",
    artist: "Dua Lipa",
    bpm: 103,
    genre: ["pop"],
    energy: "medium",
    workout: ["easy_run"],
    submittedDate: "2025-01-16",
    upvotes: 132,
    downvotes: 5
  },
  {
    id: "song-12",
    title: "Born to Run",
    artist: "Bruce Springsteen",
    bpm: 148,
    genre: ["rock"],
    energy: "high",
    workout: ["long_run"],
    submittedDate: "2025-01-04",
    upvotes: 142,
    downvotes: 7
  },
  {
    id: "song-13",
    title: "Sunflower",
    artist: "Post Malone",
    bpm: 90,
    genre: ["hip-hop", "pop"],
    energy: "medium",
    workout: ["easy_run"],
    submittedDate: "2025-01-13",
    upvotes: 120,
    downvotes: 6
  },
  {
    id: "song-14",
    title: "Harder Better Faster Stronger",
    artist: "Daft Punk",
    bpm: 123,
    genre: ["electronic"],
    energy: "high",
    workout: ["tempo_run"],
    submittedDate: "2025-01-02",
    upvotes: 152,
    downvotes: 9
  }
];

export type TrainingWorkout = {
  day: string;
  type: string;
  distance: string;
  pace: string;
  notes: string;
};

export type TrainingPlan = {
  id: string;
  name: string;
  distance: "5k" | "10k" | "half" | "marathon";
  difficulty: "beginner" | "intermediate" | "advanced";
  durationWeeks: number;
  runsPerWeek: number;
  peakMileage: number;
  description: string;
  prerequisites: string;
  weekOne: TrainingWorkout[];
};

export const trainingPlans: TrainingPlan[] = [
  {
    id: "5k-beginner",
    name: "Couch to 5K",
    distance: "5k",
    difficulty: "beginner",
    durationWeeks: 8,
    runsPerWeek: 3,
    peakMileage: 12,
    description: "Run-walk plan for brand-new runners.",
    prerequisites: "Able to walk 30 minutes comfortably.",
    weekOne: [
      {
        day: "Monday",
        type: "Run/Walk",
        distance: "20 min",
        pace: "Easy",
        notes: "Alternate 1 min run / 2 min walk."
      },
      {
        day: "Wednesday",
        type: "Run/Walk",
        distance: "20 min",
        pace: "Easy",
        notes: "Keep effort conversational."
      },
      {
        day: "Saturday",
        type: "Run/Walk",
        distance: "22 min",
        pace: "Easy",
        notes: "Finish feeling like you could do more."
      }
    ]
  },
  {
    id: "5k-intermediate",
    name: "Sub-30 5K",
    distance: "5k",
    difficulty: "intermediate",
    durationWeeks: 6,
    runsPerWeek: 4,
    peakMileage: 18,
    description: "Build speed and confidence for a sub-30 finish.",
    prerequisites: "Running 8-10 miles per week.",
    weekOne: [
      {
        day: "Tuesday",
        type: "Intervals",
        distance: "4 x 400m",
        pace: "Fast",
        notes: "Full recovery between reps."
      },
      {
        day: "Thursday",
        type: "Easy Run",
        distance: "3 miles",
        pace: "Easy",
        notes: "Stay relaxed."
      },
      {
        day: "Saturday",
        type: "Long Run",
        distance: "4 miles",
        pace: "Easy",
        notes: "Finish strong."
      }
    ]
  },
  {
    id: "10k-beginner",
    name: "Finish a 10K",
    distance: "10k",
    difficulty: "beginner",
    durationWeeks: 10,
    runsPerWeek: 4,
    peakMileage: 22,
    description: "Progressive long runs with gentle speed work.",
    prerequisites: "Able to run 2-3 miles continuously.",
    weekOne: [
      {
        day: "Tuesday",
        type: "Easy Run",
        distance: "2.5 miles",
        pace: "Easy",
        notes: "Relaxed effort."
      },
      {
        day: "Thursday",
        type: "Easy Run",
        distance: "3 miles",
        pace: "Easy",
        notes: "Add 4 x 20 sec strides."
      },
      {
        day: "Sunday",
        type: "Long Run",
        distance: "4 miles",
        pace: "Easy",
        notes: "Practice fueling with water."
      }
    ]
  },
  {
    id: "10k-intermediate",
    name: "Sub-60 10K",
    distance: "10k",
    difficulty: "intermediate",
    durationWeeks: 8,
    runsPerWeek: 4,
    peakMileage: 26,
    description: "Tempo focus with one quality workout per week.",
    prerequisites: "Running 12-15 miles per week.",
    weekOne: [
      {
        day: "Tuesday",
        type: "Tempo",
        distance: "3 miles",
        pace: "Comfortably hard",
        notes: "Middle mile at tempo effort."
      },
      {
        day: "Friday",
        type: "Easy Run",
        distance: "3 miles",
        pace: "Easy",
        notes: "Stay relaxed."
      },
      {
        day: "Sunday",
        type: "Long Run",
        distance: "5 miles",
        pace: "Easy",
        notes: "Finish with 4 x 20 sec strides."
      }
    ]
  },
  {
    id: "half-beginner",
    name: "Finish a Half Marathon",
    distance: "half",
    difficulty: "beginner",
    durationWeeks: 12,
    runsPerWeek: 4,
    peakMileage: 28,
    description: "Build endurance with steady long runs.",
    prerequisites: "Comfortably running 4-5 miles.",
    weekOne: [
      {
        day: "Monday",
        type: "Easy Run",
        distance: "3 miles",
        pace: "Easy",
        notes: "Light effort."
      },
      {
        day: "Wednesday",
        type: "Easy Run",
        distance: "4 miles",
        pace: "Easy",
        notes: "Stay relaxed."
      },
      {
        day: "Saturday",
        type: "Long Run",
        distance: "6 miles",
        pace: "Easy",
        notes: "Practice hydration."
      }
    ]
  },
  {
    id: "half-intermediate",
    name: "Sub-2:00 Half",
    distance: "half",
    difficulty: "intermediate",
    durationWeeks: 12,
    runsPerWeek: 4,
    peakMileage: 35,
    description: "Tempo workouts plus steady long runs.",
    prerequisites: "Running 15 miles per week.",
    weekOne: [
      {
        day: "Tuesday",
        type: "Tempo",
        distance: "5 miles",
        pace: "Tempo",
        notes: "3 miles at goal pace."
      },
      {
        day: "Thursday",
        type: "Easy Run",
        distance: "4 miles",
        pace: "Easy",
        notes: "Recovery focus."
      },
      {
        day: "Sunday",
        type: "Long Run",
        distance: "8 miles",
        pace: "Easy",
        notes: "Fuel every 40 minutes."
      }
    ]
  },
  {
    id: "marathon-beginner",
    name: "Finish a Marathon",
    distance: "marathon",
    difficulty: "beginner",
    durationWeeks: 16,
    runsPerWeek: 4,
    peakMileage: 40,
    description: "Steady mileage build with cutback weeks.",
    prerequisites: "Running 15 miles per week.",
    weekOne: [
      {
        day: "Tuesday",
        type: "Easy Run",
        distance: "4 miles",
        pace: "Easy",
        notes: "Keep it comfortable."
      },
      {
        day: "Thursday",
        type: "Easy Run",
        distance: "5 miles",
        pace: "Easy",
        notes: "Add 6 x 20 sec strides."
      },
      {
        day: "Sunday",
        type: "Long Run",
        distance: "9 miles",
        pace: "Easy",
        notes: "Focus on time on feet."
      }
    ]
  },
  {
    id: "marathon-intermediate",
    name: "Sub-4:00 Marathon",
    distance: "marathon",
    difficulty: "intermediate",
    durationWeeks: 16,
    runsPerWeek: 5,
    peakMileage: 50,
    description: "Balanced plan with marathon pace work.",
    prerequisites: "Running 25 miles per week.",
    weekOne: [
      {
        day: "Tuesday",
        type: "Tempo",
        distance: "6 miles",
        pace: "Marathon pace",
        notes: "3 miles at goal pace."
      },
      {
        day: "Thursday",
        type: "Easy Run",
        distance: "5 miles",
        pace: "Easy",
        notes: "Recovery effort."
      },
      {
        day: "Sunday",
        type: "Long Run",
        distance: "10 miles",
        pace: "Easy",
        notes: "Practice fueling every 35 minutes."
      }
    ]
  },
  {
    id: "marathon-advanced",
    name: "Sub-3:30 Marathon",
    distance: "marathon",
    difficulty: "advanced",
    durationWeeks: 18,
    runsPerWeek: 5,
    peakMileage: 60,
    description: "High volume with structured workouts.",
    prerequisites: "Running 35 miles per week.",
    weekOne: [
      {
        day: "Tuesday",
        type: "Intervals",
        distance: "6 x 800m",
        pace: "Fast",
        notes: "Full recovery between reps."
      },
      {
        day: "Thursday",
        type: "Tempo",
        distance: "7 miles",
        pace: "Threshold",
        notes: "4 miles at threshold."
      },
      {
        day: "Sunday",
        type: "Long Run",
        distance: "12 miles",
        pace: "Easy",
        notes: "Finish with 2 miles at marathon pace."
      }
    ]
  }
];
