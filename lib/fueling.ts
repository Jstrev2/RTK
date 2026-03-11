export type FuelingInputs = {
  distanceMiles: number;
  distanceLabel: string;
  goalTimeMinutes: number;
  weightLbs: number;
  paceMinutes?: number;
  experience: "first" | "some" | "experienced" | "elite";
  temperature: "cool" | "moderate" | "warm" | "hot";
  gelId?: string;
  carbTargetPerHour?: number;
};

export type FuelingStep = {
  timeMinutes: number;
  mile: number;
  item: string;
};

export type FuelingProduct = {
  id: string;
  name: string;
  brand: string;
  carbs: number;
  calories: number;
  sodiumMg?: number;
  caffeineMg?: number;
  notes?: string;
};

export type FuelingPlan = {
  totalTimeMinutes: number;
  paceMinutes: number;
  caloriesPerHour: number;
  carbsPerHour: string;
  carbTargetPerHour: number;
  fluidsPerHour: string;
  sodiumPerHour: string;
  gel: FuelingProduct;
  gelIntervalMinutes: number;
  schedule: FuelingStep[];
};

const formatMinutes = (minutes: number) => {
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hrs === 0) {
    return `${mins} min`;
  }
  return `${hrs}h ${mins}m`;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const carbRange = (minutes: number, experience: FuelingInputs["experience"]) => {
  if (minutes < 75) {
    return "0-30g";
  }
  if (minutes < 150) {
    return "30-60g";
  }
  if (experience === "elite" && minutes > 240) {
    return "90-120g";
  }
  return "60-90g";
};

const tempMultiplier = (temperature: FuelingInputs["temperature"]) => {
  if (temperature === "hot") {
    return 1.3;
  }
  if (temperature === "warm") {
    return 1.15;
  }
  return 1;
};

const sodiumRange = (temperature: FuelingInputs["temperature"]) => {
  if (temperature === "hot") {
    return "500-700mg";
  }
  if (temperature === "warm") {
    return "400-600mg";
  }
  return "300-500mg";
};

export const fuelingProducts: FuelingProduct[] = [
  {
    id: "gu-original",
    name: "Original Energy Gel",
    brand: "GU",
    carbs: 22,
    calories: 100,
    sodiumMg: 60,
    notes: "Carbs and sodium vary by flavor; caffeine-free and caffeinated options."
  },
  {
    id: "gu-roctane",
    name: "Roctane Energy Gel",
    brand: "GU",
    carbs: 21,
    calories: 100,
    sodiumMg: 125,
    caffeineMg: 35,
    notes: "Caffeine varies by flavor; some flavors have higher caffeine."
  },
  {
    id: "maurten-gel-100",
    name: "Gel 100",
    brand: "Maurten",
    carbs: 25,
    calories: 100,
    sodiumMg: 50,
    notes: "Salt listed per serving on pack; caffeine-free."
  },
  {
    id: "maurten-gel-100-caf-100",
    name: "Gel 100 CAF 100",
    brand: "Maurten",
    carbs: 25,
    calories: 100,
    sodiumMg: 55,
    caffeineMg: 100,
    notes: "Salt listed per serving on pack."
  },
  {
    id: "maurten-gel-160",
    name: "Gel 160",
    brand: "Maurten",
    carbs: 40,
    calories: 160,
    sodiumMg: 80,
    notes: "Salt listed per serving on pack."
  },
  {
    id: "sis-go-isotonic",
    name: "GO Isotonic Gel",
    brand: "Science in Sport",
    carbs: 22,
    calories: 87,
    sodiumMg: 10,
    notes: "Isotonic formula designed to take without extra water."
  },
  {
    id: "huma-chia",
    name: "Chia Energy Gel",
    brand: "Huma",
    carbs: 24,
    calories: 100,
    sodiumMg: 105,
    caffeineMg: 0,
    notes: "Real fruit + chia; caffeine varies by flavor."
  },
  {
    id: "honey-stinger-gold",
    name: "Gold Energy Gel",
    brand: "Honey Stinger",
    carbs: 27,
    calories: 100,
    sodiumMg: 50,
    notes: "Honey-based carbs; caffeine varies by flavor."
  },
  {
    id: "precision-pf30",
    name: "PF 30 Gel",
    brand: "Precision Fuel & Hydration",
    carbs: 30,
    calories: 120,
    sodiumMg: 0,
    notes: "Neutral flavor; no caffeine."
  },
  {
    id: "precision-pf30-caff",
    name: "PF 30 Caffeine Gel",
    brand: "Precision Fuel & Hydration",
    carbs: 30,
    calories: 120,
    sodiumMg: 0,
    caffeineMg: 100,
    notes: "Caffeine boost with 30g carbs."
  },
  {
    id: "neversecond-c30-caff",
    name: "C30+ Caffeine Gel",
    brand: "Neversecond",
    carbs: 30,
    calories: 120,
    sodiumMg: 200,
    caffeineMg: 75,
    notes: "High sodium and moderate caffeine."
  }
];

