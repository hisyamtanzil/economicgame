import type { EconomicState, QuarterResult } from "./game";

// This name is intentionally retained across the Nations in Balance rebrand.
// Existing browser saves from Commonwealth Policy Lab must continue to load.
export const RUN_STORAGE_KEY = "commonwealth-policy-lab-run-v1";

export type SavedRun = {
  scenarioId: string;
  seed: number;
  baseline: EconomicState;
  state: EconomicState;
  history: EconomicState[];
  crisis: string | null;
  lastResult: QuarterResult | null;
};

function isEconomicState(value: unknown): value is EconomicState {
  return Boolean(
    value
      && typeof value === "object"
      && typeof (value as Partial<EconomicState>).quarter === "number",
  );
}

// Restores the persisted v1 run shape without coupling presentation changes to
// saved-game compatibility. Invalid or incomplete values are safely ignored.
export function parseSavedRun(serialized: string | null): SavedRun | null {
  if (!serialized) return null;

  try {
    const candidate = JSON.parse(serialized) as Partial<SavedRun>;
    if (
      typeof candidate.scenarioId !== "string"
      || typeof candidate.seed !== "number"
      || !isEconomicState(candidate.baseline)
      || !isEconomicState(candidate.state)
      || !Array.isArray(candidate.history)
      || !candidate.history.every(isEconomicState)
    ) {
      return null;
    }

    return {
      scenarioId: candidate.scenarioId,
      seed: candidate.seed,
      baseline: candidate.baseline,
      state: candidate.state,
      history: candidate.history,
      crisis: candidate.crisis ?? null,
      lastResult: candidate.lastResult ?? null,
    };
  } catch {
    return null;
  }
}
