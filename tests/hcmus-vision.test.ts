import { test } from "node:test";
import assert from "node:assert/strict";
import config from "../content/hcmus/vision-training.json";
import palaceConfig from "../content/palace/vision-model.json";
import sources from "../content/hcmus/image-sources.json";
import { getHcmusCheckpoints } from "../lib/hcmus/checkpoints";

test("HCMUS training labels match the UI checkpoint IDs and do not reuse the Palace model", () => {
  assert.deepEqual(config.checkpoints.map(cp => [cp.id, cp.name]), getHcmusCheckpoints("vi").map(cp => [cp.id, cp.name]));
  assert.equal(new Set([...config.checkpoints.map(cp => cp.id), config.backgroundClass]).size, 5);
  assert.equal(config.campusId, "nguyen-van-cu");
  assert.equal(config.status, "awaiting_dataset");
  assert.ok(!palaceConfig.weights.startsWith(config.outputDirectory));
  for (const source of sources.sources) {
    assert.ok(source.candidateCheckpoint === null || config.checkpoints.some(cp => cp.id === source.candidateCheckpoint));
  }
});
