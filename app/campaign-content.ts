/**
 * Presentation-only campaign content.  These profiles deliberately do not
 * participate in the economic simulation; scenario IDs continue to come from
 * `game.ts` and are preserved for saved-run compatibility.
 */

export type CampaignProfile = {
  leaderName: string;
  leaderTitle: string;
  /** Root-relative public asset URL for use in image `src` attributes. */
  portrait: string;
  motto: string;
  /** CSS-safe visual accent token for the campaign header and indicators. */
  accent: "aqua" | "amber" | "coral";
  summary?: string;
};

export type AdvisorProfile = {
  id: "treasury" | "social-development" | "central-bank";
  role: string;
  name: string;
  /** Root-relative public asset URL for use in image `src` attributes. */
  portrait: string;
  focus: string;
};

export const CAMPAIGN_PROFILES: Record<string, CampaignProfile> = {
  aster: {
    leaderName: "Chancellor Elian Voss",
    leaderTitle: "First Minister of Aster",
    portrait: "/portraits/leader-aster.png",
    motto: "Prosperity, deliberately shared.",
    accent: "aqua",
    summary: "A capable republic where stable growth has yet to reach every household.",
  },
  veyra: {
    leaderName: "President Samira Kade",
    leaderTitle: "Federal President of Veyra",
    portrait: "/portraits/leader-veyra.png",
    motto: "Build the systems that widen opportunity.",
    accent: "amber",
    summary: "A fast-moving federation balancing weak public services with restless ambition.",
  },
  nambara: {
    leaderName: "Premier Tomas Nwosu",
    leaderTitle: "Premier of Nambara",
    portrait: "/portraits/leader-nambara.png",
    motto: "Restore trust. Secure the recovery.",
    accent: "coral",
    summary: "A fragile recovery where credibility, prices, and development are all under pressure.",
  },
};

export const ADVISORS: readonly AdvisorProfile[] = [
  {
    id: "treasury",
    role: "Treasury",
    name: "Director Mara Sol",
    portrait: "/portraits/advisor-treasury.png",
    focus: "Revenue, public borrowing, and the fiscal room behind each commitment.",
  },
  {
    id: "social-development",
    role: "Social Development",
    name: "Dr. Anika Rho",
    portrait: "/portraits/advisor-social-development.png",
    focus: "Household resilience, public services, inequality, and human development.",
  },
  {
    id: "central-bank",
    role: "Central Bank",
    name: "Governor Elias Neri",
    portrait: "/portraits/advisor-central-bank.png",
    focus: "Inflation, liquidity, confidence, and the stability of the currency outlook.",
  },
];

/**
 * Mirrors `getScenario`: a stale or unknown saved scenario falls back to the
 * Aster presentation profile rather than leaving a command screen without
 * leader content.
 */
export function getCampaignProfile(scenarioId: string): CampaignProfile {
  return CAMPAIGN_PROFILES[scenarioId] ?? CAMPAIGN_PROFILES.aster;
}
