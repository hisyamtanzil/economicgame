import assert from "node:assert/strict";
import test from "node:test";
import { ADVISORS, CAMPAIGN_PROFILES, getCampaignProfile } from "./campaign-content.ts";
import { SCENARIOS } from "./game.ts";

test("every simulation scenario has a compatible campaign presentation profile", () => {
  assert.deepEqual(
    Object.keys(CAMPAIGN_PROFILES).sort(),
    SCENARIOS.map((scenario) => scenario.id).sort(),
  );

  for (const scenario of SCENARIOS) {
    const profile = getCampaignProfile(scenario.id);
    assert.ok(profile.leaderName.length > 0);
    assert.ok(profile.leaderTitle.length > 0);
    assert.match(profile.portrait, /^\/portraits\/leader-[a-z]+\.png$/);
    assert.ok(profile.motto.length > 0);
  }
});

test("advisor content provides the three contextual roles without gameplay data", () => {
  assert.deepEqual(
    ADVISORS.map((advisor) => advisor.id),
    ["treasury", "social-development", "central-bank"],
  );

  for (const advisor of ADVISORS) {
    assert.ok(advisor.role.length > 0);
    assert.ok(advisor.name.length > 0);
    assert.match(advisor.portrait, /^\/portraits\/advisor-[a-z-]+\.png$/);
    assert.ok(advisor.focus.length > 0);
  }
});

test("unknown scenario IDs use the safe Aster presentation fallback", () => {
  assert.equal(getCampaignProfile("retired-campaign"), CAMPAIGN_PROFILES.aster);
});
