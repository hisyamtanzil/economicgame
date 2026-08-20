import assert from "node:assert/strict";
import test from "node:test";
import { createInitialState, getScenario } from "./game.ts";
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
