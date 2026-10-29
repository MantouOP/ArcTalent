import type { Course } from './types';

export type CostAssumptions = {
  /** RM per learner-hour for an individual commercial seat. */
  seatRate: number;
  /** RM per course-hour for an internal trainer running a cohort. */
  trainerRate: number;
  /** RM per hour of paid study time. */
  wageRate: number;
};

/** Sourced defaults; docs/SOURCES.md records each reference. */
export const COST_DEFAULTS: CostAssumptions = {
  // HRD Corp Allowable Cost Matrix (Nov 2025): e-learning max RM875/day/pax = RM125 per hour.
  seatRate: 125,
  // HRD Corp ACM (Nov 2025): internal trainer allowance max RM1,400 per 7-hour day per group.
  trainerRate: 200,
  // DOSM Salaries & Wages Survey 2025 median RM2,940/month over 195 hours (45-hour week).
  wageRate: 15.08,
};

/** HRD Corp ACM (Nov 2025) public classroom course fee: max RM1,750 per 7-hour day per pax. */
export const CLASSROOM_SEAT_RATE = 250;

/** Trainer cost for one course-hour; the ACM allowance is prorated below 5 learners. */
export const cohortHourCost = (learners: number, trainerRate: number) =>
  (trainerRate * Math.min(learners, 5)) / 5;

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Cost of the same planned learning delivered two ways: every learner buying an
 * individual commercial seat, or the ArcTalent plan (catalogue fees plus an internal
 * trainer for every course two or more learners share). Paid study time is equal on
 * both sides, which keeps the saving conservative.
 */
export function compareTrainingCosts(
  groups: Iterable<{ course: Course; names: string[] }>,
  assumptions: CostAssumptions,
  target: number,
) {
  let learnerHours = 0,
    seatFees = 0,
    planFees = 0,
    trainers = 0,
    cohorts = 0;
  for (const { course, names } of groups) {
    const learners = names.length;
    if (!learners) continue;
    learnerHours += learners * course.hours;
    seatFees += learners * course.hours * assumptions.seatRate;
    planFees += learners * course.fee;
    if (learners > 1) {
      cohorts++;
      trainers +=
        course.hours * cohortHourCost(learners, assumptions.trainerRate);
    }
  }
  const studyTime = learnerHours * assumptions.wageRate;
  const individual = seatFees + studyTime;
  const grouped = planFees + trainers + studyTime;
  return {
    learnerHours,
    cohorts,
    individual: {
      fees: round(seatFees),
      studyTime: round(studyTime),
      total: round(individual),
    },
    grouped: {
      fees: round(planFees),
      trainers: round(trainers),
      studyTime: round(studyTime),
      total: round(grouped),
    },
    saving:
      individual > 0
        ? Math.round(1000 * (1 - grouped / individual)) / 10
        : null,
    /** Seat price per learner-hour below which the saving falls under `target`. */
    breakEvenSeatRate:
      learnerHours > 0
        ? round(
            Math.max(
              0,
              grouped / ((1 - target / 100) * learnerHours) -
                assumptions.wageRate,
            ),
          )
        : null,
  };
}
export type CostComparison = ReturnType<typeof compareTrainingCosts>;
