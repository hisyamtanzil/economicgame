import type { CampaignProfile } from "./campaign-content";
import type { EconomicState, PolicyPackage } from "./game";

export type EconomicDisplay = {
  priceIndex: number;
  nominalGDPBillions: number;
  annualizedRevenueBillions: number;
  publicDebtBillions: number;
  povertyEquivalentPeople: number;
  fixedPopulationPeople: number;
};

export type HouseholdResponse = {
  id: "lower-income" | "middle-income" | "higher-income";
  label: string;
  signal: "No protest signal" | "Policy concern" | "Protest likely";
  tone: "positive" | "caution" | "critical";
  pressure: number;
  explanation: string;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * The simulation stores annualised inflation readings but not a price level.
 * This derives a display-only price-index estimate from each resolved quarter.
 */
export function estimatePriceIndex(history: readonly EconomicState[], state: EconomicState) {
  const latest = history[history.length - 1];
  const throughCurrent = latest?.quarter === state.quarter ? history : [...history, state];
  return throughCurrent.slice(1).reduce((index, entry) => index * (1 + entry.inflation / 400), 1);
}

/**
 * Converts index and ratio data from the existing simulation into explicitly
 * fictional, presentation-only nominal estimates. No result is saved or fed
 * back into the simulation.
 */
export function deriveEconomicDisplay(
  state: EconomicState,
  baseline: EconomicState,
  history: readonly EconomicState[],
  profile: CampaignProfile,
): EconomicDisplay {
  const priceIndex = estimatePriceIndex(history, state);
  const realOutputChange = state.realGDP / Math.max(0.01, baseline.realGDP);
  const nominalGDPBillions = profile.displayScale.baseNominalGDPBillions * realOutputChange * priceIndex;
  const fixedPopulationPeople = profile.displayScale.fixedPopulationMillions * 1_000_000;

  return {
    priceIndex,
    nominalGDPBillions,
    annualizedRevenueBillions: nominalGDPBillions * state.revenueGDP / 100,
    publicDebtBillions: nominalGDPBillions * state.debtGDP / 100,
    povertyEquivalentPeople: fixedPopulationPeople * state.poverty / 100,
    fixedPopulationPeople,
  };
}

export function formatNominalBillions(value: number, profile: CampaignProfile) {
  const digits = Math.abs(value) >= 1_000 ? 0 : 1;
  const formatted = new Intl.NumberFormat("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);
  return `${profile.displayScale.currencyCode} ${formatted}bn`;
}

export function formatPeople(value: number) {
  if (Math.abs(value) >= 1_000_000) {
    return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(value / 1_000_000)}m`;
  }
  if (Math.abs(value) >= 1_000) return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value / 1_000)}k`;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function responseStatus(pressure: number): Pick<HouseholdResponse, "signal" | "tone"> {
  if (pressure >= 60) return { signal: "Protest likely", tone: "critical" };
  if (pressure >= 32) return { signal: "Policy concern", tone: "caution" };
  return { signal: "No protest signal", tone: "positive" };
}

function lowerIncomeExplanation(state: EconomicState, policy: PolicyPackage, transfersSpend: number) {
  if (policy.vatRate >= 17) return "Higher consumption tax is putting visible pressure on essentials and day-to-day budgets.";
  if (transfersSpend < 4) return "Transfers are too small to cushion lower-income households against current prices and job risks.";
  if (state.inflation >= 9 || state.unemployment >= 10) return "Prices and labour-market stress are weakening lower-income household resilience.";
  return "Transfers and public services are currently cushioning the policy package for lower-income households.";
}

function middleIncomeExplanation(state: EconomicState, policy: PolicyPackage, educationSpend: number) {
  if (policy.policyRate >= 12) return "Higher borrowing costs are becoming the main source of middle-income dissatisfaction.";
  if (policy.incomeTaxes[2] >= 30 || policy.vatRate >= 17) return "Income-tax and consumption-tax pressure is tightening middle-income disposable income.";
  if (state.inflation >= 9 || state.unemployment >= 10) return "Inflation and job insecurity are becoming the main middle-income concern.";
  if (educationSpend >= 5) return "The package keeps tax, price, and credit pressure broadly contained while supporting opportunity.";
  return "No concentrated tax, price, or credit pressure is indicated for middle-income households.";
}

function higherIncomeExplanation(policy: PolicyPackage) {
  if (policy.incomeTaxes[4] >= 47 && policy.corporateRate >= 32) return "Top-bracket and business-tax measures are likely to generate organised opposition.";
  if (policy.incomeTaxes[4] >= 47) return "The top income-tax rate is the main source of higher-income policy resistance.";
  if (policy.corporateRate >= 32) return "Business-tax pressure is the main source of higher-income policy resistance.";
  return "No concentrated top-income or business-tax grievance is indicated by this package.";
}

/**
 * A transparent UI signal, not a new simulation system. It uses the policy
 * currently being drafted and existing state conditions, but never changes
 * unrest, events, score, saved data, or any calculation in game.ts.
 */
export function deriveHouseholdResponses(state: EconomicState, policy: PolicyPackage): HouseholdResponse[] {
  const transfersSpend = policy.spendingGDP * policy.allocations.transfers / 100;
  const healthSpend = policy.spendingGDP * policy.allocations.health / 100;
  const educationSpend = policy.spendingGDP * policy.allocations.education / 100;
  const middleTax = (policy.incomeTaxes[1] + policy.incomeTaxes[2]) / 2;
  const backgroundPressure = Math.max(0, state.unrest - 55) * 0.55;

  const lowerPressure = clamp(
    8
      + Math.max(0, policy.vatRate - 8) * 2
      + Math.max(0, policy.incomeTaxes[0] - 8) * 1.5
      + Math.max(0, state.poverty - 20) * 1.2
      + Math.max(0, state.inflation - 5) * 2
      + Math.max(0, state.unemployment - 7) * 2.2
      + Math.max(0, 5 - transfersSpend) * 8
      - Math.max(0, transfersSpend - 5) * 3
      - healthSpend * 0.7
      + backgroundPressure,
    0,
    100,
  );
  const middlePressure = clamp(
    5
      + Math.max(0, middleTax - 18) * 2
      + Math.max(0, policy.vatRate - 10) * 2.5
      + Math.max(0, policy.policyRate - 7) * 1.8
      + Math.max(0, state.inflation - 6) * 2.2
      + Math.max(0, state.unemployment - 7) * 2.4
      - educationSpend * 0.5
      + backgroundPressure,
    0,
    100,
  );
  const higherPressure = clamp(
    4
      + Math.max(0, policy.incomeTaxes[4] - 35) * 2.3
      + Math.max(0, policy.corporateRate - 24) * 1.9
      + Math.max(0, policy.spendingGDP - 25) * 0.7
      + backgroundPressure,
    0,
    100,
  );

  return [
    {
      id: "lower-income",
      label: "Lower-income households",
      pressure: Math.round(lowerPressure),
      ...responseStatus(lowerPressure),
      explanation: lowerIncomeExplanation(state, policy, transfersSpend),
    },
    {
      id: "middle-income",
      label: "Middle-income households",
      pressure: Math.round(middlePressure),
      ...responseStatus(middlePressure),
      explanation: middleIncomeExplanation(state, policy, educationSpend),
    },
    {
      id: "higher-income",
      label: "Higher-income households",
      pressure: Math.round(higherPressure),
      ...responseStatus(higherPressure),
      explanation: higherIncomeExplanation(policy),
    },
  ];
}
