# Nations in Balance

## Product contract

Nations in Balance is an original, fictional national economic-strategy game. Its
visual language may be inspired by the clarity, hierarchy, and command-screen
feel of grand strategy games, but it must not copy Civilization artwork, maps,
icons, terminology, layouts, or other protected game assets.

The player governs one fictional country through the existing forty-quarter
economic simulation. The product is a neutral-technocracy command centre:
calm, legible, modern, and consequential rather than militaristic or cartoonish.

## Required experience

- Keep the existing three campaigns: Aster, Veyra, and Nambara.
- Use a desktop-first layout that remains practical on narrow/mobile screens.
- Organize the command centre into Command, Treasury, Society, and Intelligence
  views. These are views of the existing simulation, not new game systems.
- Keep a persistent resource/status ribbon and a clearly prominent End Quarter
  action while a campaign is active.
- After resolving a turn, present the result in an accessible briefing overlay.
  It must be dismissible by an explicit button and Escape, receive keyboard
  focus when opened, and never advance a turn automatically.
- Show one fictional leader per scenario and three shared advisors (Treasury,
  Social Development, and Central Bank). Advisors explain the current state and
  trade-offs only; they do not change calculations or grant gameplay effects.
- Provide a five-step, presentation-only guide for goals, Treasury, Society,
  Intelligence, and winning. It may direct the player to a command-centre view,
  but must never alter policy values or resolve a quarter.
- Auto-open the guide only for a newly started mandate when it has not yet been
  completed in that browser. Keep it manually available and never show it
  automatically when restoring a saved campaign.

## Simulation and compatibility constraints

- Preserve all calculations, exported types, scenario IDs, seeded-event
  behaviour, end-game scoring, and policy validation in `app/game.ts`.
- Preserve the local-storage key `commonwealth-policy-lab-run-v1` and its run
  shape so an in-progress saved campaign remains loadable after UI work.
- Store tutorial completion only as a separate browser preference under
  `nations-in-balance-tutorial-v1`; it must not alter the saved-run format.
- Do not introduce a backend, database schema, API routes, authentication
  requirement, multiplayer, analytics, or new dependencies for this redesign.
- Do not add maps, units, cities, territory, diplomacy, technology trees,
  construction queues, or new mechanics. A geographic-looking dashboard is out
  of scope because the model has no spatial data.
- Keep all scenarios, leader names, advisor names, and country details clearly
  fictional.

## Asset contract

Use six original local portrait assets, with browser paths listed below. Source
files belong under `public/portraits/`; UI code should reference the equivalent
root-relative browser path (for example `/portraits/leader-aster.png`).

- `public/portraits/leader-aster.png`
- `public/portraits/leader-veyra.png`
- `public/portraits/leader-nambara.png`
- `public/portraits/advisor-treasury.png`
- `public/portraits/advisor-social-development.png`
- `public/portraits/advisor-central-bank.png`

Portraits must be original, non-photorealistic or appropriately licensed,
contain no embedded essential text, and have meaningful contextual alt text in
the consuming UI. Keep campaign and advisor copy in `app/campaign-content.ts`
instead of duplicating it across components.

## Accessibility and interaction

- Use semantic controls, visible keyboard focus, programmatic labels, and
  readable status text for all tabs, inputs, and turn-resolution controls.
- Do not use color alone to communicate an economic state; pair it with text,
  icons, or values.
- Support keyboard tab navigation, Enter/Space activation, and Escape for the
  briefing overlay. Preserve a sensible focus return target after close.
- Treat the tutorial as an accessible modal: provide explicit close and
  navigation controls, visible step progress, keyboard focus containment,
  Escape dismissal, and focus return to its original trigger.
- Respect `prefers-reduced-motion`; animations must be decorative and optional.
- Retain adequate contrast, responsive reflow, and usable touch targets.
- Announce meaningful post-turn updates through an appropriate live region or
  dialog semantics without creating disruptive repeated announcements.

## Validation criteria

- `npm run build` succeeds.
- Run the existing simulation suite and the dependency-free campaign-content
  and tutorial-content suites: `npx tsx --test app/game.test.ts
  app/campaign-content.test.ts app/tutorial-content.test.ts`.
- Verify Aster, Veyra, and Nambara resolve through the existing `game.ts`
  mechanics unchanged, including seeded events and crisis/endgame behaviour.
- Verify an existing `commonwealth-policy-lab-run-v1` save still restores, and
  a newly resolved quarter still persists under that key.
- Manually verify desktop and mobile layouts, keyboard tab navigation, visible
  focus, reduced-motion behaviour, tab panels, and the post-turn briefing
  overlay. Also verify guide launch and dismissal, no guide on save restoration,
  policy hints, score benchmarks, and tutorial focus behavior.
