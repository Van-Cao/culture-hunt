import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { identifyWithAI, prepareImage } from "../lib/palace/recognition";

async function main() {
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  if (!process.env.OPENAI_API_KEY) {
    console.log("AI not configured; reference-photo mode is available.");
    return;
  }
  for (const [name, path] of [
    ["rooftop", "public/images/palace/rooftop.webp"],
    ["outside-palace", "public/images/hcmus-campus.webp"],
  ]) {
    try {
      const result = await identifyWithAI(
        await prepareImage(await readFile(path)),
      );
      console.log(
        JSON.stringify({
          photo: name,
          status: result.status,
          checkpointId: result.checkpointId,
          mode: result.mode,
        }),
      );
      if (name === "rooftop" && result.checkpointId !== "rooftop")
        process.exitCode = 1;
      if (name === "outside-palace" && result.status === "matched")
        process.exitCode = 1;
    } catch (error) {
      console.log(
        JSON.stringify({
          photo: name,
          error: error instanceof Error ? error.message : "Vision unavailable",
        }),
      );
      process.exitCode = 1;
    }
  }
}
void main();
