/**
 * Presentation-only guidance for the Nations in Balance command centre.
 * This module intentionally has no dependency on game state or calculations:
 * its copy explains the existing simulation without changing it.
 */

export type TutorialTab = "command" | "treasury" | "society" | "intelligence";

export type TutorialStep = {
  id: "mandate" | "treasury" | "society" | "intelligence" | "winning";
  eyebrow: string;
  title: string;
  summary: string;
  bullets: readonly string[];
  tab: TutorialTab;
};

export type PolicyHintId =
  | "incomeTaxes"
  | "vatRate"
  | "corporateRate"
  | "policyRate"
  | "moneyGrowth"
  | "spendingGDP"
  | "health"
  | "education"
  | "infrastructure"
  | "transfers"
  | "allocationTotal"
  | "validation";

export type PolicyHint = {
  label: string;
  text: string;
};

export type ScoreBenchmark = {
  id: "transformative" | "successful" | "unfinished" | "crisis";
  score: string;
  label: string;
  detail: string;
};

/** Browser-only preference; saved campaigns continue to use their v1 run key. */
export const TUTORIAL_STORAGE_KEY = "nations-in-balance-tutorial-v1";

export const TUTORIAL_STEPS: readonly TutorialStep[] = [
  {
    id: "mandate",
    eyebrow: "Step 1 of 5 · Your mandate",
    title: "Steer one nation through forty quarters.",
    summary: "Choose a scenario, read its mandate, and make one fiscal and monetary package each quarter.",
    bullets: [
      "The term lasts 40 quarters unless a crisis ends it early.",
      "Every scenario uses the same balanced scorecard: Prosperity, Inclusion, Development, and Stability are worth 25 points each.",
      "Use the command view to keep the national mandate, current conditions, and cabinet advice in view.",
    ],
    tab: "command",
  },
  {
    id: "treasury",
    eyebrow: "Step 2 of 5 · Treasury",
    title: "Set revenue and the monetary stance together.",
    summary: "Treasury choices trade fiscal room and liquidity against household demand, investment, growth, inflation, and debt over time.",
    bullets: [
      "Keep the five income-tax bands progressive from lower to higher income while raising sustainable revenue. Tax and transfer changes adjust household disposable income when policy changes; holding a setting steady does not repeatedly levy the same change.",
      "VAT strengthens revenue but bears most heavily on household consumption; a VAT-rate change can add a one-off price effect. Corporate tax trades revenue against a bounded investment and capital-flow incentive.",
      "The central-bank rate and liquidity-growth directive can affect financial conditions and inflation this quarter, but their main activity and employment effects arrive with a short lag.",
      "Revenue, primary spending, and interest form the annualised fiscal balance. Only one quarter of that annual flow enters debt before nominal growth changes the debt-to-GDP ratio.",
    ],
    tab: "treasury",
  },
  {
    id: "society",
    eyebrow: "Step 3 of 5 · Society",
    title: "Choose the size and purpose of public spending.",
    summary: "Set primary expenditure as a share of GDP, then divide the entire budget between four ministries.",
    bullets: [
      "Health and education strengthen service capacity, employment resilience, and human development gradually; they are not direct cash income.",
      "Infrastructure builds productive capacity over time; transfers are the direct cash-distribution channel for lower-income households and social resilience.",
      "Poverty pressure is a modelled income-gap indicator, not a survey headcount or a count of people. Read it alongside quintile incomes, inequality, prices, and employment.",
      "Health, education, infrastructure, and transfers must add to exactly 100% before End Quarter is available.",
    ],
    tab: "society",
  },
  {
    id: "intelligence",
    eyebrow: "Step 4 of 5 · Intelligence",
    title: "Read the evidence before resolving the quarter.",
    summary: "The Intelligence view connects household outcomes, confidence, liquidity, debt, and external risk signals to your next decision.",
    bullets: [
      "A risk watch flags forecastable external shocks; not every event can be anticipated.",
      "Treat the dashboard as a transparent teaching model, not a national forecast. Watch trends across quarters before concluding that a policy has worked.",
      "End Quarter remains disabled until every policy limit, progressive tax band, and 100% allocation rule is valid.",
      "When you resolve a valid package, the national briefing records the event, indicator changes, and advisor advice. It never advances another turn automatically.",
    ],
    tab: "intelligence",
  },
  {
    id: "winning",
    eyebrow: "Step 5 of 5 · Winning the mandate",
    title: "Leave the country stronger in every direction.",
    summary: "The final report rewards broad progress, not a single headline number. Finish the term while protecting stability.",
    bullets: [
      "Aim for durable growth, lower inequality and poverty, higher human development, and stability near 4% inflation, 6% unemployment, and 55% debt-to-GDP.",
      "When debt reaches 105% of GDP or unrest reaches 75, emergency conditions constrain how far policy can move in one quarter.",
      "Sustained inflation above 50%, extreme sovereign funding stress, or unrest above 85 for three quarters can end the mandate and produce a zero score.",
    ],
    tab: "command",
  },
];

