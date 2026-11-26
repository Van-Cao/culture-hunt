import { test } from "node:test";
import assert from "node:assert/strict";
import config from "../content/hcmus/vision-training.json";
import palaceConfig from "../content/palace/vision-model.json";
import sources from "../content/hcmus/image-sources.json";
import modelConfig from "../content/hcmus/vision-model.json";
import review from "../content/hcmus/vision-reviewed-images.json";
import report from "../content/hcmus/vision-training-report.json";
import previousReview from "../content/hcmus/history/v2/vision-reviewed-images.json";
import driveReview from "../content/hcmus/drive-review-2026-11-26.json";
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

test("Drive expansion preserves earlier holdouts and keeps the entire phone outing in training", () => {
  const current = new Map(review.records.map(row => [row.id, row]));
  for (const before of previousReview.records) {
    const after = current.get(before.id);
    assert.ok(after, `missing earlier photo ${before.id}`);
    assert.equal(after.label, before.label);
    assert.equal(after.split, before.split);
    assert.equal(after.split_group, before.split_group);
  }
  const selected = driveReview.records.filter(row => row.review_status === "visually_reviewed");
  assert.equal(selected.length, driveReview.selected_for_training);
  assert.equal(driveReview.records.length, driveReview.downloaded);
  assert.equal(new Set(selected.map(row => row.original_sha256)).size, selected.length);
  assert.equal(new Set(selected.map(row => row.split_group)).size, 1);
  for (const row of selected) {
    assert.equal(row.split, "train");
    assert.equal(current.get(row.id)?.split, "train");
  }
});
