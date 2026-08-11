export type InjurySeverity = "mild" | "moderate" | "severe";

export type SeverityProfile = {
  /** Days of complete rest from running before the return protocol starts. */
  restDays: number;
  /** Weeks of progressive return-to-run before resuming normal training. */
  returnWeeks: number;
  /** Fraction of pre-injury weekly volume to start the return at. */
  startVolumeFactor: number;
  /** Weekly volume multiplier during rebuild (1.1 = +10% per week). */
  weeklyRamp: number;
  /** Weeks after return starts before speed work is allowed again. */
  speedAfterWeeks: number;
  /** Weeks after return starts before full long runs are allowed again. */
  longRunAfterWeeks: number;
};

export type Injury = {
  id: string;
  name: string;
  alsoKnownAs?: string;
  summary: string;
  /** Symptoms that mean stop self-managing and see a professional. */
  redFlags: string;
  avoid: string[];
  safe: string[];
  /** Cross-training options ordered most-recommended first. */
  crossTraining: string[];
  /** True when the protocol should insist on medical clearance first. */
  requiresMedicalClearance?: boolean;
  severityProfiles: Record<InjurySeverity, SeverityProfile>;
};

export const MEDICAL_DISCLAIMER =
  "This guidance is general information for common running injuries, not medical advice. It can't diagnose you, and it doesn't know your history. If pain is sharp, worsening, changes your gait, or lingers beyond a couple of weeks, see a sports medicine professional before continuing to train.";

