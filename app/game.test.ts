import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceQuarter,
  buildEndgameReport,
  createInitialState,
  deriveDistributionMetrics,
  eventForQuarter,
  getScenario,
  policyForScenario,
  SCENARIOS,
  type EconomicState,
  type PolicyPackage,
  validatePolicy,
} from "./game.ts";

const aster = getScenario("aster");

function copyPolicy(policy: PolicyPackage): PolicyPackage {
  return {
    ...policy,
    incomeTaxes: [...policy.incomeTaxes] as PolicyPackage["incomeTaxes"],
    allocations: { ...policy.allocations },
  };
}

function assertNear(actual: number, expected: number, tolerance = 0.16) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    "expected " + actual + " to be within " + tolerance + " of " + expected,
  );
}

function resolvePath(scenarioId: string, policy: PolicyPackage, quarters = 40) {
  const scenario = getScenario(scenarioId);
  const baseline = createInitialState(scenario);
  let state = baseline;
  let crisis: string | null = null;

  for (let index = 0; index < quarters && !crisis; index += 1) {
    const result = advanceQuarter(state, policy, scenario.seed);
    state = result.state;
    crisis = result.crisis;
  }

  return { baseline, state, crisis, report: buildEndgameReport(state, baseline, crisis) };
}

test("the simulation is deterministic for a scenario seed", () => {
  const start = createInitialState(aster);
  const policy = policyForScenario(aster);
  const first = advanceQuarter(start, policy, aster.seed);
  const second = advanceQuarter(start, policy, aster.seed);
  assert.deepEqual(first, second);
});

test("scenario IDs and all forty seeded event sequences remain fixed", () => {
  assert.deepEqual(SCENARIOS.map((scenario) => scenario.id), ["aster", "veyra", "nambara"]);
  const expected: Record<string, Array<string | null>> = {
    aster: [null, "commodity", null, null, null, null, "drought", "scandal", "investment", "global-rates", null, null, "investment", null, "epidemic", null, null, null, "investment", "drought", null, "scandal", "commodity", null, "drought", "drought", null, null, "epidemic", null, "investment", null, null, "commodity", null, "scandal", "investment", null, "scandal", "investment"],
    veyra: [null, "scandal", null, null, "scandal", "commodity", "scandal", "commodity", "drought", "drought", "commodity", "commodity", null, null, null, "epidemic", null, "scandal", null, "global-rates", null, null, "global-rates", null, null, "global-rates", null, "epidemic", "commodity", "investment", null, null, null, "epidemic", "global-rates", null, "global-rates", "commodity", "drought", null],
    nambara: ["scandal", "epidemic", "scandal", "investment", "investment", null, null, "commodity", null, "drought", null, "commodity", null, "scandal", null, "epidemic", "drought", "investment", null, "global-rates", null, "commodity", "global-rates", "investment", null, null, null, null, "investment", "scandal", null, "global-rates", null, "global-rates", null, "scandal", "global-rates", null, null, null],
  };

  for (const scenario of SCENARIOS) {
    const events = Array.from({ length: 40 }, (_, index) => eventForQuarter(scenario.seed, index + 1)?.id ?? null);
    assert.deepEqual(events, expected[scenario.id], scenario.name + " event sequence changed");
  }
});

test("each campaign starts from quintile-derived distribution indicators without a free inclusion gain", () => {
  const expected = {
    aster: { gini: 0.422, poverty: 23.2 },
    veyra: { gini: 0.526, poverty: 32.6 },
    nambara: { gini: 0.457, poverty: 27.8 },
  };

  for (const scenario of SCENARIOS) {
    const start = createInitialState(scenario);
    const distribution = expected[scenario.id as keyof typeof expected];
    assert.deepEqual(deriveDistributionMetrics(start.quintiles), distribution);
    assert.equal(start.gini, distribution.gini);
    assert.equal(start.poverty, distribution.poverty);
    const resolved = advanceQuarter(start, policyForScenario(scenario), scenario.seed);
    assert.ok(
      Math.abs(resolved.state.gini - start.gini) < 0.01,
      scenario.name + " should not receive a first-turn inequality windfall",
    );
  }
});

