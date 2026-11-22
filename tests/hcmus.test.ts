import { test } from "node:test";
import assert from "node:assert/strict";
import { getHcmusCheckpoints, hcmusCheckpointIds } from "../lib/hcmus/checkpoints";
import { HCMUS_PROGRESS_STORAGE_KEY, readHcmusProgress } from "../lib/hcmus/progress";
import { getPlaces } from "../components/UI/game-data";
import { atlasDestinations, atlasBadges, destinationShare } from "../lib/atlas/model";

test("HCMUS uses the seven agreed Nguyen Van Cu stops, in the same order in both languages", () => {
  const vi = getHcmusCheckpoints("vi");
  const en = getHcmusCheckpoints("en");
  assert.deepEqual(vi.map(cp => cp.name), ["Tòa I", "Tòa B", "Tòa C", "Tòa E", "Tòa F", "Tòa A", "Giảng đường 1"]);
  assert.equal(new Set(hcmusCheckpointIds).size, 7);
  assert.deepEqual(vi.map(cp => cp.id), en.map(cp => cp.id));
  assert.notEqual(vi[0].id, vi[6].id, "Building I is distinct from Lecture Hall 1");
  for (const locale of ["vi", "en"] as const) {
    const checkpoints = getHcmusCheckpoints(locale);
    const place = getPlaces(locale).find(p => p.id === "hcmus")!;
    assert.deepEqual(place.missions.map(m => m.id), checkpoints.map(cp => cp.id));
    for (const cp of checkpoints) {
      assert.equal(cp.mission.answers.length, 4);
      assert.equal(new Set(cp.mission.answers).size, 4);
      assert.equal(cp.mission.answers[cp.mission.correct], cp.name);
    }
  }
});

test("seven-stop progress survives reload without mapping old story completions onto buildings", () => {
  assert.notEqual(HCMUS_PROGRESS_STORAGE_KEY, "culture-hunt-progress-v1");
  for (let completed = 0; completed <= 7; completed++) {
    assert.equal(readHcmusProgress(JSON.stringify(completed)), completed);
  }
  for (const invalid of [null, "{", "8", "-1", "2.5", '"7"', '{"palace":3,"hcmus":3}']) {
    assert.equal(readHcmusProgress(invalid), 0);
  }
});

test("atlas, XP and the HCMUS badge require all seven physical checkpoints", () => {
  for (const locale of ["vi", "en"] as const) {
    const partial = atlasDestinations(locale, null, 3);
    assert.equal(partial[1].total, 7);
    assert.deepEqual(partial[1].stops.map(cp => cp.id), [...hcmusCheckpointIds]);
    assert.equal(atlasBadges(partial, locale).find(b => b.id === "hcmus-explorer")!.earned, false);
    const full = atlasDestinations(locale, null, 7);
    assert.equal(full[1].completed, 7);
    assert.equal(destinationShare(full[1]).xp, 1050);
    assert.ok(atlasBadges(full, locale).find(b => b.id === "hcmus-explorer")!.earned);
  }
});
