"use client";

import { useEffect, useMemo, useState } from "react";
import {
  advanceQuarter,
  buildEndgameReport,
  createInitialState,
  getRiskSignal,
  getScenario,
  policyForScenario,
  SCENARIOS,
  type EconomicState,
  type PolicyPackage,
  type QuarterResult,
  validatePolicy,
} from "./game";

type Run = {
  scenarioId: string;
  seed: number;
  baseline: EconomicState;
  state: EconomicState;
  history: EconomicState[];
  crisis: string | null;
  lastResult: QuarterResult | null;
};

const STORAGE_KEY = "commonwealth-policy-lab-run-v1";
const taxLabels = ["Entry income", "Basic income", "Skilled income", "Professional income", "High wealth"];
const percent = (value: number, digits = 1) => `${value.toFixed(digits)}%`;
const signed = (value: number, digits = 1) => `${value >= 0 ? "+" : ""}${value.toFixed(digits)}`;

function RangeControl({ label, value, min, max, step = 1, hint, onChange }: { label: string; value: number; min: number; max: number; step?: number; hint?: string; onChange: (value: number) => void }) {
  return <label className="range-control">
    <span className="range-title"><span>{label}</span><output>{value}%</output></span>
    <input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    {hint ? <small>{hint}</small> : null}
  </label>;
}

function StatCard({ label, value, note, tone = "neutral" }: { label: string; value: string; note: string; tone?: "neutral" | "good" | "warn" | "bad" }) {
  return <article className={`stat-card ${tone}`}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;
}

function MiniBars({ values, color = "mint" }: { values: number[]; color?: "mint" | "amber" | "coral" }) {
  const trimmed = values.slice(-16);
  const min = Math.min(...trimmed);
  const max = Math.max(...trimmed);
  const spread = Math.max(0.1, max - min);
  return <div className={`mini-bars ${color}`} aria-label="Recent indicator trend">{trimmed.map((value, index) => <span key={`${index}-${value}`} style={{ height: `${18 + ((value - min) / spread) * 82}%` }} />)}</div>;
}

function progressTone(value: number, dangerAt: number) {
  return value >= dangerAt ? "danger" : value >= dangerAt * 0.7 ? "warn" : "safe";
}