test("each campaign resolves its opening quarter with its existing default policy", () => {
  for (const scenario of SCENARIOS) {
    const result = advanceQuarter(createInitialState(scenario), policyForScenario(scenario), scenario.seed);
    assert.equal(result.state.quarter, 1, scenario.name + " should resolve its first quarter");
  }
});

test("policy validation rejects regressive income bands and unallocated budgets", () => {
  const invalid = policyForScenario(aster);
  invalid.incomeTaxes = [20, 10, 30, 40, 45];
  invalid.allocations.health = 20;
  assert.ok(validatePolicy(invalid).some((message) => message.includes("progressive")));
  assert.ok(validatePolicy(invalid).some((message) => message.includes("total exactly 100")));
});

test("the annualised fiscal identity and quarterly nominal-debt transition hold", () => {
  const start = createInitialState(aster);
  const result = advanceQuarter(start, policyForScenario(aster), aster.seed);
  const { state } = result;
  assertNear(state.deficitGDP, state.primarySpendingGDP + state.interestGDP - state.revenueGDP);
  const nominalGDPFactor = (1 + state.annualGrowth / 400) * (1 + state.inflation / 400);
  assertNear(state.debtGDP, (start.debtGDP + state.deficitGDP / 4) / nominalGDPFactor);
});

test("debt repricing is partial rather than an instant full-stock rate reset", () => {
  const start = createInitialState(aster);
  start.debtGDP = 80;
  start.interestGDP = 3;
  start.creditRating = "Watch";
  const lowRate = policyForScenario(aster);
  const highRate = policyForScenario(aster);
  lowRate.policyRate = 4;
  highRate.policyRate = 16;

  const low = advanceQuarter(start, lowRate, 1).state;
  const high = advanceQuarter(start, highRate, 1).state;
  assert.ok(high.interestGDP > low.interestGDP);
  assert.ok(high.interestGDP - low.interestGDP < 1, "only a refinancing share should reprice this quarter");
});

test("VAT raises revenue, creates a one-off price effect, and does not repeat that effect once settled", () => {
  const start = createInitialState(aster);
  const lowVAT = policyForScenario(aster);
  const highVAT = policyForScenario(aster);
  lowVAT.vatRate = 5;
  highVAT.vatRate = 20;

  const lower = advanceQuarter(start, lowVAT, 1).state;
  const changed = advanceQuarter(start, highVAT, 1).state;
  const settledStart: EconomicState = { ...start, lastPolicy: copyPolicy(highVAT) };
  const settled = advanceQuarter(settledStart, highVAT, 1).state;

  assert.ok(changed.revenueGDP > lower.revenueGDP);
  assert.ok(changed.annualGrowth < lower.annualGrowth);
  assert.ok(changed.inflation > settled.inflation + 0.8);
  assert.ok(changed.quintiles[0].income < settled.quintiles[0].income);
});

test("tax and transfer effects are policy transitions, while quintiles retain their ordering", () => {
  const start = createInitialState(aster);
  const higherTax = policyForScenario(aster);
  higherTax.incomeTaxes = [8, 16, 26, 37, 50];
  const transitioned = advanceQuarter(start, higherTax, 1).state;
  const alreadyAppliedStart: EconomicState = { ...start, lastPolicy: copyPolicy(higherTax) };
  const settled = advanceQuarter(alreadyAppliedStart, higherTax, 1).state;
  assert.ok(transitioned.quintiles[4].income < settled.quintiles[4].income);

  const lowTransfers = policyForScenario(aster);
  lowTransfers.allocations = { health: 26, education: 26, infrastructure: 42, transfers: 6 };
  const highTransfers = policyForScenario(aster);
  highTransfers.allocations = { health: 20, education: 20, infrastructure: 26, transfers: 34 };
  const low = advanceQuarter(start, lowTransfers, 1).state;
  const high = advanceQuarter(start, highTransfers, 1).state;
  assert.ok(high.gini < low.gini);
  assert.ok(high.quintiles[0].income > low.quintiles[0].income);

  const path = resolvePath("aster", highTransfers, 12);
  for (let index = 1; index < path.state.quintiles.length; index += 1) {
    assert.ok(path.state.quintiles[index].income > path.state.quintiles[index - 1].income);
  }
});