export const injuries: Injury[] = [
  {
    id: "runners_knee",
    name: "Runner's knee",
    alsoKnownAs: "Patellofemoral pain syndrome",
    summary:
      "Dull ache around or behind the kneecap that builds with running volume, stairs, or long sits. Usually an overload problem, not structural damage.",
    redFlags:
      "Swelling, locking, giving way, or pain that changes how you walk means it's time to get it assessed.",
    avoid: [
      "Downhill running",
      "Deep squats and lunges under load",
      "Increasing weekly mileage",
      "Long descents on stairs"
    ],
    safe: [
      "Flat, soft-surface easy running if pain stays at 3/10 or below",
      "Quad, glute, and hip strengthening (straight-leg raises, clamshells, step-ups to comfort)",
      "Walking"
    ],
    crossTraining: ["Cycling (low resistance, high cadence)", "Pool running", "Swimming", "Elliptical"],
    severityProfiles: {
      mild: { restDays: 3, returnWeeks: 2, startVolumeFactor: 0.6, weeklyRamp: 1.15, speedAfterWeeks: 2, longRunAfterWeeks: 1 },
      moderate: { restDays: 10, returnWeeks: 3, startVolumeFactor: 0.5, weeklyRamp: 1.12, speedAfterWeeks: 3, longRunAfterWeeks: 2 },
      severe: { restDays: 21, returnWeeks: 4, startVolumeFactor: 0.4, weeklyRamp: 1.1, speedAfterWeeks: 4, longRunAfterWeeks: 3 }
    }
  },
  {
    id: "it_band",
    name: "IT band syndrome",
    summary:
      "Sharp or burning pain on the outside of the knee, typically starting a set distance into a run and easing quickly when you stop.",
    redFlags:
      "Pain at rest, swelling, or symptoms that don't improve after two weeks of load management.",
    avoid: [
      "Downhill running and cambered roads",
      "Running through the pain once it starts",
      "Sudden mileage jumps"
    ],
    safe: [
      "Running below your symptom-onset distance",
      "Hip abductor strengthening (side planks, hip hikes, single-leg work)",
      "Walking"
    ],
    crossTraining: ["Swimming", "Pool running", "Cycling if pain-free (raise the saddle slightly)", "Rowing"],
    severityProfiles: {
      mild: { restDays: 3, returnWeeks: 2, startVolumeFactor: 0.6, weeklyRamp: 1.15, speedAfterWeeks: 2, longRunAfterWeeks: 2 },
      moderate: { restDays: 7, returnWeeks: 3, startVolumeFactor: 0.5, weeklyRamp: 1.12, speedAfterWeeks: 3, longRunAfterWeeks: 2 },
      severe: { restDays: 14, returnWeeks: 4, startVolumeFactor: 0.4, weeklyRamp: 1.1, speedAfterWeeks: 4, longRunAfterWeeks: 3 }
    }
  },
  {
    id: "shin_splints",
    name: "Shin splints",
    alsoKnownAs: "Medial tibial stress syndrome",
    summary:
      "Diffuse ache along the inner shin bone during or after running, common after volume or surface changes. Distinct from a stress fracture, which hurts in one precise spot.",
    redFlags:
      "Pain focused on one small spot on the bone, night pain, or pain when hopping on one leg: that pattern needs imaging to rule out a stress fracture.",
    avoid: [
      "Hard surfaces (concrete)",
      "Speed work and hills",
      "Worn-out shoes",
      "Back-to-back running days while symptomatic"
    ],
    safe: [
      "Short, easy runs on soft surfaces if pain is mild and fades as you warm up",
      "Calf raises and foot strengthening",
      "Walking"
    ],
    crossTraining: ["Cycling", "Pool running", "Swimming", "Elliptical"],
    severityProfiles: {
      mild: { restDays: 5, returnWeeks: 2, startVolumeFactor: 0.5, weeklyRamp: 1.12, speedAfterWeeks: 2, longRunAfterWeeks: 2 },
      moderate: { restDays: 10, returnWeeks: 3, startVolumeFactor: 0.45, weeklyRamp: 1.1, speedAfterWeeks: 3, longRunAfterWeeks: 3 },
      severe: { restDays: 21, returnWeeks: 4, startVolumeFactor: 0.35, weeklyRamp: 1.1, speedAfterWeeks: 4, longRunAfterWeeks: 4 }
    }
  },
  {
    id: "plantar_fasciitis",
    name: "Plantar fasciitis",
    summary:
      "Stabbing heel or arch pain, worst with the first steps in the morning and after sitting. Often triggered by volume spikes or unsupportive footwear.",
    redFlags:
      "Numbness, tingling, or pain that isn't clearly worst with first morning steps could be something else, so get it checked.",
    avoid: [
      "Barefoot walking on hard floors",
      "Minimal or dead shoes",
      "Speed work and hill sprints",
      "Big weekly mileage while acute"
    ],
    safe: [
      "Easy running once morning pain is mild and warms up quickly",
      "Calf stretching and plantar fascia rolling (frozen bottle works)",
      "Heel raises, progressing to single-leg with a towel under the toes"
    ],
    crossTraining: ["Cycling", "Swimming", "Pool running", "Rowing"],
    severityProfiles: {
      mild: { restDays: 3, returnWeeks: 2, startVolumeFactor: 0.6, weeklyRamp: 1.12, speedAfterWeeks: 2, longRunAfterWeeks: 2 },
      moderate: { restDays: 7, returnWeeks: 3, startVolumeFactor: 0.5, weeklyRamp: 1.1, speedAfterWeeks: 3, longRunAfterWeeks: 3 },
      severe: { restDays: 14, returnWeeks: 5, startVolumeFactor: 0.4, weeklyRamp: 1.1, speedAfterWeeks: 4, longRunAfterWeeks: 4 }
    }
  },
  {
    id: "achilles_tendinopathy",
    name: "Achilles tendinopathy",
    summary:
      "Stiffness and pain in the Achilles tendon, usually worst in the morning and at the start of runs. Responds to load management, not pure rest.",
    redFlags:
      "A sudden pop, a palpable gap, or inability to rise onto your toes calls for an emergency assessment. Stop running now.",
    avoid: [
      "Hill running (especially uphill) and speed work",
      "Big drops to zero-drop or minimal shoes",
      "Explosive jumping or bounding",
      "Complete rest for weeks (tendons need progressive load)"
    ],
    safe: [
      "Easy flat running if pain stays at 3/10 or below and settles by the next morning",
      "Daily calf raises: slow, heavy, both bent- and straight-knee",
      "A modest heel lift in shoes while symptomatic"
    ],
    crossTraining: ["Cycling", "Swimming", "Pool running"],
    severityProfiles: {
      mild: { restDays: 3, returnWeeks: 3, startVolumeFactor: 0.6, weeklyRamp: 1.1, speedAfterWeeks: 3, longRunAfterWeeks: 2 },
      moderate: { restDays: 7, returnWeeks: 4, startVolumeFactor: 0.5, weeklyRamp: 1.1, speedAfterWeeks: 4, longRunAfterWeeks: 3 },
      severe: { restDays: 14, returnWeeks: 6, startVolumeFactor: 0.35, weeklyRamp: 1.08, speedAfterWeeks: 6, longRunAfterWeeks: 4 }
    }
  },
  {
    id: "calf_strain",
    name: "Calf strain",
    summary:
      "Sudden grabbing or pulling pain in the calf muscle, often mid-run or during a surge. Grade matters: a twinge is very different from a tear.",
    redFlags:
      "Significant bruising, swelling, or inability to walk normally means you should get it graded before running again.",
    avoid: [
      "Running through it the day it happens",
      "Speed work, hills, and racing flats early in the return",
      "Aggressive stretching in the first week"
    ],
    safe: [
      "Pain-free walking, progressing to brisk",
      "Progressive calf raises once daily activities are pain-free",
      "Gentle range-of-motion work"
    ],
    crossTraining: ["Cycling (easy)", "Swimming with pull buoy first", "Pool running once walking is pain-free"],
    severityProfiles: {
      mild: { restDays: 5, returnWeeks: 2, startVolumeFactor: 0.5, weeklyRamp: 1.12, speedAfterWeeks: 2, longRunAfterWeeks: 2 },
      moderate: { restDays: 14, returnWeeks: 3, startVolumeFactor: 0.4, weeklyRamp: 1.1, speedAfterWeeks: 4, longRunAfterWeeks: 3 },
      severe: { restDays: 28, returnWeeks: 5, startVolumeFactor: 0.3, weeklyRamp: 1.1, speedAfterWeeks: 5, longRunAfterWeeks: 4 }
    }
  },
  {
    id: "hamstring_strain",
    name: "Hamstring strain",
    summary:
      "Pulling or sharp pain in the back of the thigh, usually during faster running. High re-injury rate if rushed, so the return protocol matters.",
    redFlags:
      "Large bruise, sharp pain sitting on hard chairs, or pain near the sit bone that lingers? Get imaging before speed work.",
    avoid: [
      "Sprinting, strides, and fast downhills until late in the return",
      "Aggressive static stretching while acute",
      "Skipping the strength work"
    ],
    safe: [
      "Easy running once walking and gentle drills are pain-free",
      "Progressive hamstring strengthening (bridges, then eccentric work like Nordic curls)",
      "Walking"
    ],
    crossTraining: ["Cycling (easy spin)", "Swimming", "Pool running", "Elliptical"],
    severityProfiles: {
      mild: { restDays: 5, returnWeeks: 2, startVolumeFactor: 0.5, weeklyRamp: 1.12, speedAfterWeeks: 3, longRunAfterWeeks: 2 },
      moderate: { restDays: 14, returnWeeks: 4, startVolumeFactor: 0.4, weeklyRamp: 1.1, speedAfterWeeks: 4, longRunAfterWeeks: 3 },
      severe: { restDays: 28, returnWeeks: 6, startVolumeFactor: 0.3, weeklyRamp: 1.08, speedAfterWeeks: 6, longRunAfterWeeks: 4 }
    }
  },
  {
    id: "stress_fracture",
    name: "Stress fracture (suspected or confirmed)",
    summary:
      "Bone injury from accumulated load: pinpoint pain on bone that worsens with impact and can ache at night. This one is different: it needs a diagnosis and a medically supervised timeline, and running on it makes it worse.",
    redFlags:
      "All suspected stress fractures need imaging and professional management. Pain in high-risk sites (femoral neck, navicular, front of the shin) is urgent.",
    avoid: [
      "All running and impact until cleared",
      "Testing it to see if it still hurts",
      "Calcium-poor fueling and under-eating during recovery"
    ],
    safe: [
      "Whatever your clinician clears, typically pain-free cross-training",
      "Strength work that doesn't load the injured bone",
      "Prioritizing sleep and nutrition (bone healing is hungry)"
    ],
    crossTraining: ["Pool running (usually first choice)", "Swimming", "Cycling if cleared"],
    requiresMedicalClearance: true,
    severityProfiles: {
      mild: { restDays: 42, returnWeeks: 6, startVolumeFactor: 0.25, weeklyRamp: 1.1, speedAfterWeeks: 6, longRunAfterWeeks: 5 },
      moderate: { restDays: 56, returnWeeks: 8, startVolumeFactor: 0.2, weeklyRamp: 1.08, speedAfterWeeks: 8, longRunAfterWeeks: 6 },
      severe: { restDays: 84, returnWeeks: 10, startVolumeFactor: 0.15, weeklyRamp: 1.08, speedAfterWeeks: 10, longRunAfterWeeks: 8 }
    }
  },
  {
    id: "ankle_sprain",
    name: "Ankle sprain",
    summary:
      "Rolled ankle with pain and often swelling on the outside. Early movement beats total rest, but balance work is what prevents the next one.",
    redFlags:
      "Can't bear weight for four steps, bone tenderness at the malleoli, or numbness puts you in X-ray territory.",
    avoid: [
      "Uneven surfaces and trails early on",
      "Cutting or lateral movements",
      "Compensating with a limp on runs"
    ],
    safe: [
      "Walking as tolerated, early ankle range-of-motion",
      "Balance work (single-leg stands, progressing to unstable surfaces)",
      "Easy flat running once walking is completely normal"
    ],
    crossTraining: ["Cycling", "Swimming", "Pool running"],
    severityProfiles: {
      mild: { restDays: 4, returnWeeks: 1, startVolumeFactor: 0.6, weeklyRamp: 1.15, speedAfterWeeks: 1, longRunAfterWeeks: 1 },
      moderate: { restDays: 10, returnWeeks: 3, startVolumeFactor: 0.5, weeklyRamp: 1.12, speedAfterWeeks: 3, longRunAfterWeeks: 2 },
      severe: { restDays: 21, returnWeeks: 4, startVolumeFactor: 0.4, weeklyRamp: 1.1, speedAfterWeeks: 4, longRunAfterWeeks: 3 }
    }
  },
  {
    id: "hip_flexor_strain",
    name: "Hip flexor strain",
    summary:
      "Pain at the front of the hip when lifting the knee or striding out, common after speed work or big hills.",
    redFlags:
      "Deep groin pain with weight-bearing or pain that wakes you at night? Rule out bone involvement first.",
    avoid: [
      "Sprinting, hills, and long strides",
      "High knees and bounding drills",
      "Deep lunges while acute"
    ],
    safe: [
      "Easy running with a slightly shortened stride if pain-free",
      "Gentle hip flexor and glute strengthening",
      "Walking"
    ],
    crossTraining: ["Swimming", "Elliptical", "Cycling if pain-free at low resistance"],
    severityProfiles: {
      mild: { restDays: 4, returnWeeks: 2, startVolumeFactor: 0.6, weeklyRamp: 1.12, speedAfterWeeks: 2, longRunAfterWeeks: 2 },
      moderate: { restDays: 10, returnWeeks: 3, startVolumeFactor: 0.5, weeklyRamp: 1.1, speedAfterWeeks: 3, longRunAfterWeeks: 2 },
      severe: { restDays: 21, returnWeeks: 4, startVolumeFactor: 0.4, weeklyRamp: 1.1, speedAfterWeeks: 4, longRunAfterWeeks: 3 }
    }
  },
  {
    id: "piriformis_syndrome",
    name: "Piriformis syndrome",
    summary:
      "Deep buttock ache, sometimes with sciatic-like symptoms down the leg, aggravated by sitting and hill running.",
    redFlags:
      "True numbness, weakness in the leg, or back pain with the symptoms. That pattern needs assessment for the spine, not the piriformis.",
    avoid: [
      "Hill repeats and speed work",
      "Long sits (break them up)",
      "Aggressive deep stretching that flares it"
    ],
    safe: [
      "Easy running if symptoms stay mild and don't linger after",
      "Glute strengthening and hip mobility work",
      "Walking breaks during long sits"
    ],
    crossTraining: ["Swimming", "Elliptical", "Pool running"],
    severityProfiles: {
      mild: { restDays: 3, returnWeeks: 2, startVolumeFactor: 0.65, weeklyRamp: 1.12, speedAfterWeeks: 2, longRunAfterWeeks: 1 },
      moderate: { restDays: 7, returnWeeks: 3, startVolumeFactor: 0.5, weeklyRamp: 1.1, speedAfterWeeks: 3, longRunAfterWeeks: 2 },
      severe: { restDays: 14, returnWeeks: 4, startVolumeFactor: 0.4, weeklyRamp: 1.1, speedAfterWeeks: 4, longRunAfterWeeks: 3 }
    }
  }
];

export const getInjury = (id: string) =>
  injuries.find((injury) => injury.id === id);
