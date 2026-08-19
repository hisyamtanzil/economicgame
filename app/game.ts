export type IncomeTaxes = [number, number, number, number, number];

export interface PolicyPackage {
  incomeTaxes: IncomeTaxes;
  vatRate: number;
  corporateRate: number;
  spendingGDP: number;
  allocations: { health: number; education: number; infrastructure: number; transfers: number };
  policyRate: number;
  moneyGrowth: number;
}

export interface HouseholdQuintile {
  label: string;
  income: number;
  marginalPropensityToConsume: number;
}

export interface EconomicState {
  quarter: number;
  realGDP: number;
  potentialGDP: number;
  potentialGrowth: number;
  annualGrowth: number;
  inflation: number;
  unemployment: number;
  debtGDP: number;
  deficitGDP: number;
  revenueGDP: number;
  primarySpendingGDP: number;
  interestGDP: number;
  policyRate: number;
  moneySupply: number;
  moneyDemand: number;
  exchangePressure: number;
  capitalFlow: number;
  confidence: number;
  unrest: number;
  gini: number;
  poverty: number;
  hdi: number;
  healthIndex: number;
  educationIndex: number;
  incomeIndex: number;
  healthCapacity: number;
  educationCapacity: number;
  infrastructureStock: number;
  quintiles: HouseholdQuintile[];
  creditRating: "Sound" | "Watch" | "Downgraded" | "Distressed";
  hyperinflationStreak: number;
  unrestStreak: number;
  lastPolicy: PolicyPackage;
}

export interface EventDefinition {
  id: string;
  title: string;
  description: string;
  forecastable: boolean;
  effects: { growth: number; inflation: number; confidence: number; unrest: number; exchange: number; investment: number };
}

export interface Scenario {
  id: string;
  name: string;
  shortName: string;
  subtitle: string;
  mandate: string;
  seed: number;
  starting: Omit<EconomicState, "quarter" | "lastPolicy" | "hyperinflationStreak" | "unrestStreak">;
  defaultPolicy: PolicyPackage;
}

export interface QuarterResult {
  state: EconomicState;
  event: EventDefinition | null;
  advisor: string[];
  crisis: string | null;
  constrained: boolean;
  effectivePolicy: PolicyPackage;
}

