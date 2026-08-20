"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
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
  validatePolicy,
} from "./game";
import { ADVISORS, getCampaignProfile } from "./campaign-content";
import { parseSavedRun, RUN_STORAGE_KEY, type SavedRun as Run } from "./run-storage";

type CommandTab = "command" | "treasury" | "society" | "intelligence";

const taxLabels = ["Entry income", "Basic income", "Skilled income", "Professional income", "High wealth"];
const tabLabels: Record<CommandTab, string> = {
  command: "Command",
  treasury: "Treasury",
  society: "Society",
  intelligence: "Intelligence",
};
const accentValues: Record<string, string> = {
  aqua: "#66d4cc",
  amber: "#d9af6a",
  coral: "#d67c70",
};

const percent = (value: number, digits = 1) => `${value.toFixed(digits)}%`;
const signed = (value: number, digits = 1) => `${value >= 0 ? "+" : ""}${value.toFixed(digits)}`;

function campaignStyle(accent: string): CSSProperties {
  return { "--scenario-accent": accentValues[accent] ?? accentValues.aqua } as CSSProperties;
}

function toneFor(value: number, warning: number, danger: number, inverse = false) {
  if (inverse) return value >= danger ? "critical" : value >= warning ? "caution" : "positive";
  return value <= danger ? "critical" : value <= warning ? "caution" : "positive";
}