const defaultCarbTarget = (
  minutes: number,
  experience: FuelingInputs["experience"]
) => {
  if (minutes < 75) {
    return 30;
  }
  if (minutes < 150) {
    return experience === "elite" ? 70 : 55;
  }
  if (minutes < 240) {
    if (experience === "elite") {
      return 90;
    }
    if (experience === "experienced") {
      return 75;
    }
    return 65;
  }
  return experience === "elite" ? 100 : 80;
};

const resolveGel = (gelId?: string, gelList?: FuelingProduct[]) => {
  const list = gelList?.length ? gelList : fuelingProducts;
  if (gelId) {
    const match = list.find((product) => product.id === gelId);
    if (match) {
      return match;
    }
  }
  return list[0];
};

export const buildFuelingPlan = (input: FuelingInputs & { gels?: FuelingProduct[] }): FuelingPlan => {
  const paceMinutes = input.paceMinutes
    ? input.paceMinutes
    : input.goalTimeMinutes / input.distanceMiles;

  const hours = input.goalTimeMinutes / 60;
  const caloriesPerMile = input.weightLbs * 0.63;
  const totalCalories = caloriesPerMile * input.distanceMiles;
  const caloriesPerHour = totalCalories / hours;

  const fluidBase = (input.weightLbs / 2) / hours;
  const fluidsPerHour = fluidBase * tempMultiplier(input.temperature);

  const gel = resolveGel(input.gelId, input.gels);
  const carbTargetPerHour =
    input.carbTargetPerHour ??
    defaultCarbTarget(input.goalTimeMinutes, input.experience);

  const interval = clamp(
    Math.round((gel.carbs / carbTargetPerHour) * 60),
    20,
    45
  );

  const schedule: FuelingStep[] = [];
  const lastGelMile = input.distanceMiles - 1;
  for (let t = interval; t <= input.goalTimeMinutes; t += interval) {
    const mile = t / paceMinutes;
    if (mile > lastGelMile) break;
    schedule.push({
      timeMinutes: Math.round(t),
      mile,
      item: `${gel.brand} ${gel.name} (${gel.carbs}g carbs)`
    });
  }

  return {
    totalTimeMinutes: input.goalTimeMinutes,
    paceMinutes,
    caloriesPerHour: Math.round(caloriesPerHour),
    carbsPerHour: carbRange(input.goalTimeMinutes, input.experience),
    carbTargetPerHour,
    fluidsPerHour: `${clamp(Math.round(fluidsPerHour), 8, 30)}-` +
      `${clamp(Math.round(fluidsPerHour + 4), 12, 34)} oz`,
    sodiumPerHour: sodiumRange(input.temperature),
    gel,
    gelIntervalMinutes: interval,
    schedule
  };
};

const formatPace = (paceMinutes: number) => {
  const mins = Math.floor(paceMinutes);
  const secs = Math.round((paceMinutes - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, "0")} /mi`;
};

export const formatFuelingSummary = (plan: FuelingPlan) => {
  return {
    totalTime: formatMinutes(plan.totalTimeMinutes),
    pace: formatPace(plan.paceMinutes),
    calories: `${plan.caloriesPerHour} kcal/hr`,
    carbs: `${plan.carbsPerHour} carbs/hr`,
    carbTarget: `${plan.carbTargetPerHour} g/hr target`,
    fluids: `${plan.fluidsPerHour} fluids/hr`,
    sodium: `${plan.sodiumPerHour} sodium/hr`
  };
};
