export const shoeCatalogConfig = {
  years: [2023, 2024, 2025, 2026],
  preferredRetailers: [
    "runningwarehouse.com",
    "rei.com",
    "roadrunnersports.com",
    "zappos.com"
  ],
  brandDomains: {
    Nike: ["nike.com"],
    Adidas: ["adidas.com"],
    "New Balance": ["newbalance.com"],
    ASICS: ["asics.com"],
    Brooks: ["brooksrunning.com"],
    Hoka: ["hoka.com"],
    Saucony: ["saucony.com"],
    On: ["on.com", "on-running.com"],
    Puma: ["puma.com"],
    Mizuno: ["mizuno.com"],
    Altra: ["altrarunning.com"],
    Salomon: ["salomon.com"],
    Skechers: ["skechers.com"],
    Reebok: ["reebok.com"],
    Merrell: ["merrell.com"],
    Topo: ["topoathletic.com"],
    "Inov-8": ["inov-8.com"]
  }
};

export const requiredShoeFields = [
  "name",
  "brand",
  "usage_types",
  "foot_strike",
  "cadence",
  "toe_box",
  "cushion",
  "stability",
  "surfaces",
  "weight_range",
  "stack",
  "drop",
  "weight_mens",
  "weight_womens",
  "description",
  "pros",
  "cons",
  "release_year",
  "release_date",
  "price"
];

export const attireCatalogConfig = {
  categories: ["tops", "bottoms", "outerwear", "accessories"],
  brands: [
    "Nike",
    "Adidas",
    "ASICS",
    "Brooks",
    "Hoka",
    "New Balance",
    "Saucony",
    "On",
    "Puma",
    "Mizuno",
    "Altra",
    "Salomon",
    "Tracksmith",
    "Lululemon",
    "Janji",
    "Oiselle",
    "Ciele",
    "Rabbit",
    "Saysky"
  ],
  preferredRetailers: [
    "runningwarehouse.com",
    "rei.com",
    "roadrunnersports.com",
    "zappos.com"
  ],
  brandDomains: {
    Nike: ["nike.com"],
    Adidas: ["adidas.com"],
    ASICS: ["asics.com"],
    Brooks: ["brooksrunning.com"],
    Hoka: ["hoka.com"],
    "New Balance": ["newbalance.com"],
    Saucony: ["saucony.com"],
    On: ["on.com", "on-running.com"],
    Puma: ["puma.com"],
    Mizuno: ["mizuno.com"],
    Altra: ["altrarunning.com"],
    Salomon: ["salomon.com"],
    Tracksmith: ["tracksmith.com"],
    Lululemon: ["lululemon.com"],
    Janji: ["janji.com"],
    Oiselle: ["oiselle.com"],
    Ciele: ["cieleathletics.com"],
    Rabbit: ["runinrabbit.com"],
    Saysky: ["saysky.dk", "saysky.com"]
  }
};

export const requiredAttireFields = [
  "name",
  "brand",
  "category",
  "gender",
  "personas",
  "weather",
  "features"
];

export const gelCatalogConfig = {
  brands: [
    "Maurten",
    "GU",
    "Science in Sport",
    "SIS",
    "Skratch Labs",
    "Clif",
    "Honey Stinger",
    "Precision Fuel & Hydration",
    "Huma",
    "Spring Energy",
    "Neversecond",
    "Osmos",
    "Muc-Off",
    "Bonk Breaker",
    "SaltStick"
  ]
};

export const requiredGelFields = ["brand", "name"];
