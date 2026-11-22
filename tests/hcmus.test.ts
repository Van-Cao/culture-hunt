import { test } from "node:test";
import assert from "node:assert/strict";
import { getHcmusCheckpoints, hcmusCheckpointIds } from "../lib/hcmus/checkpoints";
import { HCMUS_PROGRESS_STORAGE_KEY, readHcmusProgress } from "../lib/hcmus/progress";
import { getPlaces } from "../components/UI/game-data";
import { atlasDestinations, atlasBadges, destinationShare } from "../lib/atlas/model";

test("HCMUS uses the four agreed Nguyen Van Cu stops, in the same order in both languages", () => {
  const vi = getHcmusCheckpoints("vi");
  const en = getHcmusCheckpoints("en");
  assert.deepEqual(vi.map(cp => cp.name), ["Giảng đường 1", "Tòa I", "Tòa A", "Tòa B"]);
  assert.equal(new Set(hcmusCheckpointIds).size, 4);
  assert.deepEqual(vi.map(cp => cp.id), en.map(cp => cp.id));
  assert.notEqual(vi[0].id, vi[1].id, "Building I is distinct from Lecture Hall 1");
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

test("four-stop progress survives reload using a fresh key for the reordered catalog", () => {
  assert.notEqual(HCMUS_PROGRESS_STORAGE_KEY, "culture-hunt-progress-v1");
  assert.notEqual(HCMUS_PROGRESS_STORAGE_KEY, "culture-hunt-hcmus-checkpoints-v1");
  for (let completed = 0; completed <= 4; completed++) {
    assert.equal(readHcmusProgress(JSON.stringify(completed)), completed);
  }
  for (const invalid of [null, "{", "5", "7", "-1", "2.5", '"4"', '{"palace":3,"hcmus":3}']) {
    assert.equal(readHcmusProgress(invalid), 0);
  }
});

test("atlas, XP and the HCMUS badge require all four physical checkpoints", () => {
  for (const locale of ["vi", "en"] as const) {
    const partial = atlasDestinations(locale, null, 3);
    assert.equal(partial[1].total, 4);
    assert.deepEqual(partial[1].stops.map(cp => cp.id), [...hcmusCheckpointIds]);
    assert.equal(atlasBadges(partial, locale).find(b => b.id === "hcmus-explorer")!.earned, false);
    const full = atlasDestinations(locale, null, 4);
    assert.equal(full[1].completed, 4);
    assert.equal(destinationShare(full[1]).xp, 600);
    assert.ok(atlasBadges(full, locale).find(b => b.id === "hcmus-explorer")!.earned);
  }
});