export const POLICY_HINTS: Readonly<Record<PolicyHintId, PolicyHint>> = {
  incomeTaxes: {
    label: "Progressive income tax",
    text: "A progressive schedule raises revenue and can improve inclusion, but each band must remain at least as high as the one below it. Household effects reflect changes from the previous package, not a repeated charge on prior income.",
  },
  vatRate: {
    label: "VAT / consumption tax",
    text: "VAT adds broad revenue, but higher rates reduce household demand and weigh most on lower-income consumers. A rate change also has a one-off pass-through to prices; keeping the rate unchanged does not repeat that shock.",
  },
  corporateRate: {
    label: "Corporate income tax",
    text: "Corporate tax funds the state; a lighter rate can support investment and capital flows within a bounded effect, but leaves less revenue for public commitments.",
  },
  policyRate: {
    label: "Central-bank rate",
    text: "Higher rates can cool inflation and exchange pressure promptly. Their main growth and employment cost arrives with a short lag, so judge the stance over more than one quarter.",
  },
  moneyGrowth: {
    label: "Liquidity-growth directive",
    text: "Set the desired pace of liquidity growth relative to nominal activity. Rapid growth can add price pressure, while restraint can slow demand after a short lag; money demand evolves gradually with nominal activity and interest-rate changes.",
  },
  spendingGDP: {
    label: "Primary public expenditure",
    text: "More primary spending can protect households and build capacity, but annualised spending plus interest minus revenue is the fiscal balance. Deficits add to debt quarter by quarter and must be credible to lenders.",
  },
  health: {
    label: "Health",
    text: "Health spending improves service resilience and contributes gradually to human development; stronger health capacity can cushion an existing public-health shock.",
  },
  education: {
    label: "Education",
    text: "Education strengthens long-term opportunity, employment resilience, and human development rather than producing an instant cash or headline gain.",
  },
  infrastructure: {
    label: "Infrastructure",
    text: "Infrastructure raises productive capacity gradually and supports durable growth; existing investment shocks can add a modest persistent capacity benefit.",
  },
  transfers: {
    label: "Transfers",
    text: "Transfers are the direct cash-distribution channel: changing them most directly supports lower-income households, reduces poverty pressure and inequality, and helps contain social pressure.",
  },
  allocationTotal: {
    label: "Allocation total",
    text: "All four ministry shares must total exactly 100%; shifting one share means reducing another.",
  },
  validation: {
    label: "Before End Quarter",
    text: "The cabinet can resolve only a valid package: tax bands must stay progressive and every policy control must remain within its shown range.",
  },
};

export const SCORE_BENCHMARKS: readonly ScoreBenchmark[] = [
  {
    id: "transformative",
    score: "85+",
    label: "Transformative",
    detail: "Shared prosperity, credible stability, and durable development across the full term.",
  },
  {
    id: "successful",
    score: "70–84",
    label: "Successful",
    detail: "A balanced mandate that delivers broad progress.",
  },
  {
    id: "unfinished",
    score: "Below 70",
    label: "Unfinished",
    detail: "The term survived, but the balance of outcomes was not yet strong enough.",
  },
  {
    id: "crisis",
    score: "0",
    label: "Crisis government",
    detail: "A terminal crisis ends the mandate and overrides the ordinary score.",
  },
];
