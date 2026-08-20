import assert from "node:assert/strict";
import test from "node:test";
import { getCampaignProfile } from "./campaign-content.ts";
import {
  deriveEconomicDisplay,
  deriveHouseholdResponses,
  estimatePriceIndex,
  formatNominalBillions,
  formatPeople,
} from "./economic-display.ts";
import { advanceQuarter, createInitialState, getScenario, policyForScenario } from "./game.ts";

const aster = getScenario("aster");
const profile = getCampaignProfile("aster");

test("display estimates turn existing model indexes into labelled fictional totals without mutation", () => {
  const initial = createInitialState(aster);
  const snapshot = JSON.stringify(initial);
  const display = deriveEconomicDisplay(initial, initial, [initial], profile);

  assert.equal(display.priceIndex, 1);
  assert.equal(display.nominalGDPBillions, profile.displayScale.baseNominalGDPBillions);
  assert.ok(Math.abs(display.annualizedRevenueBillions - 124.3172) < 1e-9);
  assert.ok(Math.abs(display.publicDebtBillions - 330.696) < 1e-9);
  assert.equal(display.povertyEquivalentPeople, 6_996_000);
  assert.equal(JSON.stringify(initial), snapshot);
  assert.equal(formatNominalBillions(display.nominalGDPBillions, profile), "AC 612.4bn");
  assert.equal(formatPeople(display.povertyEquivalentPeople), "7.0m");
});

test("price-index and fiscal display estimates derive from history rather than saved-run fields", () => {
  const initial = createInitialState(aster);
  const result = advanceQuarter(initial, policyForScenario(aster), aster.seed);
  const priceIndex = estimatePriceIndex([initial, result.state], result.state);
  const display = deriveEconomicDisplay(result.state, initial, [initial, result.state], profile);

  assert.ok(priceIndex > 1);
  assert.equal(display.priceIndex, priceIndex);
  assert.ok(display.nominalGDPBillions > profile.displayScale.baseNominalGDPBillions);
  assert.ok(display.annualizedRevenueBillions > 0);
  assert.ok(display.publicDebtBillions > 0);
});

test("household protest signals are deterministic presentation-only policy indicators", () => {
  const initial = createInitialState(aster);
  const baselinePolicy = policyForScenario(aster);
  const baselineSignals = deriveHouseholdResponses(initial, baselinePolicy);
  assert.deepEqual(baselineSignals.map((signal) => signal.signal), [
    "No protest signal",
    "No protest signal",
    "No protest signal",
  ]);

  const highPressurePolicy = policyForScenario(aster);
  highPressurePolicy.incomeTaxes = [20, 25, 35, 45, 55];
  highPressurePolicy.vatRate = 25;
  highPressurePolicy.corporateRate = 40;
  highPressurePolicy.policyRate = 15;
  highPressurePolicy.spendingGDP = 35;
  highPressurePolicy.allocations = { health: 10, education: 10, infrastructure: 80, transfers: 0 };
  const policySnapshot = JSON.stringify(highPressurePolicy);
  const stateSnapshot = JSON.stringify(initial);
  const signals = deriveHouseholdResponses(initial, highPressurePolicy);

  assert.deepEqual(signals.map((signal) => signal.signal), ["Protest likely", "Protest likely", "Protest likely"]);
  assert.equal(JSON.stringify(highPressurePolicy), policySnapshot);
  assert.equal(JSON.stringify(initial), stateSnapshot);
});