function RangeControl({
  label,
  value,
  min,
  max,
  step = 1,
  hint,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  hint?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="range-control">
      <span className="range-title">
        <span>{label}</span>
        <output>{value}%</output>
      </span>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

function MetricCard({
  label,
  value,
  note,
  tone = "neutral",
}: {
  label: string;
  value: string;
  note: string;
  tone?: "neutral" | "positive" | "caution" | "critical";
}) {
  return (
    <article className={`metric-card ${tone}`}>
      <span className="metric-label">{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function SignalBar({
  label,
  value,
  max = 100,
  detail,
  tone = "cyan",
}: {
  label: string;
  value: number;
  max?: number;
  detail: string;
  tone?: "cyan" | "gold" | "red";
}) {
  return (
    <div className="signal-bar">
      <div className="signal-line">
        <span>{label}</span>
        <b>{detail}</b>
      </div>
      <div className={`signal-track ${tone}`} aria-label={`${label}: ${detail}`}>
        <i style={{ width: `${Math.max(3, Math.min(100, (value / max) * 100))}%` }} />
      </div>
    </div>
  );
}

function TrendBars({ values, color = "cyan" }: { values: number[]; color?: "cyan" | "gold" | "red" }) {
  const trimmed = values.slice(-16);
  const min = Math.min(...trimmed);
  const max = Math.max(...trimmed);
  const spread = Math.max(0.1, max - min);
  return (
    <div className={`trend-bars ${color}`} aria-label="Recent indicator trend">
      {trimmed.map((value, index) => (
        <span key={`${index}-${value}`} style={{ height: `${18 + ((value - min) / spread) * 82}%` }} />
      ))}
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  copy,
  action,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{copy}</p>
      </div>
      {action}
    </div>
  );
}

function CabinetPortrait({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  const image = <img src={src} alt={alt} />;
  return (
    <div className={`portrait-frame ${className}`}>
      {image}
    </div>
  );
}

function scenarioAdvice(state: EconomicState, risk: string) {
  return [
    `Revenue is ${percent(state.revenueGDP)} of GDP against a ${percent(state.deficitGDP)} fiscal balance. Keep the mandate’s spending commitments credible.`,
    `Human development is ${state.hdi.toFixed(3)}. Service capacity now compounds through health, education, and infrastructure choices.`,
    risk.replace("Risk watch: ", "External outlook: "),
  ];
}

export default function Home() {
  const [run, setRun] = useState<Run | null>(null);
  const [policy, setPolicy] = useState<PolicyPackage | null>(null);
  const [activeTab, setActiveTab] = useState<CommandTab>("command");
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const briefingCloseRef = useRef<HTMLButtonElement>(null);
  const endTurnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let cancelled = false;
    const saved = window.localStorage.getItem(RUN_STORAGE_KEY);
    const restored = parseSavedRun(saved);
    const restoredRun = restored && getScenario(restored.scenarioId) ? restored : null;
    const restoreTimer = window.setTimeout(() => {
      if (cancelled) return;
      if (restoredRun) {
        setRun(restoredRun);
        setPolicy(restoredRun.state.lastPolicy);
      }
      setLoaded(true);
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(restoreTimer);
    };
  }, []);

  useEffect(() => {
    if (run) window.localStorage.setItem(RUN_STORAGE_KEY, JSON.stringify(run));
  }, [run]);

  useEffect(() => {
    if (!briefingOpen) return;
    briefingCloseRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setBriefingOpen(false);
        window.setTimeout(() => endTurnRef.current?.focus(), 0);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [briefingOpen]);

  const scenario = run ? getScenario(run.scenarioId) : null;
  const state = run?.state ?? null;
  const profile = scenario ? getCampaignProfile(scenario.id) : null;
  const validationErrors = useMemo(() => (policy ? validatePolicy(policy) : []), [policy]);
  const previousState = run && run.history.length > 1 ? run.history[run.history.length - 2] : null;
  const isComplete = Boolean(run && (run.crisis || run.state.quarter >= 40));

  function startScenario(scenarioId: string) {
    const selected = getScenario(scenarioId);
    const initial = createInitialState(selected);
    setRun({
      scenarioId: selected.id,
      seed: selected.seed,
      baseline: initial,
      state: initial,
      history: [initial],
      crisis: null,
      lastResult: null,
    });
    setPolicy(policyForScenario(selected));
    setActiveTab("command");
    setBriefingOpen(false);
  }

  function reset() {
    window.localStorage.removeItem(RUN_STORAGE_KEY);
    setRun(null);
    setPolicy(null);
    setActiveTab("command");
    setBriefingOpen(false);
  }

  function resolveQuarter() {
    if (!run || !policy || validationErrors.length) return;
    const result = advanceQuarter(run.state, policy, run.seed);
    setRun({
      ...run,
      state: result.state,
      history: [...run.history, result.state],
      crisis: result.crisis,
      lastResult: result,
    });
    setPolicy(result.effectivePolicy);
    setBriefingOpen(true);
  }

  function closeBriefing() {
    setBriefingOpen(false);
    window.setTimeout(() => endTurnRef.current?.focus(), 0);
  }

  function copyCode() {
    if (!run) return;
    const code = `${run.scenarioId.toUpperCase()}-${run.seed}-${run.state.quarter}`;
    navigator.clipboard?.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function updatePolicy(updater: (current: PolicyPackage) => PolicyPackage) {
    setPolicy((current) => (current ? updater(current) : current));
  }

  if (!loaded) {
    return (
      <main className="boot-screen">
        <span className="boot-mark" aria-hidden="true">N</span>
        <p>Establishing national command link…</p>
      </main>
    );
  }

  if (!run || !state || !policy || !scenario || !profile) {
    return (
      <main className="nib-app landing-page">
        <header className="landing-header">
          <div className="wordmark">
            <span className="wordmark-seal">N</span>
            <span><b>Nations</b> in Balance</span>
          </div>
          <div className="landing-status"><i /> Strategic governance simulation</div>
        </header>

        <section className="landing-hero">
          <div className="hero-copy">
            <p className="eyebrow">A national strategy simulation</p>
            <h1>Every mandate<br />leaves a legacy.</h1>
            <p>Lead a fictional nation through forty quarters of growth, inflation, institutional capacity, and public trust. There are no easy wins—only better balances.</p>
            <div className="hero-points">
              <span><b>40</b> quarterly decisions</span>
              <span><b>3</b> national mandates</span>
              <span><b>1</b> durable legacy</span>
            </div>
          </div>
          <aside className="hero-protocol">
            <p className="eyebrow">Cabinet protocol</p>
            <strong>Evidence before impulse.</strong>
            <p>Your Treasury, Social Development, and Central Bank advisors will keep the trade-offs in view.</p>
            <div className="protocol-rule"><span>01</span> Economic resilience</div>
            <div className="protocol-rule"><span>02</span> Shared prosperity</div>
            <div className="protocol-rule"><span>03</span> Institutional capacity</div>
          </aside>
        </section>

        <section className="mandate-select" aria-labelledby="mandate-heading">
          <div className="landing-section-heading">
            <div>
              <p className="eyebrow">Select a mandate</p>
              <h2 id="mandate-heading">Choose the nation you will serve.</h2>
            </div>
            <p>All countries and figures are fictional. The model teaches trade-offs, not forecasts.</p>
          </div>
          <div className="mandate-grid">
            {SCENARIOS.map((entry) => {
              const campaign = getCampaignProfile(entry.id);
              return (
                <article className="mandate-card" key={entry.id} style={campaignStyle(campaign.accent)}>
                  <div className="mandate-portrait">
                    <CabinetPortrait src={campaign.portrait} alt={`${campaign.leaderName}, ${campaign.leaderTitle}`} />
                    <span>{campaign.leaderTitle}</span>
                  </div>
                  <div className="mandate-copy">
                    <p className="card-kicker">{entry.subtitle}</p>
                    <h3>{entry.name}</h3>
                    <p className="leader-name">{campaign.leaderName}</p>
                    <p>{entry.mandate}</p>
                  </div>
                  <dl className="baseline-stats">
                    <div><dt>Growth</dt><dd>{percent(entry.starting.annualGrowth)}</dd></div>
                    <div><dt>Inflation</dt><dd>{percent(entry.starting.inflation)}</dd></div>
                    <div><dt>Debt</dt><dd>{percent(entry.starting.debtGDP)}</dd></div>
                  </dl>
                  <button type="button" aria-label={`Assume mandate for ${entry.name}`} onClick={() => startScenario(entry.id)}>
                    Assume mandate <span aria-hidden="true">→</span>
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    );
  }

  if (isComplete) {
    const report = buildEndgameReport(state, run.baseline, run.crisis);
    const growth = ((state.realGDP / run.baseline.realGDP) - 1) * 100;
    return (
      <main className="nib-app report-page">
        <header className="report-header">
          <div className="wordmark">
            <span className="wordmark-seal">N</span>
            <span><b>Nations</b> in Balance</span>
          </div>
          <span>Mandate archive · {scenario.shortName}</span>
          <button type="button" className="quiet-button" onClick={reset}>Start a new mandate</button>
        </header>
        <section className="report-hero">
          <div className="report-leader">
            <CabinetPortrait src={profile.portrait} alt={`${profile.leaderName}, ${profile.leaderTitle}`} />
          </div>
          <p className="eyebrow">{run.crisis ? "Mandate terminated" : "Forty quarters concluded"}</p>
          <div className="mandate-score"><strong>{report.total}</strong><span>/100</span></div>
          <h1>{report.tier}</h1>
          <p>{report.summary}</p>
        </section>
        <section className="report-score-grid" aria-label="Final score breakdown">
          <MetricCard label="Prosperity" value={`${report.scores.prosperity}/25`} note={`${signed(growth)}% real GDP`} tone={report.scores.prosperity >= 18 ? "positive" : "caution"} />
          <MetricCard label="Inclusion" value={`${report.scores.inclusion}/25`} note={`${signed(run.baseline.gini - state.gini, 3)} Gini change`} tone={report.scores.inclusion >= 18 ? "positive" : "caution"} />
          <MetricCard label="Development" value={`${report.scores.development}/25`} note={`${signed(state.hdi - run.baseline.hdi, 3)} HDI change`} tone={report.scores.development >= 18 ? "positive" : "caution"} />
          <MetricCard label="Stability" value={`${report.scores.stability}/25`} note={`${percent(state.inflation)} inflation · ${percent(state.debtGDP)} debt`} tone={report.scores.stability >= 18 ? "positive" : "caution"} />
        </section>
        <section className="report-details">
          <article>
            <p className="eyebrow">Final national indicators</p>
            <div className="final-metric-grid">
              <span>GDP / capita <b>{signed(growth)}%</b></span>
              <span>Inflation <b>{percent(state.inflation)}</b></span>
              <span>Joblessness <b>{percent(state.unemployment)}</b></span>
              <span>Inequality <b>{state.gini.toFixed(3)}</b></span>
              <span>Human development <b>{state.hdi.toFixed(3)}</b></span>
              <span>Debt / GDP <b>{percent(state.debtGDP)}</b></span>
            </div>
          </article>
          <article className="legacy-note">
            <p className="eyebrow">Legacy assessment</p>
            <h2>{profile.motto}</h2>
            <p>{state.gini < run.baseline.gini ? "The distribution of national gains became more equitable. " : "The distribution of national gains remained an unresolved task. "}{state.hdi > run.baseline.hdi ? "Public capacity strengthened over the term." : "Public capacity did not compound quickly enough to meet the mandate."}</p>
            <button type="button" className="primary-action" onClick={reset}>Lead another nation <span aria-hidden="true">→</span></button>
          </article>
        </section>
      </main>
    );
  }

  const risk = getRiskSignal(run.seed, state.quarter);
  const history = run.history;
  const shareCode = `${run.scenarioId.toUpperCase()}-${run.seed}-${state.quarter}`;
  const cabinetAdvice = run.lastResult?.advisor.slice(-3) ?? scenarioAdvice(state, risk);
  const policyReady = validationErrors.length === 0;
  const activeTabLabel = tabLabels[activeTab];

  return (
    <main className="nib-app command-page" style={campaignStyle(profile.accent)}>
      <header className="command-ribbon">
        <div className="ribbon-brand">
          <div className="wordmark">
            <span className="wordmark-seal">N</span>
            <span><b>Nations</b> in Balance</span>
          </div>
          <div className="ribbon-country">
            <span className="country-mark">{scenario.shortName.slice(0, 1)}</span>
            <div><small>National command</small><strong>{scenario.shortName}</strong></div>
          </div>
        </div>
        <div className="resource-ribbon" aria-label="National resource indicators">
          <div><span>Growth</span><b className={state.annualGrowth >= 2 ? "positive" : "caution"}>{percent(state.annualGrowth)}</b></div>
          <div><span>Inflation</span><b className={toneFor(state.inflation, 6, 10, true)}>{percent(state.inflation)}</b></div>
          <div><span>Debt</span><b className={toneFor(state.debtGDP, 65, 85, true)}>{percent(state.debtGDP)}</b></div>
          <div><span>Confidence</span><b className={toneFor(state.confidence, 55, 40)}>{state.confidence.toFixed(0)}</b></div>
        </div>
        <div className="ribbon-actions">
          <div className="quarter-marker"><span>Quarter</span><b>{state.quarter + 1} <i>/ 40</i></b></div>
          <button className="code-button" type="button" onClick={copyCode}>{copied ? "Run ID copied" : shareCode}</button>
          <button type="button" className="quiet-button exit-button" onClick={reset}>Exit</button>
          <button ref={endTurnRef} className="end-turn-button" type="button" disabled={!policyReady} onClick={resolveQuarter} aria-describedby="policy-status">
            <span>End quarter</span><b>Resolve →</b>
          </button>
        </div>
      </header>

      <nav className="command-tabs" aria-label="National command sections">
        {(Object.keys(tabLabels) as CommandTab[]).map((tab, index) => (
          <button
            key={tab}
            id={`tab-${tab}`}
            type="button"
            aria-pressed={activeTab === tab}
            aria-controls={`panel-${tab}`}
            onClick={() => setActiveTab(tab)}
          >
            <span className="tab-index">{String(index + 1).padStart(2, "0")}</span>
            {tabLabels[tab]}
          </button>
        ))}
        <div className={`policy-status ${policyReady ? "ready" : "needs-attention"}`} id="policy-status" aria-live="polite">
          <i /> {policyReady ? "Policy package verified" : `${validationErrors.length} policy issue${validationErrors.length === 1 ? "" : "s"} to resolve`}
        </div>
      </nav>

      <div className="command-layout">
        <aside className="leader-dossier">
          <div className="dossier-image">
            <CabinetPortrait src={profile.portrait} alt={`${profile.leaderName}, ${profile.leaderTitle} of ${scenario.name}`} />
            <span className="dossier-seal">{scenario.shortName.slice(0, 1)}</span>
          </div>
          <div className="dossier-copy">
            <p className="eyebrow">{profile.leaderTitle}</p>
            <h1>{profile.leaderName}</h1>
            <strong>{scenario.name}</strong>
            <p>{profile.summary}</p>
          </div>
          <div className="dossier-divider" />
          <p className="eyebrow">Mandate</p>
          <p className="mandate-copy">{scenario.mandate}</p>
          <div className="turn-progress">
            <div><span>Term progress</span><b>{state.quarter} / 40</b></div>
            <i><em style={{ width: `${(state.quarter / 40) * 100}%` }} /></i>
          </div>
          <div className="risk-watch">
            <span className="risk-dot" />
            <div><small>Forecast desk</small><p>{risk}</p></div>
          </div>
        </aside>

        <section className="tab-surface" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
          {activeTab === "command" ? (
            <div className="tab-content">
              <SectionHeading
                eyebrow={`Quarter ${state.quarter + 1} · Command overview`}
                title="Hold the national balance."
                copy="The mandate is measured in shared prosperity, human development, and credible stability—not a single headline number."
                action={<span className="section-badge">{state.creditRating} credit outlook</span>}
              />
              <div className="metric-grid command-metrics">
                <MetricCard label="Real GDP growth" value={percent(state.annualGrowth)} note={previousState ? `${signed(state.annualGrowth - previousState.annualGrowth)} pts since last quarter` : "Annualised"} tone={state.annualGrowth >= 2 ? "positive" : "caution"} />
                <MetricCard label="Price stability" value={percent(state.inflation)} note="Target band: 3–6%" tone={toneFor(state.inflation, 6, 10, true)} />
                <MetricCard label="Employment" value={percent(state.unemployment)} note="Share of labour force" tone={toneFor(state.unemployment, 8, 11, true)} />
                <MetricCard label="Inequality" value={state.gini.toFixed(3)} note="Gini coefficient" tone={toneFor(state.gini, 0.44, 0.5, true)} />
                <MetricCard label="Human development" value={state.hdi.toFixed(3)} note={`Health ${state.healthIndex.toFixed(2)} · Education ${state.educationIndex.toFixed(2)}`} tone="positive" />
                <MetricCard label="Public debt" value={percent(state.debtGDP)} note={`${percent(state.deficitGDP)} fiscal balance`} tone={toneFor(state.debtGDP, 65, 85, true)} />
              </div>
              <div className="command-panels">
                <article className="national-outlook">
                  <p className="eyebrow">National outlook</p>
                  <h3>{profile.motto}</h3>
                  <p>{risk}</p>
                  <div className="outlook-lines">
                    <SignalBar label="Public confidence" value={state.confidence} detail={`${state.confidence.toFixed(0)} / 100`} />
                    <SignalBar label="Social pressure" value={state.unrest} detail={`${state.unrest.toFixed(0)} / 100`} tone={state.unrest >= 75 ? "red" : state.unrest >= 55 ? "gold" : "cyan"} />
                  </div>
                </article>
                <article className="capacity-panel">
                  <p className="eyebrow">Institutional capacity</p>
                  <div className="capacity-grid">
                    <div><span>Health</span><b>{Math.round(state.healthCapacity * 100)}</b><i><em style={{ width: `${state.healthCapacity * 100}%` }} /></i></div>
                    <div><span>Education</span><b>{Math.round(state.educationCapacity * 100)}</b><i><em style={{ width: `${state.educationCapacity * 100}%` }} /></i></div>
                    <div><span>Infrastructure</span><b>{Math.round(state.infrastructureStock * 100)}</b><i><em style={{ width: `${state.infrastructureStock * 100}%` }} /></i></div>
                  </div>
                  <p>Long-term capacity grows gradually. Use this term to decide what kind of nation follows the mandate.</p>
                </article>
              </div>
            </div>
          ) : null}

          {activeTab === "treasury" ? (
            <div className="tab-content">
              <SectionHeading
                eyebrow={`Quarter ${state.quarter + 1} · Treasury`}
                title="Set the fiscal and monetary stance."
                copy="Revenue must fund capability without undermining demand, investment, or confidence."
                action={<span className="section-badge">{percent(policy.spendingGDP)} primary spending</span>}
              />
              <section className="policy-block">
                <div className="policy-block-heading"><div><h3>Income tax code</h3><p>Maintain a progressive schedule while matching the country’s capacity to raise revenue.</p></div><span>Rates</span></div>
                <div className="tax-grid">{policy.incomeTaxes.map((rate, index) => (
                  <RangeControl
                    key={taxLabels[index]}
                    label={taxLabels[index]}
                    value={rate}
                    min={0}
                    max={55}
                    onChange={(value) => updatePolicy((current) => {
                      const next = [...current.incomeTaxes] as PolicyPackage["incomeTaxes"];
                      next[index] = value;
                      return { ...current, incomeTaxes: next };
                    })}
                  />
                ))}</div>
                <div className="double-control">
                  <RangeControl label="VAT / consumption tax" value={policy.vatRate} min={0} max={25} onChange={(value) => updatePolicy((current) => ({ ...current, vatRate: value }))} />
                  <RangeControl label="Corporate income tax" value={policy.corporateRate} min={0} max={40} onChange={(value) => updatePolicy((current) => ({ ...current, corporateRate: value }))} />
                </div>
              </section>
              <section className="policy-block monetary-block">
                <div className="policy-block-heading"><div><h3>Central bank directive</h3><p>Monetary choices work with a lag and must keep liquidity near real economic needs.</p></div><span>Policy signal</span></div>
                <div className="double-control">
                  <RangeControl label="Central-bank rate" value={policy.policyRate} min={0} max={25} onChange={(value) => updatePolicy((current) => ({ ...current, policyRate: value }))} />
                  <RangeControl label="Broad-money growth target" value={policy.moneyGrowth} min={-5} max={30} onChange={(value) => updatePolicy((current) => ({ ...current, moneyGrowth: value }))} />
                </div>
                <div className="liquidity-summary">
                  <SignalBar label="Money supply" value={state.moneySupply} detail={state.moneySupply.toFixed(1)} />
                  <SignalBar label="Money demand" value={state.moneyDemand} detail={state.moneyDemand.toFixed(1)} tone="gold" />
                  <p>Exchange pressure <b>{state.exchangePressure.toFixed(1)}</b> · Capital flow <b>{signed(state.capitalFlow)}</b></p>
                </div>
              </section>
            </div>
          ) : null}

          {activeTab === "society" ? (
            <div className="tab-content">
              <SectionHeading
                eyebrow={`Quarter ${state.quarter + 1} · Society`}
                title="Direct the public budget."
                copy="The state can smooth shocks today and build capacity for tomorrow. Every share should serve a clear mandate."
                action={<span className={`section-badge ${policyReady ? "" : "warning"}`}>{policyReady ? "Budget aligned" : "Allocation review needed"}</span>}
              />
              <section className="policy-block society-spend">
                <div className="policy-block-heading"><div><h3>Primary public expenditure</h3><p>Set the national fiscal commitment, then allocate every available unit.</p></div><span>{percent(policy.spendingGDP)} of GDP</span></div>
                <RangeControl label="Primary public expenditure" value={policy.spendingGDP} min={10} max={35} onChange={(value) => updatePolicy((current) => ({ ...current, spendingGDP: value }))} />
              </section>
              <section className="policy-block">
                <div className="policy-block-heading"><div><h3>Ministry allocations</h3><p>All four shares must add to exactly 100% before the cabinet can submit a decision.</p></div><span>Distribution</span></div>
                <div className="allocation-grid">
                  {(["health", "education", "infrastructure", "transfers"] as const).map((key) => (
                    <RangeControl
                      key={key}
                      label={key === "infrastructure" ? "Infrastructure" : key[0].toUpperCase() + key.slice(1)}
                      value={policy.allocations[key]}
                      min={0}
                      max={100}
                      onChange={(value) => updatePolicy((current) => ({ ...current, allocations: { ...current.allocations, [key]: value } }))}
                    />
                  ))}
                </div>
                <div className={`allocation-total ${policyReady ? "valid" : "invalid"}`}>
                  <span>Allocation total</span>
                  <b>{Object.values(policy.allocations).reduce((sum, value) => sum + value, 0)}%</b>
                  <small>Required: 100%</small>
                </div>
              </section>
              <div className="society-insight-grid">
                <article><p className="eyebrow">Household conditions</p><strong>{percent(state.poverty)}</strong><span>estimated poverty</span><p>Transfers and public services have the clearest direct effect on lower-income households.</p></article>
                <article><p className="eyebrow">National development</p><strong>{state.hdi.toFixed(3)}</strong><span>human development</span><p>Health, education, and income capacity compound at different speeds across a mandate.</p></article>
              </div>
            </div>
          ) : null}

          {activeTab === "intelligence" ? (
            <div className="tab-content">
              <SectionHeading
                eyebrow={`Quarter ${state.quarter + 1} · Intelligence`}
                title="Read the pressure beneath the headlines."
                copy="Use the evidence desk to understand household distribution, liquidity, social resilience, and the trajectory of your mandate."
                action={<span className="section-badge">Last {Math.min(16, history.length)} quarters</span>}
              />
              <div className="intelligence-grid">
                <article className="intel-card distribution-card">
                  <div className="intel-card-heading"><h3>Income by quintile</h3><span>After tax & transfers</span></div>
                  <div className="quintile-bars">{state.quintiles.map((item) => (
                    <div key={item.label}>
                      <span>{item.label.replace(" 20%", "")}</span>
                      <i><em style={{ width: `${Math.min(100, item.income / state.quintiles[4].income * 100)}%` }} /></i>
                      <b>{item.income.toFixed(0)}</b>
                    </div>
                  ))}</div>
                </article>
                <article className="intel-card">
                  <div className="intel-card-heading"><h3>Social resilience</h3><span className={state.unrest >= 75 ? "critical" : state.unrest >= 55 ? "caution" : "positive"}>{state.unrest.toFixed(0)} / 100</span></div>
                  <SignalBar label="Unrest" value={state.unrest} detail="Mandate risk" tone={state.unrest >= 75 ? "red" : state.unrest >= 55 ? "gold" : "cyan"} />
                  <SignalBar label="Confidence" value={state.confidence} detail="Public sentiment" />
                  <p>Sustained readings above 85 can end the mandate. Employment, inflation, services, and transfers all matter.</p>
                </article>
                <article className="intel-card">
                  <div className="intel-card-heading"><h3>Economic trajectory</h3><span>Growth & debt</span></div>
                  <div className="trend-row">
                    <div><span>GDP growth</span><TrendBars values={history.map((item) => item.annualGrowth)} /></div>
                    <div><span>Debt / GDP</span><TrendBars values={history.map((item) => item.debtGDP)} color="gold" /></div>
                  </div>
                </article>
                <article className="intel-card exchange-card">
                  <div className="intel-card-heading"><h3>External position</h3><span>Liquidity & trade</span></div>
                  <dl className="external-stats">
                    <div><dt>Money gap</dt><dd>{signed(state.moneySupply - state.moneyDemand)}</dd></div>
                    <div><dt>Exchange pressure</dt><dd>{state.exchangePressure.toFixed(1)}</dd></div>
                    <div><dt>Capital flow</dt><dd>{signed(state.capitalFlow)}</dd></div>
                    <div><dt>Credit outlook</dt><dd>{state.creditRating}</dd></div>
                  </dl>
                </article>
              </div>
            </div>
          ) : null}
        </section>

        <aside className="cabinet-rail">
          <div className="cabinet-heading">
            <div><p className="eyebrow">Cabinet counsel</p><h2>Advisory desk</h2></div>
            <span>{activeTabLabel}</span>
          </div>
          <div className="advisor-list">
            {ADVISORS.map((advisor, index) => (
              <article className="advisor-card" key={advisor.id}>
                <CabinetPortrait src={advisor.portrait} alt={`${advisor.name}, ${advisor.role}`} />
                <div>
                  <p>{advisor.role}</p>
                  <h3>{advisor.name}</h3>
                  <span>{advisor.focus}</span>
                </div>
                <blockquote>{cabinetAdvice[index] ?? cabinetAdvice[cabinetAdvice.length - 1]}</blockquote>
              </article>
            ))}
          </div>
          <div className={`validation-panel ${policyReady ? "ready" : "invalid"}`}>
            <p className="eyebrow">{policyReady ? "Cabinet clearance" : "Decision blocked"}</p>
            {policyReady ? <p>All policy limits and budget allocations are valid. The mandate is ready to resolve.</p> : (
              <ul>{validationErrors.map((error) => <li key={error}>{error}</li>)}</ul>
            )}
          </div>
          <button type="button" className="rail-end-turn" disabled={!policyReady} onClick={resolveQuarter}>
            <span>End quarter</span><b>Resolve policy →</b>
          </button>
        </aside>
      </div>

      {briefingOpen && run.lastResult ? (
        <div className="briefing-backdrop">
          <section className="briefing-dialog" role="dialog" aria-modal="true" aria-labelledby="briefing-title">
            <header>
              <div><p className="eyebrow">Quarter {state.quarter} resolved</p><span className="briefing-status"><i /> National briefing</span></div>
              <button ref={briefingCloseRef} type="button" className="dialog-close" aria-label="Close briefing" onClick={closeBriefing}>×</button>
            </header>
            <div className="briefing-lead">
              <p className="eyebrow">{run.lastResult.event ? "External development" : "Domestic conditions"}</p>
              <h2 id="briefing-title">{run.lastResult.event?.title ?? "The quarter is in the record."}</h2>
              <p>{run.lastResult.event?.description ?? "No major external shock arrived. Your fiscal and monetary choices now set the national direction."}</p>
            </div>
            <div className="briefing-deltas" aria-label="Quarterly indicator changes">
              <MetricCard label="Growth" value={percent(state.annualGrowth)} note={previousState ? `${signed(state.annualGrowth - previousState.annualGrowth)} pts` : "Current reading"} tone={state.annualGrowth >= 2 ? "positive" : "caution"} />
              <MetricCard label="Inflation" value={percent(state.inflation)} note={previousState ? `${signed(state.inflation - previousState.inflation)} pts` : "Current reading"} tone={toneFor(state.inflation, 6, 10, true)} />
              <MetricCard label="Confidence" value={state.confidence.toFixed(0)} note={previousState ? `${signed(state.confidence - previousState.confidence, 0)} pts` : "Current reading"} tone={toneFor(state.confidence, 55, 40)} />
            </div>
            <section className="briefing-counsel">
              <p className="eyebrow">Cabinet record</p>
              {ADVISORS.map((advisor, index) => (
                <div key={advisor.id}><span>{advisor.role}</span><p>{cabinetAdvice[index] ?? cabinetAdvice[cabinetAdvice.length - 1]}</p></div>
              ))}
            </section>
            {run.lastResult.constrained ? <p className="constraint-notice">Emergency conditions constrained the scale of this quarter’s policy changes.</p> : null}
            <footer>
              <span>National record updated automatically.</span>
              <button type="button" className="primary-action" onClick={closeBriefing}>Return to command <span aria-hidden="true">→</span></button>
            </footer>
          </section>
        </div>
      ) : null}
    </main>
  );
}
