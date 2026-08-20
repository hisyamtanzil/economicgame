import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceQuarter,
  createInitialState,
  deriveDistributionMetrics,
  getScenario,
  policyForScenario,
} from "./game.ts";
import { parseSavedRun, RUN_STORAGE_KEY, type SavedRun } from "./run-storage.ts";

test("the rebrand retains the existing v1 local-storage key and run shape", () => {
  const scenario = getScenario("aster");
  const initial = createInitialState(scenario);
  const savedRun: SavedRun = {
    scenarioId: scenario.id,
    seed: scenario.seed,
    baseline: initial,
    state: initial,
    history: [initial],
    crisis: null,
    lastResult: null,
  };

  assert.equal(RUN_STORAGE_KEY, "commonwealth-policy-lab-run-v1");
  assert.deepEqual(parseSavedRun(JSON.stringify(savedRun)), savedRun);
});

test("malformed saved runs are ignored without preventing a new campaign", () => {
  assert.equal(parseSavedRun("{not valid json"), null);
  assert.equal(parseSavedRun(JSON.stringify({ scenarioId: "aster" })), null);
});

test("a legacy v1 run resolves with calibrated equations and retains its persisted shape", () => {
  const scenario = getScenario("aster");
  const initial = createInitialState(scenario);
  // This mirrors a formerly persisted display baseline whose Gini and poverty
  // fields were not yet derived from quintile income. It must still load.
  const legacyState = { ...initial, gini: 0.47, poverty: 22 };
  const legacyRun: SavedRun = {
    scenarioId: scenario.id,
    seed: scenario.seed,
    baseline: legacyState,
    state: legacyState,
    history: [legacyState],
    crisis: null,
    lastResult: null,
  };

  const restored = parseSavedRun(JSON.stringify(legacyRun));
  assert.deepEqual(restored, legacyRun);
  assert.ok(restored);
  const result = advanceQuarter(restored.state, policyForScenario(scenario), restored.seed);
  const persisted: SavedRun = {
    ...restored,
    state: result.state,
    history: [...restored.history, result.state],
    crisis: result.crisis,
    lastResult: result,
  };

  assert.deepEqual(Object.keys(persisted).sort(), Object.keys(legacyRun).sort());
  assert.equal(parseSavedRun(JSON.stringify(persisted))?.state.quarter, 1);
  assert.deepEqual(
    { gini: result.state.gini, poverty: result.state.poverty },
    deriveDistributionMetrics(result.state.quintiles),
  );
});
