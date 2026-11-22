import { test } from "node:test";
import assert from "node:assert/strict";
import config from "../content/hcmus/vision-training.json";
import palaceConfig from "../content/palace/vision-model.json";
import sources from "../content/hcmus/image-sources.json";
import modelConfig from "../content/hcmus/vision-model.json";
import review from "../content/hcmus/vision-reviewed-images.json";
import report from "../content/hcmus/vision-training-report.json";
import { getHcmusCheckpoints } from "../lib/hcmus/checkpoints";

test("HCMUS training labels match the UI checkpoint IDs and do not reuse the Palace model", () => {
  assert.deepEqual(config.checkpoints.map(cp => [cp.id, cp.name]), getHcmusCheckpoints("vi").map(cp => [cp.id, cp.name]));
  assert.equal(new Set([...config.checkpoints.map(cp => cp.id), config.backgroundClass]).size, 5);
  assert.equal(config.campusId, "nguyen-van-cu");
  assert.equal(config.status, "trained_experimental");
  assert.ok(!palaceConfig.weights.startsWith(config.outputDirectory));
  for (const source of sources.sources) {
    assert.ok(source.candidateCheckpoint === null || config.checkpoints.some(cp => cp.id === source.candidateCheckpoint));
  }
  assert.equal(modelConfig.model_sha256, report.model_sha256);
  assert.equal(modelConfig.weights, report.weights);
  assert.equal(modelConfig.enabled_in_gameplay, false);
  assert.deepEqual(modelConfig.enabled_checkpoints, config.checkpoints.map(cp => cp.id));
});

test("reviewed HCMUS sources never cross splits and every split covers the four checkpoints plus other", () => {
  const groups = new Map<string, string>();
  const labels = [...config.checkpoints.map(cp => cp.id), config.backgroundClass].sort();
  assert.equal(new Set(review.records.map(row => row.id)).size, review.records.length);
  for (const row of review.records) {
    assert.equal(row.review_status, "visually_reviewed");
    assert.ok(labels.includes(row.label));
    assert.ok(!groups.has(row.split_group) || groups.get(row.split_group) === row.split);
    groups.set(row.split_group, row.split);
  }
  for (const split of ["train", "val", "test"]) {
    assert.deepEqual([...new Set(review.records.filter(row => row.split === split).map(row => row.label))].sort(), labels);
  }
  assert.equal(report.test.correct, report.test.details.filter(row => row.correct).length);
  assert.equal(report.test.total, review.records.filter(row => row.split === "test").length);
});
