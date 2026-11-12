import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import stories from "../content/palace/stories.json";
import manifest from "../public/audio/palace/manifest.json";
import { checkpointIds } from "../lib/palace/checkpoints";

test("all ten published narrations match the bilingual scripts and contain real audio assets", () => {
  assert.equal(manifest.version, stories.version);
  for (const id of checkpointIds) for (const locale of ["vi", "en"] as const) {
    const story = stories.stories[id][locale];
    const track = (manifest.tracks as Record<string, Record<string, {src: string; duration: number; bytes: number; textSha256: string; provider: string}>>)[id][locale];
    assert.ok(story.title && story.text);
    assert.equal(track.textSha256, createHash("sha256").update(story.text).digest("hex"), `${id}/${locale} narration must follow the current script`);
    const file = join(process.cwd(), "public", track.src);
    assert.equal(statSync(file).size, track.bytes);
    assert.ok(track.bytes > 10000 && track.duration > 20 && track.duration < 60);
    assert.ok(track.provider);
    const header = readFileSync(file).subarray(0, 3);
    assert.ok(header.toString() === "ID3" || header[0] === 0xff, "MP3 must contain MPEG frames, not a placeholder response");
  }
});
