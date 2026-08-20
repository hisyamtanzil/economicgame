# Economic model review and calibration note

## Purpose and approved scope

Nations in Balance is a transparent, stylised economic teaching model for
fictional countries, not a national-accounts forecast or policy recommendation.
This calibration corrects unit consistency and makes the existing policy
trade-offs easier to interpret over forty quarters.

It is a narrow approved exception to the prior formula freeze in `app/game.ts`.
Only the existing macroeconomic equations may be recalibrated: fiscal debt
dynamics, household distribution, monetary transmission, unemployment,
capacity accumulation, and how existing shocks interact with existing stocks.
It does **not** authorize new instruments, mechanics, data sources, or state.

The following compatibility contracts remain fixed:

- exported game types and all ten policy controls;
- Aster, Veyra, and Nambara scenario IDs and their policy-control interface;
- event IDs, seeded selection, probabilities, and forecastability;
- policy validation and the end-game score formula and thresholds; and
- the `commonwealth-policy-lab-run-v1` local-storage key and exact saved-run
  shape.

An older saved run remains loadable. Its recorded history is not replayed or
migrated; only its next resolved quarter uses the calibrated equations.

## Economic logic

### Fiscal accounting and debt

Revenue, primary spending, interest, and the fiscal deficit are annualised
shares of GDP. The accounting identity is:

`deficit = primary spending + interest − revenue`.

Debt changes in quarterly, not annual, increments. With annualised real growth
`g` and inflation `π` expressed as percentages, the debt-ratio update is:

`debtNext = (debt + deficit / 4) / ((1 + g / 400) × (1 + π / 400))`.

Interest costs do not immediately reprice the full inherited debt stock at the
new policy rate. A fixed 15% quarterly refinancing share blends inherited
policy-rate conditions with current rate and risk conditions. Higher debt,
weaker confidence, and the existing global-rate shock therefore increase
funding stress without assuming that every bond matures in the same quarter.

### Households and inclusion

Each scenario's initial Gini coefficient and poverty-pressure/gap indicator
are derived from its starting quintile incomes. That removes a mechanical first
quarter inclusion gain. Quintiles remain ordered from lowest to highest income.

Income-tax, VAT, and transfer effects use the change from `lastPolicy`, so an
unchanged policy package does not repeatedly subtract tax from last quarter's
disposable income or repeatedly add a new transfer change. Transfers remain the
direct cash-distribution mechanism. Health and education instead work through
service capacity, employment resilience, unrest, and human development.

The poverty measure is labelled **poverty pressure**: a weighted modelled income
shortfall relative to a fictional threshold. It is not an official poverty rate,
survey headcount, or equivalent number of people.

### Monetary and real-economy transmission

Money demand evolves recursively from the preceding demand level and quarterly
nominal activity, with interest-rate changes affecting the desired liquidity
balance. The money-growth control is therefore presented as a
**liquidity-growth directive**, not a literal prediction of broad money.

Rate and liquidity choices may affect financial conditions, exchange pressure,
and inflation within the current quarter. Their principal output and employment
effect arrives with a one-quarter lag. A VAT-rate change has a one-off
pass-through to inflation; keeping VAT unchanged does not recreate the price
shock. Corporate-tax changes have bounded effects on investment and capital
flows so they do not dominate the fiscal side of the decision.

Unemployment responds to the output gap and gradually returns toward the
existing 6% benchmark instead of being held against a hard floor. Health,
education, and infrastructure stocks accumulate slowly. Health capacity cushions
the existing epidemic shock; an existing investment shock adds a modest
persistent capacity effect; and the existing global-rate shock raises borrowing
stress. These interactions retain the established event catalogue and seed
behaviour.

## Calibration targets and limits

- Each scenario's unchanged default package should complete forty quarters
  without a terminal crisis and finish as **Unfinished**.
- A deliberate, balanced policy path should be able to reach the existing
  **Successful** benchmark in each scenario.
- The model intentionally abstracts from household microdata, sectoral supply
  chains, exchange-rate regimes, demographics, expectations formation, and
  real-world country-specific institutions. Outputs are comparative teaching
signals, not forecasts or causal estimates.

## Rationale and references

The fiscal treatment follows the basic debt-dynamics distinction between an
annual fiscal flow, quarterly accumulation, nominal GDP growth, interest costs,
and refinancing risk. It is consistent with the International Monetary Fund's
emphasis on sustainable public finances, the debt-stabilising primary balance,
and the role of higher rates and lower growth in debt dynamics in the
[IMF Fiscal Monitor, April 2024](https://www.imf.org/~/media/Files/Publications/fiscal-monitor/2024/April/English/text.ashx?la=en).

The lagged monetary presentation reflects the IMF's explanation that monetary
policy works through financial conditions and demand to stabilise prices and
output, rather than changing all real outcomes instantly. See
[IMF, *Monetary Policy: Stabilizing Prices and Output*](https://www.imf.org/en/publications/fandd/issues/series/back-to-basics/monetary-policy).

## Verification record

The accompanying simulation tests should establish the fiscal identity and
quarterly debt arithmetic, policy-transition household effects, quintile
ordering, VAT pass-through, corporate-tax investment bounds, monetary lag,
unemployment response, slow capacity accumulation, and event transmission.
They should also prove unchanged scenario IDs, event sequences, validation,
end-game scoring, and legacy-save persistence. Run:

```sh
npm run build
npx tsx --test app/game.test.ts app/campaign-content.test.ts app/tutorial-content.test.ts
```
