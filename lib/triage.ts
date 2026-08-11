import type { InjurySeverity } from "@/lib/injuries";

/**
 * Symptom triage: derives injury severity from the questions a clinician
 * would ask, instead of asking the runner to self-grade "mild vs severe"
 * (most people under- or over-shoot). Deliberately conservative — ties
 * break toward the more cautious grade, and bone-stress patterns escalate
 * out of self-management entirely.
 */

export type TriageAnswers = {
  /** Walking is painful today, or you're visibly limping. */
  limping: boolean;
  /** It aches at rest, or it has woken you / ached at night. */
  nightOrRestPain: boolean;
  /** Pressing finds one precise, tender spot on a bone (not general soreness). */
  pinpointBoneTenderness: boolean;
  /** Ten single-leg hops on that side hurt — or you wouldn't attempt them. */
  hopPainful: boolean;
  /** On an easy run, pain stays at 3/10 or below AND settles by the next morning. */
  runnableAtLowPain: boolean;
  /** It has been bothering you for more than two weeks. */
  overTwoWeeks: boolean;
};

export type TriageResult = {
  severity: InjurySeverity;
  /**
   * The pattern looks like bone stress (pinpoint bone pain plus night pain
   * or hop pain). We treat it as a suspected stress fracture until imaging
   * says otherwise — that path requires medical clearance.
   */
  suspectBoneStress: boolean;
  /** Self-managing shouldn't continue without a professional assessment. */
  seeProfessionalFirst: boolean;
  /** Plain-language reasons behind the grade, shown to the runner. */
  reasons: string[];
};

export const TRIAGE_QUESTIONS: {
  id: keyof TriageAnswers;
  question: string;
  detail: string;
}[] = [
  {
    id: "limping",
    question: "Is walking painful, or are you limping today?",
    detail: "Normal walking is the baseline every return builds on."
  },
  {
    id: "nightOrRestPain",
    question: "Does it ache at rest, or has it woken you at night?",
    detail: "Pain without load is different from pain with load."
  },
  {
    id: "pinpointBoneTenderness",
    question: "Can you press and find one precise, tender spot on a bone?",
    detail: "One exact spot on bone is different from general muscle soreness."
  },
  {
    id: "hopPainful",
    question: "Would ten single-leg hops on that side hurt?",
    detail: "If you wouldn't even attempt them, answer yes."
  },
  {
    id: "runnableAtLowPain",
    question: "On an easy run, does pain stay at 3/10 or below and settle by the next morning?",
    detail: "Answer no if you haven't been able to test it."
  },
  {
    id: "overTwoWeeks",
    question: "Has it been bothering you for more than two weeks?",
    detail: "Duration changes how cautiously the comeback should start."
  }
];

export function runTriage(answers: TriageAnswers): TriageResult {
  const reasons: string[] = [];

  const suspectBoneStress =
    answers.pinpointBoneTenderness &&
    (answers.nightOrRestPain || answers.hopPainful);

  if (suspectBoneStress) {
    reasons.push(
      "Pinpoint bone tenderness together with night pain or hop pain is the classic bone-stress pattern. That needs imaging before any running plan."
    );
  } else if (answers.pinpointBoneTenderness) {
    reasons.push(
      "Pinpoint bone tenderness on its own is worth ruling out bone stress before restarting a plan — get it checked rather than testing it with miles."
    );
  }

  let score = 0;
  if (answers.limping) {
    score += 2;
    reasons.push("Pain that changes how you walk means running load is off the table for now.");
  }
  if (answers.nightOrRestPain) {
    score += 2;
    reasons.push("Aching at rest or at night suggests the tissue is irritated beyond training load alone.");
  }
  if (answers.hopPainful) {
    score += 1;
    reasons.push("A painful single-leg hop means the leg isn't ready for impact yet.");
  }
  if (!answers.runnableAtLowPain) {
    score += 1;
    reasons.push("Pain above 3/10 while running (or lingering into the next morning) is the signal to step back, not push through.");
  }
  if (answers.overTwoWeeks) {
    score += 1;
    reasons.push("Symptoms past two weeks deserve a more patient ramp — rushing this window is how comebacks fail.");
  }

  const severity: InjurySeverity = score >= 4 ? "severe" : score >= 2 ? "moderate" : "mild";

  if (score < 2) {
    reasons.push(
      "You can walk normally and run at low, settling pain — that pattern usually tolerates a careful, reduced schedule."
    );
  }

  const seeProfessionalFirst =
    suspectBoneStress ||
    answers.pinpointBoneTenderness ||
    (answers.limping && answers.nightOrRestPain) ||
    (answers.nightOrRestPain && answers.overTwoWeeks && !answers.runnableAtLowPain);

  if (seeProfessionalFirst && !suspectBoneStress) {
    reasons.push(
      "This combination has gone beyond confident self-management — get it assessed before restarting a plan."
    );
  }

  return { severity, suspectBoneStress, seeProfessionalFirst, reasons };
}