test("corporate-tax changes have a bounded capital-flow and investment trade-off", () => {
  const start = createInitialState(aster);
  const lowCorporate = policyForScenario(aster);
  const highCorporate = policyForScenario(aster);
  lowCorporate.corporateRate = 16;
  highCorporate.corporateRate = 34;
  const low = advanceQuarter(start, lowCorporate, 1).state;
  const high = advanceQuarter(start, highCorporate, 1).state;

  assert.ok(low.capitalFlow > high.capitalFlow);
  assert.ok(high.revenueGDP > low.revenueGDP);
  assert.ok(Math.abs(low.capitalFlow - high.capitalFlow) < 3);
});

test("rates and liquidity affect financial conditions now and activity and jobs next quarter", () => {
  const start = createInitialState(aster);
  const baselinePolicy = policyForScenario(aster);
  const tightPolicy = policyForScenario(aster);
  tightPolicy.policyRate = 16;
  tightPolicy.moneyGrowth = 4;

  const baselineQuarterOne = advanceQuarter(start, baselinePolicy, 1).state;
  const tightQuarterOne = advanceQuarter(start, tightPolicy, 1).state;
  assert.equal(tightQuarterOne.annualGrowth, baselineQuarterOne.annualGrowth);
  assert.ok(tightQuarterOne.inflation < baselineQuarterOne.inflation);

  const baselineQuarterTwo = advanceQuarter(baselineQuarterOne, baselinePolicy, 1).state;
  const tightQuarterTwo = advanceQuarter(tightQuarterOne, tightPolicy, 1).state;
  assert.ok(tightQuarterTwo.annualGrowth < baselineQuarterTwo.annualGrowth);
  assert.ok(tightQuarterTwo.unemployment > baselineQuarterTwo.unemployment);
  assert.notEqual(tightQuarterOne.moneyDemand, start.moneyDemand);
});

test("unemployment responds to the output gap and drifts back toward the six-percent benchmark", () => {
  const weak = createInitialState(aster);
  weak.unemployment = 12;
  const result = advanceQuarter(weak, policyForScenario(aster), 1).state;
  assert.ok(result.unemployment < weak.unemployment);
  assert.ok(result.unemployment > 6);
});

test("capacity compounds gradually: services lift development while roads lift infrastructure", () => {
  const services = policyForScenario(aster);
  services.allocations = { health: 38, education: 36, infrastructure: 12, transfers: 14 };
  const roads = policyForScenario(aster);
  roads.allocations = { health: 10, education: 10, infrastructure: 65, transfers: 15 };
  const servicePath = resolvePath("aster", services, 12).state;
  const roadsPath = resolvePath("aster", roads, 12).state;

  assert.ok(servicePath.hdi > roadsPath.hdi);
  assert.ok(servicePath.healthCapacity > roadsPath.healthCapacity);
  assert.ok(servicePath.educationCapacity > roadsPath.educationCapacity);
  assert.ok(roadsPath.infrastructureStock > servicePath.infrastructureStock);
  assert.ok(servicePath.healthCapacity < 0.8, "normal allocations should not saturate capacity in one mandate");
});

test("health cushions epidemics, investment improves persistent capacity, and global rates tighten borrowing stress", () => {
  const epidemicLow = createInitialState(aster);
  const epidemicHigh = createInitialState(aster);
  epidemicLow.quarter = 14;
  epidemicHigh.quarter = 14;
  epidemicLow.healthCapacity = 0.25;
  epidemicHigh.healthCapacity = 0.9;
  const policy = policyForScenario(aster);
  const lowEvent = advanceQuarter(epidemicLow, policy, aster.seed);
  const lowNoEvent = advanceQuarter(epidemicLow, policy, 0);
  const highEvent = advanceQuarter(epidemicHigh, policy, aster.seed);
  const highNoEvent = advanceQuarter(epidemicHigh, policy, 0);
  assert.equal(lowEvent.event?.id, "epidemic");
  assert.equal(lowNoEvent.event, null);
  assert.ok(
    highEvent.state.annualGrowth - highNoEvent.state.annualGrowth
      > lowEvent.state.annualGrowth - lowNoEvent.state.annualGrowth,
  );

  const investment = createInitialState(aster);
  investment.quarter = 8;
  const investmentResult = advanceQuarter(investment, policy, aster.seed);
  const noInvestmentResult = advanceQuarter(investment, policy, 2);
  assert.equal(investmentResult.event?.id, "investment");
  assert.ok(investmentResult.state.infrastructureStock > noInvestmentResult.state.infrastructureStock);
  const investmentNext = advanceQuarter(investmentResult.state, policy, aster.seed);
  const noInvestmentNext = advanceQuarter(noInvestmentResult.state, policy, 2);
  assert.ok(investmentNext.state.infrastructureStock > noInvestmentNext.state.infrastructureStock);

  const globalRate = createInitialState(aster);
  globalRate.quarter = 9;
  globalRate.debtGDP = 100;
  globalRate.interestGDP = 5;
  globalRate.creditRating = "Watch";
  const globalShock = advanceQuarter(globalRate, policy, aster.seed);
  const noGlobalShock = advanceQuarter(globalRate, policy, 2);
  assert.equal(globalShock.event?.id, "global-rates");
  assert.ok(globalShock.state.interestGDP > noGlobalShock.state.interestGDP);
  assert.ok(globalShock.state.capitalFlow < noGlobalShock.state.capitalFlow);
});

