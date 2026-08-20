import assert from "node:assert/strict";
import test from "node:test";
import {
  POLICY_HINTS,
  SCORE_BENCHMARKS,
  TUTORIAL_STEPS,
  TUTORIAL_STORAGE_KEY,
} from "./tutorial-content.ts";

test("the guide provides the five decision-level tutorial steps in command order", () => {
  assert.equal(TUTORIAL_STORAGE_KEY, "nations-in-balance-tutorial-v1");
  assert.deepEqual(
    TUTORIAL_STEPS.map((step) => step.id),
    ["mandate", "treasury", "society", "intelligence", "winning"],
  );
  assert.deepEqual(
    TUTORIAL_STEPS.map((step) => step.tab),
    ["command", "treasury", "society", "intelligence", "command"],
  );

  for (const step of TUTORIAL_STEPS) {
    assert.match(step.eyebrow, /^Step [1-5] of 5/);
    assert.ok(step.title.length > 0);
    assert.ok(step.summary.length > 0);
    assert.ok(step.bullets.length >= 3);
  }
});

test("the guide explains term goals, validation, resolution, and terminal risks", () => {
  const copy = TUTORIAL_STEPS.flatMap((step) => [step.title, step.summary, ...step.bullets]).join(" ");

  for (const phrase of [
    "40 quarters",
    "Prosperity, Inclusion, Development, and Stability",
    "forecastable external shocks",
    "End Quarter remains disabled",
    "briefing",
    "4% inflation",
    "6% unemployment",
    "55% debt-to-GDP",
    "105% of GDP",
    "unrest reaches 75",
    "inflation above 50%",
    "unrest above 85 for three quarters",
    "zero score",
  ]) {
    assert.ok(copy.includes(phrase), `expected tutorial copy to include: ${phrase}`);
  }
});

test("the guide presents the calibrated model as a lagged teaching model", () => {
  const copy = TUTORIAL_STEPS.flatMap((step) => [step.title, step.summary, ...step.bullets]).join(" ");

  for (const phrase of [
    "one-off price effect",
    "bounded investment and capital-flow incentive",
    "activity and employment effects arrive with a short lag",
    "annualised fiscal balance",
    "Only one quarter of that annual flow enters debt",
    "Poverty pressure is a modelled income-gap indicator",
    "transparent teaching model, not a national forecast",
  ]) {
    assert.ok(copy.includes(phrase), `expected tutorial copy to include: ${phrase}`);
  }
});

test("persistent hints cover every policy control and the allocation validation rule", () => {
  assert.deepEqual(Object.keys(POLICY_HINTS).sort(), [
    "allocationTotal",
    "corporateRate",
    "education",
    "health",
    "incomeTaxes",
    "infrastructure",
    "moneyGrowth",
    "policyRate",
    "spendingGDP",
    "transfers",
    "validation",
    "vatRate",
  ]);

  for (const hint of Object.values(POLICY_HINTS)) {
    assert.ok(hint.label.length > 0);
    assert.ok(hint.text.length > 0);
  }
  assert.match(POLICY_HINTS.allocationTotal.text, /exactly 100%/);
  assert.match(POLICY_HINTS.incomeTaxes.text, /progressive/);
  assert.match(POLICY_HINTS.validation.text, /valid package/);
  assert.equal(POLICY_HINTS.moneyGrowth.label, "Liquidity-growth directive");
  assert.match(POLICY_HINTS.moneyGrowth.text, /short lag/);
  assert.match(POLICY_HINTS.vatRate.text, /one-off pass-through/);
  assert.match(POLICY_HINTS.corporateRate.text, /bounded/);
  assert.match(POLICY_HINTS.transfers.text, /poverty pressure/);
});

test("score benchmarks state the ordinary tiers and the crisis override", () => {
  assert.deepEqual(
    SCORE_BENCHMARKS.map(({ id, score, label }) => ({ id, score, label })),
    [
      { id: "transformative", score: "85+", label: "Transformative" },
      { id: "successful", score: "70–84", label: "Successful" },
      { id: "unfinished", score: "Below 70", label: "Unfinished" },
      { id: "crisis", score: "0", label: "Crisis government" },
    ],
  );
  assert.match(SCORE_BENCHMARKS[3].detail, /terminal crisis/);
});
