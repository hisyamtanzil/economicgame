import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceQuarter,
  createInitialState,
  getScenario,
  policyForScenario,
  validatePolicy,
} from "./game.ts";

const aster = getScenario("aster");

test("the simulation is deterministic for a scenario seed", () => {
  const start = createInitialState(aster);
  const policy = policyForScenario(aster);
  const first = advanceQuarter(start, policy, aster.seed);
  const second = advanceQuarter(start, policy, aster.seed);
  assert.deepEqual(first, second);
});

test("policy validation rejects regressive income bands and unallocated budgets", () => {
  const invalid = policyForScenario(aster);
  invalid.incomeTaxes = [20, 10, 30, 40, 45];
  invalid.allocations.health = 20;
  assert.ok(validatePolicy(invalid).some((message) => message.includes("progressive")));
  assert.ok(validatePolicy(invalid).some((message) => message.includes("total exactly 100")));
});

test("higher VAT raises revenue while putting more drag on demand", () => {
  const start = createInitialState(aster);
  const lowVAT = policyForScenario(aster);
  lowVAT.vatRate = 5;
  const highVAT = policyForScenario(aster);
  highVAT.vatRate = 20;
  const lowResult = advanceQuarter(start, lowVAT, aster.seed);
  const highResult = advanceQuarter(start, highVAT, aster.seed);
  assert.ok(highResult.state.revenueGDP > lowResult.state.revenueGDP);
  assert.ok(highResult.state.annualGrowth < lowResult.state.annualGrowth);
});

test("transfers improve the income distribution", () => {
  const start = createInitialState(aster);
  const lowTransfers = policyForScenario(aster);
  lowTransfers.allocations = { health: 26, education: 26, infrastructure: 42, transfers: 6 };
  const highTransfers = policyForScenario(aster);
  highTransfers.allocations = { health: 20, education: 20, infrastructure: 26, transfers: 34 };
  const lowResult = advanceQuarter(start, lowTransfers, aster.seed);
  const highResult = advanceQuarter(start, highTransfers, aster.seed);
  assert.ok(highResult.state.gini < lowResult.state.gini);
  assert.ok(highResult.state.quintiles[0].income > lowResult.state.quintiles[0].income);
});

test("health and education investment compound human development", () => {
  const start = createInitialState(aster);
  const services = policyForScenario(aster);
  services.allocations = { health: 38, education: 36, infrastructure: 12, transfers: 14 };
  const roads = policyForScenario(aster);
  roads.allocations = { health: 10, education: 10, infrastructure: 65, transfers: 15 };
  const serviceResult = advanceQuarter(start, services, aster.seed);
  const roadsResult = advanceQuarter(start, roads, aster.seed);
  assert.ok(serviceResult.state.hdi > roadsResult.state.hdi);
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