test("unchanged default policies survive forty quarters but remain unfinished", () => {
  for (const scenario of SCENARIOS) {
    const resolved = resolvePath(scenario.id, policyForScenario(scenario));
    assert.equal(resolved.crisis, null, scenario.name + " should survive the mandate unchanged");
    assert.equal(resolved.state.quarter, 40);
    assert.equal(resolved.report.tier, "Unfinished mandate");
    assert.ok(resolved.report.total < 70);
    assert.ok(resolved.state.healthCapacity < 0.9);
    assert.ok(resolved.state.educationCapacity < 0.9);
    assert.ok(resolved.state.infrastructureStock < 0.9);
  }
});

test("a deliberate stabilisation path succeeds in every campaign", () => {
  const stabilisationPolicies: Record<string, PolicyPackage> = {
    aster: {
      incomeTaxes: [8, 9, 9, 35, 48], vatRate: 16, corporateRate: 26, spendingGDP: 27,
      allocations: { health: 26, education: 34, infrastructure: 11, transfers: 29 }, policyRate: 7, moneyGrowth: 8,
    },
    veyra: {
      incomeTaxes: [8, 11, 13, 33, 48], vatRate: 15, corporateRate: 24, spendingGDP: 24,
      allocations: { health: 34, education: 33, infrastructure: 18, transfers: 15 }, policyRate: 8, moneyGrowth: 7,
    },
    nambara: {
      incomeTaxes: [4, 11, 13, 32, 47], vatRate: 13, corporateRate: 29, spendingGDP: 26,
      allocations: { health: 28, education: 31, infrastructure: 11, transfers: 30 }, policyRate: 7, moneyGrowth: 11,
    },
  };

  for (const [scenarioId, policy] of Object.entries(stabilisationPolicies)) {
    assert.deepEqual(validatePolicy(policy), []);
    const resolved = resolvePath(scenarioId, policy);
    assert.equal(resolved.crisis, null, scenarioId + " path should not end in crisis");
    assert.equal(resolved.report.tier, "Successful mandate");
    assert.ok(resolved.report.total >= 70);
  }
});

test("the retained endgame score thresholds use the existing four-part formula", () => {
  const baseline = createInitialState(aster);
  const state: EconomicState = {
    ...baseline,
    realGDP: 115,
    hdi: 0.69,
    inflation: 4,
    unemployment: 6,
    debtGDP: 55,
  };
  const report = buildEndgameReport(state, baseline);
  assert.equal(report.total, 71.4);
  assert.equal(report.tier, "Successful mandate");
  assert.deepEqual(report.scores, { prosperity: 21.4, inclusion: 0, development: 25, stability: 25 });
});

test("persistent hyperinflation triggers a terminal crisis", () => {
  const unstable = createInitialState(aster);
  unstable.inflation = 80;
  unstable.hyperinflationStreak = 1;
  unstable.policyRate = 0;
  unstable.lastPolicy.moneyGrowth = 30;
  const reckless = policyForScenario(aster);
  reckless.policyRate = 0;
  reckless.moneyGrowth = 30;
  const result = advanceQuarter(unstable, reckless, aster.seed);
  assert.match(result.crisis ?? "", /Hyperinflation/);
});