export default function Home() {
  const [run, setRun] = useState<Run | null>(null);
  const [policy, setPolicy] = useState<PolicyPackage | null>(null);
  const [copied, setCopied] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const restored = JSON.parse(saved) as Run;
        if (restored?.state?.quarter !== undefined && getScenario(restored.scenarioId)) {
          setRun(restored);
          setPolicy(restored.state.lastPolicy);
        }
      } catch { window.localStorage.removeItem(STORAGE_KEY); }
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (run) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(run));
  }, [run]);

  const scenario = run ? getScenario(run.scenarioId) : null;
  const state = run?.state ?? null;
  const validationErrors = useMemo(() => policy ? validatePolicy(policy) : [], [policy]);
  const previousState = run && run.history.length > 1 ? run.history[run.history.length - 2] : null;
  const isComplete = Boolean(run && (run.crisis || run.state.quarter >= 40));

  function startScenario(scenarioId: string) {
    const selected = getScenario(scenarioId);
    const initial = createInitialState(selected);
    setRun({ scenarioId: selected.id, seed: selected.seed, baseline: initial, state: initial, history: [initial], crisis: null, lastResult: null });
    setPolicy(policyForScenario(selected));
  }

  function reset() {
    window.localStorage.removeItem(STORAGE_KEY);
    setRun(null);
    setPolicy(null);
  }

  function resolveQuarter() {
    if (!run || !policy || validationErrors.length) return;
    const result = advanceQuarter(run.state, policy, run.seed);
    setRun({ ...run, state: result.state, history: [...run.history, result.state], crisis: result.crisis, lastResult: result });
    setPolicy(result.effectivePolicy);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function copyCode() {
    if (!run) return;
    const code = `${run.scenarioId.toUpperCase()}-${run.seed}-${run.state.quarter}`;
    navigator.clipboard?.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function updatePolicy(updater: (current: PolicyPackage) => PolicyPackage) {
    setPolicy((current) => current ? updater(current) : current);
  }

  if (!loaded) return <main className="loading-screen"><span className="pulse" /> Opening your policy desk…</main>;

  if (!run || !state || !policy || !scenario) {
    return <main className="landing">
      <section className="landing-intro">
        <div className="brand"><span className="brand-seal">∑</span><span>Commonwealth <b>Policy Lab</b></span></div>
        <p className="eyebrow"><span className="pulse" /> University policy simulation</p>
        <h1>Every number<br />has a <em>human cost.</em></h1>
        <p className="landing-copy">You have forty quarters to govern a fictional emerging economy. Set the tax code, fund public goods, steer monetary policy, and live with the consequences.</p>
        <div className="rule-chips"><span>40 quarterly turns</span><span>Seeded shocks</span><span>Local save</span></div>
        <p className="landing-note">Your score weighs inclusive prosperity, equality, human development, and macroeconomic stability. A crisis can end the mandate early.</p>
      </section>
      <section className="scenario-select" aria-labelledby="scenario-heading">
        <div className="select-header"><div><p className="eyebrow">Start a mandate</p><h2 id="scenario-heading">Choose your country</h2></div><span className="round-count">3 scenarios</span></div>
        <div className="scenario-list">
          {SCENARIOS.map((entry, index) => <article className={`scenario-card card-${index}`} key={entry.id}>
            <div className="scenario-number">0{index + 1}</div>
            <div><p className="card-kicker">{entry.subtitle}</p><h3>{entry.name}</h3><p>{entry.mandate}</p></div>
            <div className="scenario-baseline"><span>GDP <b>{percent(entry.starting.annualGrowth)}</b></span><span>Gini <b>{entry.starting.gini.toFixed(2)}</b></span><span>HDI <b>{entry.starting.hdi.toFixed(3)}</b></span></div>
            <button onClick={() => startScenario(entry.id)} type="button">Accept mandate <span aria-hidden="true">→</span></button>
          </article>)}
        </div>
        <p className="fiction-note">All countries and figures are fictional. This model teaches trade-offs; it is not a forecasting tool.</p>
      </section>
    </main>;
  }

  if (isComplete) {
    const report = buildEndgameReport(state, run.baseline, run.crisis);
    const growth = ((state.realGDP / run.baseline.realGDP) - 1) * 100;
    return <main className="report-page">
      <header className="report-header"><button type="button" className="quiet-button" onClick={reset}>← New mandate</button><div className="brand"><span className="brand-seal">∑</span> Commonwealth <b>Policy Lab</b></div><span>Final report · {scenario.shortName}</span></header>
      <section className="report-hero">
        <p className="eyebrow">{run.crisis ? "Mandate terminated" : "Forty quarters complete"}</p>
        <div className="score-orbit"><strong>{report.total}</strong><span>/100</span></div>
        <h1>{report.tier}</h1><p>{report.summary}</p>
      </section>
      <section className="score-grid" aria-label="Final score breakdown">
        <StatCard label="Inclusive prosperity" value={`${report.scores.prosperity}/25`} note={`${signed(growth)}% real GDP`} tone={report.scores.prosperity >= 18 ? "good" : "warn"} />
        <StatCard label="Equality & poverty" value={`${report.scores.inclusion}/25`} note={`${signed(run.baseline.gini - state.gini, 3)} Gini change`} tone={report.scores.inclusion >= 18 ? "good" : "warn"} />
        <StatCard label="Human development" value={`${report.scores.development}/25`} note={`${signed(state.hdi - run.baseline.hdi, 3)} HDI change`} tone={report.scores.development >= 18 ? "good" : "warn"} />
        <StatCard label="Macroeconomic stability" value={`${report.scores.stability}/25`} note={`${percent(state.inflation)} inflation · ${percent(state.debtGDP)} debt`} tone={report.scores.stability >= 18 ? "good" : "warn"} />
      </section>
      <section className="report-summary">
        <article><p className="eyebrow">Final indicators</p><div className="final-indicators"><span>GDP / capita <b>{signed(growth)}%</b></span><span>Inflation <b>{percent(state.inflation)}</b></span><span>Joblessness <b>{percent(state.unemployment)}</b></span><span>Gini <b>{state.gini.toFixed(3)}</b></span><span>HDI <b>{state.hdi.toFixed(3)}</b></span><span>Debt / GDP <b>{percent(state.debtGDP)}</b></span></div></article>
        <article className="causal-card"><p className="eyebrow">What the model saw</p><p>{state.gini < run.baseline.gini ? "Redistributive policy and public services narrowed the income gap. " : "The income gap remained a central constraint on shared prosperity. "}{state.hdi > run.baseline.hdi ? "Health, education, and income capacity strengthened human development." : "Development investment did not compound fast enough to lift human development."}</p><button type="button" className="primary-action" onClick={reset}>Try another mandate <span aria-hidden="true">→</span></button></article>
      </section>
    </main>;
  }

  const risk = getRiskSignal(run.seed, state.quarter);
  const debtTone = state.debtGDP > 85 ? "bad" : state.debtGDP > 65 ? "warn" : "neutral";
  const inflationTone = state.inflation > 10 ? "bad" : state.inflation > 6 ? "warn" : "good";
  const giniTone = state.gini > 0.5 ? "bad" : state.gini > 0.44 ? "warn" : "good";
  const history = run.history;
  const shareCode = `${run.scenarioId.toUpperCase()}-${run.seed}-${state.quarter}`;

  return <main className="desk">
    <header className="desk-header">
      <div className="brand"><span className="brand-seal">∑</span><span>Commonwealth <b>Policy Lab</b></span></div>
      <div className="turn-marker"><span>Mandate</span><b>Q{state.quarter + 1} / 40</b><div className="turn-track"><i style={{ width: `${state.quarter / 40 * 100}%` }} /></div></div>
      <div className="header-actions"><button type="button" className="code-button" onClick={copyCode}>{copied ? "Code copied" : shareCode}</button><button type="button" className="quiet-button" onClick={reset}>Exit</button></div>
    </header>
    <section className="country-banner">
      <div><p className="eyebrow"><span className="pulse" /> National policy desk</p><h1>{scenario.name}</h1><p>{scenario.mandate}</p></div>
      <div className="risk-signal"><span>Next-quarter signal</span><strong>{risk}</strong></div>
    </section>

    {run.lastResult ? <section className="turn-result" aria-live="polite">
      <div className="result-label"><span className="result-dot" /> Q{state.quarter} resolved</div>
      <div className="result-main"><h2>{run.lastResult.event?.title ?? "Domestic conditions update"}</h2><p>{run.lastResult.event?.description ?? "No major external shock arrived this quarter. Your fiscal and monetary choices now set the direction."}</p></div>
      <div className="advisor-lines">{run.lastResult.advisor.slice(1).map((line) => <p key={line}>↳ {line}</p>)}</div>
    </section> : null}

    <section className="stat-strip" aria-label="Core economic indicators">
      <StatCard label="Real GDP growth" value={percent(state.annualGrowth)} note={previousState ? `${signed(state.annualGrowth - previousState.annualGrowth)} pts since last quarter` : "Annualised"} tone={state.annualGrowth >= 2 ? "good" : "warn"} />
      <StatCard label="Inflation" value={percent(state.inflation)} note="Target band: 3–6%" tone={inflationTone} />
      <StatCard label="Unemployment" value={percent(state.unemployment)} note="Share of labour force" tone={state.unemployment > 11 ? "bad" : state.unemployment > 8 ? "warn" : "good"} />
      <StatCard label="Inequality" value={state.gini.toFixed(3)} note="Gini coefficient" tone={giniTone} />
      <StatCard label="Human development" value={state.hdi.toFixed(3)} note={`Health ${state.healthIndex.toFixed(2)} · Education ${state.educationIndex.toFixed(2)}`} tone="good" />
      <StatCard label="Public debt" value={percent(state.debtGDP)} note={`${state.creditRating} credit outlook`} tone={debtTone} />
    </section>

    <section className="play-grid">
      <section className="policy-panel" aria-labelledby="policy-heading">
        <div className="panel-heading"><div><p className="eyebrow">Quarter {state.quarter + 1} decision</p><h2 id="policy-heading">Set your policy package</h2></div><span className={state.unrest >= 75 || state.debtGDP >= 105 ? "constraint-badge active" : "constraint-badge"}>{state.unrest >= 75 || state.debtGDP >= 105 ? "Emergency constraint" : "Full policy room"}</span></div>
        <div className="policy-section">
          <div className="section-title"><div><h3>Fiscal policy</h3><p>Revenue funds public capacity; tax incidence changes household and business incentives.</p></div><span>Rates</span></div>
          <div className="tax-grid">{policy.incomeTaxes.map((rate, index) => <RangeControl key={taxLabels[index]} label={taxLabels[index]} value={rate} min={0} max={55} onChange={(value) => updatePolicy((current) => { const next = [...current.incomeTaxes] as PolicyPackage["incomeTaxes"]; next[index] = value; return { ...current, incomeTaxes: next }; })} />)}</div>
          <div className="double-control"><RangeControl label="VAT / consumption tax" value={policy.vatRate} min={0} max={25} onChange={(value) => updatePolicy((current) => ({ ...current, vatRate: value }))} /><RangeControl label="Corporate income tax" value={policy.corporateRate} min={0} max={40} onChange={(value) => updatePolicy((current) => ({ ...current, corporateRate: value }))} /></div>
        </div>
        <div className="policy-section">
          <div className="section-title"><div><h3>Public budget</h3><p>Set total primary expenditure, then direct every available currency unit.</p></div><span>{policy.spendingGDP}% GDP</span></div>
          <RangeControl label="Primary public expenditure" value={policy.spendingGDP} min={10} max={35} onChange={(value) => updatePolicy((current) => ({ ...current, spendingGDP: value }))} />
          <div className="allocation-grid">{(["health", "education", "infrastructure", "transfers"] as const).map((key) => <RangeControl key={key} label={key === "infrastructure" ? "Infrastructure" : key[0].toUpperCase() + key.slice(1)} value={policy.allocations[key]} min={0} max={100} onChange={(value) => updatePolicy((current) => ({ ...current, allocations: { ...current.allocations, [key]: value } }))} />)}</div>
          <div className={`allocation-total ${Math.abs(Object.values(policy.allocations).reduce((sum, value) => sum + value, 0) - 100) < 0.001 ? "valid" : "invalid"}`}><span>Allocation total</span><b>{Object.values(policy.allocations).reduce((sum, value) => sum + value, 0)}%</b><small>Must equal 100%</small></div>
        </div>
        <div className="policy-section monetary-section">
          <div className="section-title"><div><h3>Monetary policy</h3><p>Rate changes act with a lag; money demand follows income, confidence, inflation expectations, and rates.</p></div><span>Central bank</span></div>
          <div className="double-control"><RangeControl label="Central-bank rate" value={policy.policyRate} min={0} max={25} onChange={(value) => updatePolicy((current) => ({ ...current, policyRate: value }))} /><RangeControl label="Broad-money growth target" value={policy.moneyGrowth} min={-5} max={30} onChange={(value) => updatePolicy((current) => ({ ...current, moneyGrowth: value }))} /></div>
        </div>
        {validationErrors.length ? <div className="validation-box" role="alert"><b>Policy package needs attention</b>{validationErrors.map((error) => <span key={error}>{error}</span>)}</div> : <div className="ready-box"><span>✓</span> Budget and policy limits are valid.</div>}
        <button className="resolve-button" type="button" disabled={validationErrors.length > 0} onClick={resolveQuarter}><span>Submit policy package</span><b>Resolve quarter →</b></button>
      </section>

      <aside className="intelligence-panel" aria-label="Economic intelligence">
        <section className="intelligence-card score-card"><p className="eyebrow">Mandate outlook</p><div className="score-row"><strong>{Math.max(0, Math.round(((state.realGDP / run.baseline.realGDP - 1) * 100 + 3) / 21 * 25 + (run.baseline.gini - state.gini) * 300 + (run.baseline.poverty - state.poverty) * 1.05 + (state.hdi - run.baseline.hdi) * 625))}</strong><span>provisional<br />progress</span></div><p>Final scoring rewards inclusive prosperity, equality, human development, and stability equally.</p></section>
        <section className="intelligence-card">
          <div className="card-title"><h3>Money & liquidity</h3><span>{state.moneySupply > state.moneyDemand ? "Excess supply" : "Tight supply"}</span></div>
          <div className="liquidity-bars"><div><span>Money supply</span><b>{state.moneySupply.toFixed(1)}</b><i><em style={{ width: `${clampForBar(state.moneySupply)}%` }} /></i></div><div><span>Money demand</span><b>{state.moneyDemand.toFixed(1)}</b><i><em className="demand" style={{ width: `${clampForBar(state.moneyDemand)}%` }} /></i></div></div>
          <p className="small-copy">Policy rate: <b>{percent(state.policyRate)}</b> · Exchange pressure: <b>{state.exchangePressure.toFixed(1)}</b> · Capital flow: <b>{signed(state.capitalFlow)}</b></p>
        </section>
        <section className="intelligence-card">
          <div className="card-title"><h3>Social pressure</h3><span className={progressTone(state.unrest, 85)}>{state.unrest.toFixed(0)} / 100</span></div>
          <div className="pressure-track"><i className={progressTone(state.unrest, 85)} style={{ width: `${state.unrest}%` }} /></div>
          <p className="small-copy">Confidence <b>{state.confidence.toFixed(0)}</b> / 100 · Poverty <b>{percent(state.poverty)}</b> · A sustained reading above 85 ends the mandate.</p>
        </section>
        <section className="intelligence-card distribution-card">
          <div className="card-title"><h3>Income by quintile</h3><span>After tax & transfers</span></div>
          <div className="quintile-bars">{state.quintiles.map((item) => <div key={item.label}><span>{item.label.replace(" 20%", "")}</span><i><em style={{ width: `${Math.min(100, item.income / state.quintiles[4].income * 100)}%` }} /></i><b>{item.income.toFixed(0)}</b></div>)}</div>
        </section>
        <section className="intelligence-card trend-card">
          <div className="card-title"><h3>Economic trajectory</h3><span>Last 16 quarters</span></div>
          <div className="trend-row"><div><span>GDP growth</span><MiniBars values={history.map((item) => item.annualGrowth)} /></div><div><span>Debt / GDP</span><MiniBars values={history.map((item) => item.debtGDP)} color="amber" /></div></div>
        </section>
      </aside>
    </section>
  </main>;
}

function clampForBar(value: number) { return Math.max(4, Math.min(100, value)); }
