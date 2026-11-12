import { test } from "node:test";
import assert from "node:assert/strict";
import { atlasDestinations, atlasBadges, destinationShare } from "../lib/atlas/model";
import { checkpointIds } from "../lib/palace/checkpoints";
import type { PalaceState, JourneyRun, Visit } from "../lib/palace/types";

function fixture(completed: number): PalaceState {
  const visits: JourneyRun["visits"] = {};
  for (const [i, id] of checkpointIds.slice(0, completed).entries()) visits[id] = { checkpointId: id, recognizedAt: `2026-11-01T10:0${i}:00Z`, completedAt: `2026-11-01T10:1${i}:00Z`, mode: "sample", attempts: [], quiz: [] } satisfies Visit;
  return { xp: completed * 150, activeRunId: null, discovered: checkpointIds.slice(0, completed), aiAvailable: false, runs: [{ id: "first", startedAt: "2026-11-01T10:00:00Z", status: completed === 5 ? "completed" : "abandoned", completedAt: null, visits }] };
}

test("atlas aggregates lifetime discoveries without counting a replay twice", () => {
  const palace = fixture(2);
  palace.runs.unshift({ ...palace.runs[0], id: "replay", startedAt: "2026-11-02T10:00:00Z", visits: { facade: { ...palace.runs[0].visits.facade!, completedAt: "2026-11-02T10:12:00Z" } } });
  const destinations = atlasDestinations("vi", palace, 1);
  assert.deepEqual(destinations.map(d => d.completed), [2, 1]);
  assert.equal(destinations.reduce((sum, d) => sum + d.xp, 0), 450);
  assert.equal(destinations[0].stops[0].at, "2026-11-01T10:10:00Z");
  assert.equal(destinations[1].stops[0].at, undefined);
  assert.equal(palace.runs.length, 2);
});

test("badges follow completion requirements and avoid inventing dates for legacy university progress", () => {
  const partial = atlasBadges(atlasDestinations("vi", fixture(2), 1), "vi");
  assert.deepEqual(partial.map(b => b.earned), [true, false, false, false]);
  assert.equal(partial[0].at, undefined);
  const full = atlasBadges(atlasDestinations("en", fixture(5), 3), "en");
  assert.ok(full.every(b => b.earned));
  assert.equal(full.find(b => b.id === "hcmus-explorer")!.at, undefined);
  assert.equal(full.find(b => b.id === "saigon-connected")!.at, undefined);
  assert.equal(full.find(b => b.id === "palace-explorer")!.at, "2026-11-01T10:14:00Z");
});

test("empty passports and clamped legacy progress produce honest share totals in both languages", () => {
  for (const locale of ["vi", "en"] as const) {
    const empty = atlasDestinations(locale, null, 0);
    assert.equal(empty.reduce((sum, d) => sum + d.completed, 0), 0);
    assert.ok(atlasBadges(empty, locale).every(b => !b.earned));
    const destinations = atlasDestinations(locale, fixture(5), 99);
    assert.equal(destinations[1].completed, 3);
    assert.deepEqual(destinationShare(destinations[0]), { kind: "destination", title: destinations[0].shortTitle, subtitle: destinations[0].subtitle, completed: 5, total: 5, xp: 750, destinationId: "palace", at: "2026-11-01T10:14:00Z" });
  }
});