export interface EndgameReport {
  total: number;
  tier: "Transformative mandate" | "Successful mandate" | "Unfinished mandate" | "Crisis government";
  scores: { prosperity: number; inclusion: number; development: number; stability: number };
  summary: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round = (value: number, decimals = 1) => Number(value.toFixed(decimals));
const clonePolicy = (policy: PolicyPackage): PolicyPackage => ({
  ...policy,
  incomeTaxes: [...policy.incomeTaxes] as IncomeTaxes,
  allocations: { ...policy.allocations },
});

const defaultPolicy: PolicyPackage = {
  incomeTaxes: [6, 13, 22, 31, 41],
  vatRate: 12,
  corporateRate: 24,
  spendingGDP: 22,
  allocations: { health: 24, education: 24, infrastructure: 30, transfers: 22 },
  policyRate: 6,
  moneyGrowth: 8,
};

export const SCENARIOS: Scenario[] = [
  {
    id: "aster",
    name: "Republic of Aster",
    shortName: "Aster",
    subtitle: "Stable growth, uneven gains",
    mandate: "Turn dependable growth into shared prosperity without losing price stability.",
    seed: 4187,
    defaultPolicy,
    starting: {
      realGDP: 100, potentialGDP: 101.2, potentialGrowth: 3.1, annualGrowth: 3.1,
      inflation: 4.8, unemployment: 7.1, debtGDP: 54, deficitGDP: 2.4, revenueGDP: 20.3,
      primarySpendingGDP: 21.5, interestGDP: 1.2, policyRate: 6, moneySupply: 68, moneyDemand: 67,
      exchangePressure: 3, capitalFlow: 1.1, confidence: 66, unrest: 31, gini: 0.47, poverty: 22,
      hdi: 0.648, healthIndex: 0.66, educationIndex: 0.62, incomeIndex: 0.664,
      healthCapacity: 0.54, educationCapacity: 0.52, infrastructureStock: 0.49,
      quintiles: quintiles([43, 62, 88, 135, 380]), creditRating: "Sound",
    },
  },
  {
    id: "veyra",
    name: "Federation of Veyra",
    shortName: "Veyra",
    subtitle: "High inequality, weak services",
    mandate: "Build capable public services and economic mobility while keeping investors engaged.",
    seed: 9021,
    defaultPolicy: { ...defaultPolicy, incomeTaxes: [4, 10, 18, 27, 35], spendingGDP: 19, allocations: { health: 18, education: 18, infrastructure: 39, transfers: 25 }, policyRate: 7, moneyGrowth: 9 },
    starting: {
      realGDP: 100, potentialGDP: 100.8, potentialGrowth: 3.7, annualGrowth: 3.9,
      inflation: 5.9, unemployment: 8.8, debtGDP: 43, deficitGDP: 1.8, revenueGDP: 17.7,
      primarySpendingGDP: 18.5, interestGDP: 1, policyRate: 7, moneySupply: 69, moneyDemand: 68,
      exchangePressure: 5, capitalFlow: 1.8, confidence: 62, unrest: 48, gini: 0.54, poverty: 31,
      hdi: 0.602, healthIndex: 0.58, educationIndex: 0.55, incomeIndex: 0.676,
      healthCapacity: 0.41, educationCapacity: 0.39, infrastructureStock: 0.52,
      quintiles: quintiles([28, 44, 72, 123, 480]), creditRating: "Sound",
    },
  },
  {
    id: "nambara",
    name: "Union of Nambara",
    shortName: "Nambara",
    subtitle: "Fragile high-inflation recovery",
    mandate: "Restore stability and public trust without sacrificing a generation of development.",
    seed: 1304,
    defaultPolicy: { ...defaultPolicy, incomeTaxes: [5, 12, 20, 29, 39], vatRate: 14, corporateRate: 22, spendingGDP: 23, allocations: { health: 26, education: 21, infrastructure: 28, transfers: 25 }, policyRate: 13, moneyGrowth: 5 },
    starting: {
      realGDP: 100, potentialGDP: 104, potentialGrowth: 3.0, annualGrowth: 1.4,
      inflation: 14.2, unemployment: 11.3, debtGDP: 79, deficitGDP: 5.6, revenueGDP: 19.5,
      primarySpendingGDP: 22.4, interestGDP: 2.7, policyRate: 13, moneySupply: 74, moneyDemand: 69,
      exchangePressure: 17, capitalFlow: -3.2, confidence: 42, unrest: 57, gini: 0.49, poverty: 29,
      hdi: 0.591, healthIndex: 0.57, educationIndex: 0.53, incomeIndex: 0.673,
      healthCapacity: 0.44, educationCapacity: 0.42, infrastructureStock: 0.46,
      quintiles: quintiles([35, 54, 80, 123, 390]), creditRating: "Watch",
    },
  },
];

const EVENTS: EventDefinition[] = [
  { id: "commodity", title: "Commodity price surge", description: "Export prices rise, lifting income while imported fuel costs begin to bite.", forecastable: true, effects: { growth: 1.2, inflation: 0.8, confidence: 4, unrest: -1, exchange: -3, investment: 1 } },
  { id: "drought", title: "Regional drought", description: "Harvest losses raise food prices and strain low-income households.", forecastable: true, effects: { growth: -1.4, inflation: 2.3, confidence: -4, unrest: 5, exchange: 2, investment: -0.5 } },
  { id: "global-rates", title: "Global rate shock", description: "Foreign borrowing reprices as international interest rates climb.", forecastable: true, effects: { growth: -0.8, inflation: 0.7, confidence: -5, unrest: 1, exchange: 6, investment: -1.5 } },
  { id: "investment", title: "Regional investment boom", description: "New supply-chain investment improves capacity and employer confidence.", forecastable: false, effects: { growth: 1.5, inflation: -0.2, confidence: 5, unrest: -2, exchange: -2, investment: 2.3 } },
  { id: "epidemic", title: "Public-health alert", description: "Absences disrupt output and test the resilience of health services.", forecastable: false, effects: { growth: -1.7, inflation: 0.5, confidence: -4, unrest: 4, exchange: 1, investment: -1 } },
  { id: "scandal", title: "Confidence scandal", description: "A procurement leak damages trust in government administration.", forecastable: false, effects: { growth: -0.5, inflation: 0, confidence: -8, unrest: 6, exchange: 3, investment: -1.2 } },
];

function quintiles(incomes: number[]): HouseholdQuintile[] {
  const labels = ["Lowest 20%", "Second 20%", "Middle 20%", "Fourth 20%", "Highest 20%"];
  const mpcs = [0.98, 0.91, 0.82, 0.72, 0.61];
  return incomes.map((income, index) => ({ label: labels[index], income, marginalPropensityToConsume: mpcs[index] }));
}

export function getScenario(id: string) {
  return SCENARIOS.find((scenario) => scenario.id === id) ?? SCENARIOS[0];
}

export function createInitialState(scenario: Scenario): EconomicState {
  return {
    ...scenario.starting,
    quarter: 0,
    quintiles: scenario.starting.quintiles.map((quintile) => ({ ...quintile })),
    lastPolicy: clonePolicy(scenario.defaultPolicy),
    hyperinflationStreak: 0,
    unrestStreak: 0,
  };
}

export function policyForScenario(scenario: Scenario) {
  return clonePolicy(scenario.defaultPolicy);
}

export function validatePolicy(policy: PolicyPackage): string[] {
  const errors: string[] = [];
  if (policy.incomeTaxes.some((rate) => rate < 0 || rate > 55)) errors.push("Income-tax bands must stay between 0% and 55%.");
  if (policy.incomeTaxes.some((rate, index) => index > 0 && rate < policy.incomeTaxes[index - 1])) errors.push("Income-tax bands must be progressive from lowest to highest income.");
  if (policy.vatRate < 0 || policy.vatRate > 25) errors.push("VAT must stay between 0% and 25%.");
  if (policy.corporateRate < 0 || policy.corporateRate > 40) errors.push("Corporate tax must stay between 0% and 40%.");
  if (policy.spendingGDP < 10 || policy.spendingGDP > 35) errors.push("Primary spending must stay between 10% and 35% of GDP.");
  const allocationTotal = Object.values(policy.allocations).reduce((sum, value) => sum + value, 0);
  if (Math.abs(allocationTotal - 100) > 0.001) errors.push("Public-budget allocations must total exactly 100%.");
  if (Object.values(policy.allocations).some((value) => value < 0 || value > 100)) errors.push("Budget allocations must be between 0% and 100%.");
  if (policy.policyRate < 0 || policy.policyRate > 25) errors.push("The central-bank rate must stay between 0% and 25%.");
  if (policy.moneyGrowth < -5 || policy.moneyGrowth > 30) errors.push("Money-supply growth must stay between -5% and 30%.");
  return errors;
}

function seeded(seed: number, quarter: number) {
  let value = (seed + quarter * 374761393) >>> 0;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  value ^= value >>> 16;
  return (value >>> 0) / 4294967296;
}

export function eventForQuarter(seed: number, quarter: number): EventDefinition | null {
  const chance = seeded(seed, quarter);
  if (chance < 0.46) return null;
  return EVENTS[Math.floor(seeded(seed + 87, quarter) * EVENTS.length)];
}

export function getRiskSignal(seed: number, completedQuarter: number) {
  const next = eventForQuarter(seed, completedQuarter + 1);
  return next?.forecastable ? `Risk watch: ${next.title.toLowerCase()} may affect the next quarter.` : "No verified external risk signal for the next quarter.";
}

function giniFromIncome(quintileData: HouseholdQuintile[]) {
  const values = quintileData.map((entry) => entry.income).sort((a, b) => a - b);
  const total = values.reduce((sum, value) => sum + value, 0);
  if (!total) return 0;
  let difference = 0;
  values.forEach((value) => values.forEach((other) => { difference += Math.abs(value - other); }));
  return clamp(difference / (2 * values.length * total), 0, 0.75);
}

function povertyFromIncome(quintileData: HouseholdQuintile[]) {
  return round(quintileData.reduce((total, entry) => total + clamp((105 - entry.income) / 105, 0, 1) * 20, 0), 1);
}

function normalizeAllocations(allocations: PolicyPackage["allocations"]) {
  const sum = Object.values(allocations).reduce((total, value) => total + value, 0) || 1;
  return {
    health: round((allocations.health / sum) * 100),
    education: round((allocations.education / sum) * 100),
    infrastructure: round((allocations.infrastructure / sum) * 100),
    transfers: round(100 - round((allocations.health / sum) * 100) - round((allocations.education / sum) * 100) - round((allocations.infrastructure / sum) * 100)),
  };
}

function constrainedPolicy(state: EconomicState, policy: PolicyPackage) {
  const constrained = state.unrest >= 75 || state.debtGDP >= 105;
  if (!constrained) return { policy: clonePolicy(policy), constrained: false };
  const previous = state.lastPolicy;
  const cap = (value: number, before: number, limit: number) => clamp(value, before - limit, before + limit);
  const allocations = normalizeAllocations({
    health: cap(policy.allocations.health, previous.allocations.health, 4),
    education: cap(policy.allocations.education, previous.allocations.education, 4),
    infrastructure: cap(policy.allocations.infrastructure, previous.allocations.infrastructure, 4),
    transfers: cap(policy.allocations.transfers, previous.allocations.transfers, 4),
  });
  return {
    constrained: true,
    policy: {
      incomeTaxes: policy.incomeTaxes.map((value, index) => cap(value, previous.incomeTaxes[index], 2)) as IncomeTaxes,
      vatRate: cap(policy.vatRate, previous.vatRate, 2), corporateRate: cap(policy.corporateRate, previous.corporateRate, 2),
      spendingGDP: cap(policy.spendingGDP, previous.spendingGDP, 1), allocations,
      policyRate: cap(policy.policyRate, previous.policyRate, 2), moneyGrowth: cap(policy.moneyGrowth, previous.moneyGrowth, 4),
    },
  };
}

function averageIncomeTax(policy: PolicyPackage) {
  return policy.incomeTaxes.reduce((total, rate, index) => total + rate * [0.1, 0.16, 0.22, 0.24, 0.28][index], 0);
}

function makeAdvisor(previous: EconomicState, next: EconomicState, policy: PolicyPackage, event: EventDefinition | null, constrained: boolean) {
  const messages: string[] = [];
  if (event) messages.push(`${event.title}: ${event.description}`);
  if (policy.allocations.transfers >= 28 && next.gini < previous.gini) messages.push("Transfers protected lower-income households; inequality eased, though the budget trade-off remains visible in borrowing.");
  else if (policy.vatRate >= 17) messages.push("Higher consumption tax strengthened revenue but reduced real household spending, with the sharpest effect on lower quintiles.");
  else if (policy.corporateRate <= 18) messages.push("The lighter business-tax burden supported investment; watch whether the lost revenue weakens public service gains.");
  else messages.push("The current fiscal mix is balancing household demand, investor incentives, and public-service capacity.");
  if (policy.policyRate > previous.policyRate || policy.moneyGrowth < previous.lastPolicy.moneyGrowth) messages.push("Monetary policy is leaning against inflation. The stabilising effect arrives with a short growth and employment cost.");
  else if (next.inflation > previous.inflation + 0.5) messages.push("Money supply and demand are drifting apart; inflation expectations and exchange pressure are now the main risks.");
  else messages.push("Money demand is responding to income, confidence, and interest rates; keep liquidity close to real economic needs.");
  if (constrained) messages.push("Emergency conditions constrained the scale of this quarter’s policy changes.");
  return messages.slice(0, 4);
}

export function advanceQuarter(state: EconomicState, requestedPolicy: PolicyPackage, seed: number): QuarterResult {
  const policyCheck = validatePolicy(requestedPolicy);
  if (policyCheck.length) throw new Error(policyCheck.join(" "));
  const adjustment = constrainedPolicy(state, requestedPolicy);
  const policy = adjustment.policy;
  const event = eventForQuarter(seed, state.quarter + 1);
  const shock = event?.effects ?? { growth: 0, inflation: 0, confidence: 0, unrest: 0, exchange: 0, investment: 0 };
  const averageTax = averageIncomeTax(policy);
  const healthSpend = policy.spendingGDP * policy.allocations.health / 100;
  const educationSpend = policy.spendingGDP * policy.allocations.education / 100;
  const infrastructureSpend = policy.spendingGDP * policy.allocations.infrastructure / 100;
  const transfersSpend = policy.spendingGDP * policy.allocations.transfers / 100;
  const taxCompliance = clamp(0.77 + state.confidence / 500 - averageTax / 500, 0.62, 0.94);
  const consumptionShare = clamp(0.59 - policy.vatRate * 0.003 + transfersSpend * 0.003, 0.48, 0.68);
  const incomeRevenue = averageTax * 0.53 * taxCompliance;
  const vatRevenue = consumptionShare * policy.vatRate * 0.72;
  const corporateRevenue = policy.corporateRate * 0.18 * (0.92 + state.confidence / 1200);
  const revenueGDP = incomeRevenue + vatRevenue + corporateRevenue;
  const riskSpread = 1.25 + Math.max(0, state.debtGDP - 55) * 0.055 + Math.max(0, 58 - state.confidence) * 0.035 + (state.creditRating === "Downgraded" ? 1.1 : state.creditRating === "Distressed" ? 2.4 : 0);
  const interestGDP = state.debtGDP * ((policy.policyRate + riskSpread) / 100) / 4;
  const deficitGDP = policy.spendingGDP + interestGDP - revenueGDP;
  const fiscalImpulse = (policy.spendingGDP - 21) * 0.16 + (transfersSpend - 4.7) * 0.12;
  const taxDrag = (averageTax - 26) * 0.045 + (policy.vatRate - 12) * 0.07 + (policy.corporateRate - 24) * 0.055;
  const monetaryDrag = (state.policyRate - 6) * 0.18 - (state.lastPolicy.moneyGrowth - 8) * 0.035;
  const publicCapacity = state.infrastructureStock * 0.8 + state.healthCapacity * 0.18 + state.educationCapacity * 0.22;
  const annualGrowth = clamp(state.potentialGrowth + publicCapacity + fiscalImpulse - taxDrag - monetaryDrag + shock.growth + shock.investment * 0.45 - Math.max(0, state.exchangePressure - 12) * 0.055, -8, 13);
  const realGDP = round(state.realGDP * (1 + annualGrowth / 400), 2);
  const potentialGDP = round(state.potentialGDP * (1 + (state.potentialGrowth + state.infrastructureStock * 0.35) / 400), 2);
  const outputGap = (realGDP / potentialGDP - 1) * 100;
  const moneySupply = round(state.moneySupply * (1 + policy.moneyGrowth / 400), 2);
  const nominalActivity = realGDP * (1 + Math.max(-0.5, state.inflation) / 100);
  const moneyDemand = round(nominalActivity * 0.67 * (1 - (state.policyRate - 6) * 0.008 + (100 - state.confidence) * 0.0018), 2);
  const moneyGap = ((moneySupply - moneyDemand) / Math.max(1, moneyDemand)) * 100;
  const exchangePressure = clamp(state.exchangePressure * 0.58 + Math.max(0, policy.policyRate - state.inflation) * -0.12 + Math.max(0, state.inflation - policy.policyRate) * 0.22 + Math.max(0, deficitGDP - 3) * 0.25 + shock.exchange - state.capitalFlow * 0.25, -12, 85);
  const inflation = clamp(state.inflation * 0.72 + 1.15 + moneyGap * 0.16 + outputGap * 0.12 + exchangePressure * 0.07 - (state.policyRate - 5) * 0.18 + shock.inflation, -1, 85);
  const capitalFlow = clamp(state.capitalFlow * 0.5 + state.confidence * 0.06 + (policy.policyRate - inflation) * 0.28 - Math.max(0, state.debtGDP - 65) * 0.1 + shock.investment * 1.1, -18, 16);
  const confidence = clamp(state.confidence + annualGrowth * 0.65 - Math.max(0, inflation - 6) * 0.33 - Math.max(0, deficitGDP - 3) * 0.7 - Math.max(0, state.debtGDP - 70) * 0.1 - state.unrest * 0.045 + shock.confidence, 12, 94);
  const nextQuintiles = state.quintiles.map((quintile, index) => {
    const effectiveIncomeRate = policy.incomeTaxes[index] * [0.18, 0.34, 0.53, 0.72, 0.9][index] / 100;
    const vatBurden = policy.vatRate * quintile.marginalPropensityToConsume * 0.0018;
    const transferShares = [0.46, 0.28, 0.16, 0.07, 0.03];
    const transfer = transfersSpend * 4.4 * transferShares[index];
    const serviceBenefit = healthSpend * [0.22, 0.18, 0.13, 0.08, 0.04][index] + educationSpend * [0.1, 0.13, 0.15, 0.11, 0.05][index];
    return { ...quintile, income: round(Math.max(14, quintile.income * (1 + annualGrowth / 430) * (1 - effectiveIncomeRate - vatBurden) + transfer + serviceBenefit), 1) };
  });
  const gini = giniFromIncome(nextQuintiles);
  const poverty = povertyFromIncome(nextQuintiles);
  const unemployment = clamp(state.unemployment - (annualGrowth - 2) * 0.16 + shock.growth * -0.14 + Math.max(0, state.exchangePressure - 20) * 0.03, 2.2, 28);
  const unrest = clamp(state.unrest + (gini - 0.43) * 16 + Math.max(0, inflation - 7) * 0.26 + Math.max(0, unemployment - 9) * 0.38 - transfersSpend * 0.24 - healthSpend * 0.12 - confidence * 0.035 + shock.unrest, 3, 100);
  const debtGDP = clamp(state.debtGDP + deficitGDP - annualGrowth * 0.18 + Math.max(0, inflation - 12) * 0.05, 4, 220);
  const healthCapacity = clamp(state.healthCapacity * 0.994 + healthSpend * 0.011, 0.25, 0.95);
  const educationCapacity = clamp(state.educationCapacity * 0.995 + educationSpend * 0.009, 0.25, 0.95);
  const infrastructureStock = clamp(state.infrastructureStock * 0.994 + infrastructureSpend * 0.008, 0.25, 0.95);
  const healthIndex = clamp(state.healthIndex + healthSpend * 0.00055 - Math.max(0, inflation - 12) * 0.00028, 0.4, 0.94);
  const educationIndex = clamp(state.educationIndex + educationSpend * 0.00042 + educationCapacity * 0.00012, 0.4, 0.94);
  const incomeIndex = clamp(state.incomeIndex + annualGrowth * 0.00045 - Math.max(0, poverty - 25) * 0.00009, 0.4, 0.94);
  const hdi = clamp((healthIndex + educationIndex + incomeIndex) / 3, 0.4, 0.94);
  const creditRating: EconomicState["creditRating"] = debtGDP > 115 || confidence < 30 ? "Distressed" : debtGDP > 82 || confidence < 43 ? "Downgraded" : debtGDP > 65 || confidence < 55 ? "Watch" : "Sound";
  const hyperinflationStreak = inflation > 50 ? state.hyperinflationStreak + 1 : 0;
  const unrestStreak = unrest > 85 ? state.unrestStreak + 1 : 0;
  const crisis = hyperinflationStreak >= 2 ? "Hyperinflation has persisted for two quarters." : debtGDP > 130 && interestGDP > revenueGDP * 0.25 && capitalFlow < -4 ? "Sovereign default: lenders have closed access to credit." : unrestStreak >= 3 ? "Social collapse: sustained unrest has ended the mandate." : null;
  const next: EconomicState = {
    quarter: state.quarter + 1, realGDP, potentialGDP, potentialGrowth: state.potentialGrowth, annualGrowth: round(annualGrowth), inflation: round(inflation), unemployment: round(unemployment),
    debtGDP: round(debtGDP), deficitGDP: round(deficitGDP), revenueGDP: round(revenueGDP), primarySpendingGDP: policy.spendingGDP, interestGDP: round(interestGDP), policyRate: policy.policyRate,
    moneySupply, moneyDemand, exchangePressure: round(exchangePressure), capitalFlow: round(capitalFlow), confidence: round(confidence), unrest: round(unrest), gini: round(gini, 3), poverty, hdi: round(hdi, 3), healthIndex: round(healthIndex, 3), educationIndex: round(educationIndex, 3), incomeIndex: round(incomeIndex, 3),
    healthCapacity: round(healthCapacity, 3), educationCapacity: round(educationCapacity, 3), infrastructureStock: round(infrastructureStock, 3), quintiles: nextQuintiles, creditRating, hyperinflationStreak, unrestStreak, lastPolicy: clonePolicy(policy),
  };
  return { state: next, event, advisor: makeAdvisor(state, next, policy, event, adjustment.constrained), crisis, constrained: adjustment.constrained, effectivePolicy: policy };
}

export function buildEndgameReport(state: EconomicState, baseline: EconomicState, crisis: string | null = null): EndgameReport {
  const cumulativeGrowth = ((state.realGDP / baseline.realGDP) - 1) * 100;
  const prosperity = clamp(((cumulativeGrowth + 3) / 21) * 25, 0, 25);
  const inclusion = clamp((baseline.gini - state.gini) * 300 + (baseline.poverty - state.poverty) * 1.05, 0, 25);
  const development = clamp((state.hdi - baseline.hdi) * 625, 0, 25);
  const inflationScore = clamp(10 - Math.abs(state.inflation - 4) * 0.75, 0, 10);
  const jobsScore = clamp(8 - Math.max(0, state.unemployment - 6) * 0.8, 0, 8);
  const debtScore = clamp(7 - Math.max(0, state.debtGDP - 55) * 0.14, 0, 7);
  const stability = inflationScore + jobsScore + debtScore;
  const total = crisis ? 0 : round(prosperity + inclusion + development + stability);
  const tier: EndgameReport["tier"] = crisis ? "Crisis government" : total >= 85 ? "Transformative mandate" : total >= 70 ? "Successful mandate" : "Unfinished mandate";
  const summary = crisis ? crisis : total >= 85 ? "You combined shared prosperity with credible stability and durable human development." : total >= 70 ? "Your mandate held the major trade-offs in balance and delivered broad progress." : "The term ended intact, but the balance between growth, equity, and stability was not yet strong enough.";
  return { total, tier, scores: { prosperity: round(prosperity), inclusion: round(inclusion), development: round(development), stability: round(stability) }, summary };
}
