import test from "node:test";
import assert from "node:assert/strict";
import { achievementsFor, MAX_PHOTO_BYTES, parseChoice, parseNickname, parseVerifiedScan, photoExtension, publicCheckin } from "../lib/data/rules.ts";
import type { CheckinRow } from "../lib/data/types.ts";

const scan = {
  placeId: "palace", placeName: "Dinh Độc Lập",
  quizzes: [{ id: "mission-1", question: "Câu hỏi?", options: ["A", "B", "C", "D"], correctIndex: 1 }],
};
const row: CheckinRow = {
  id: "checkin", user_id: "player", place_id: "palace", place_name: "Dinh Độc Lập",
  status: "checked_in", quizzes: parseVerifiedScan(scan).quizzes, progress: {},
  photo_path: null, created_at: "2026-11-12T00:00:00Z", updated_at: "2026-11-12T00:00:00Z", completed_at: null,
};
test("validates stable quiz IDs, options and correct choice", () => {
  assert.deepEqual(parseVerifiedScan(scan), scan);
  assert.throws(() => parseVerifiedScan({ ...scan, quizzes: [...scan.quizzes, ...scan.quizzes] }));
  assert.throws(() => parseVerifiedScan({ ...scan, quizzes: [{ ...scan.quizzes[0], options: ["A"] }] }));
  assert.throws(() => parseVerifiedScan({ ...scan, quizzes: [{ ...scan.quizzes[0], correctIndex: true }] }));
  assert.throws(() => parseVerifiedScan({ ...scan, placeId: "../other" }));
  for (const invalid of [-1, 4, 1.5, "1", null, true]) assert.throws(() => parseChoice(invalid));
  assert.equal(parseNickname("  Phong  "), "Phong");
  assert.throws(() => parseNickname(" "));
});
test("public responses do not expose answer keys or unknown quiz fields", () => {
  const unsafe = { ...row, quizzes: [{ ...row.quizzes[0], hiddenAnswer: "B" }] };
  const result = publicCheckin(unsafe);
  assert.equal(result.nextMissionId, "mission-1");
  assert.equal(JSON.stringify(result).includes("correctIndex"), false);
  assert.equal(JSON.stringify(result).includes("hiddenAnswer"), false);
});
test("wrong attempted questions advance resume position", () => {
  const result = publicCheckin({ ...row, progress: {
    "mission-1": { attempted: true, attempts: 1, last_choice: 0, correct_at: null,
      first_attempted_at: row.created_at, last_answered_at: row.created_at },
  } });
  assert.equal(result.nextMissionId, null);
});
test("achievement boundaries use unique places and saved scores", () => {
  const place = publicCheckin(row);
  const low = achievementsFor(149, [place, place]);
  assert.equal(low.find((a) => a.id === "points-150")?.unlocked, false);
  assert.equal(low.find((a) => a.id === "checkins-3")?.unlocked, false);
  const high = achievementsFor(1000, [publicCheckin({ ...row, status: "completed", completed_at: row.created_at })]);
  assert.equal(high.find((a) => a.id === "points-1000")?.unlocked, true);
  assert.equal(high.find((a) => a.id === "destination-palace")?.unlocked, true);
});
test("photo validation checks byte signature, declared type and size", () => {
  const png = Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,0]);
  assert.equal(photoExtension(png, "image/png"), "png");
  assert.throws(() => photoExtension(png, "image/jpeg"));
  assert.throws(() => photoExtension(new Uint8Array(20), "image/png"));
  assert.throws(() => photoExtension(new Uint8Array(MAX_PHOTO_BYTES + 1), "image/png"));
});
