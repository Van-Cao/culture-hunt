import { loadEnvConfig } from "@next/env";
import { DatabaseSync } from "node:sqlite";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { postgresPool } from "../lib/database";

async function main() {
  loadEnvConfig(process.cwd());
  const filename = process.argv[2] || join(process.cwd(), ".culture-hunt/palace.sqlite");
  if (!existsSync(filename)) { console.log("No legacy SQLite progress to import."); return; }
  const source = new DatabaseSync(filename, { readOnly: true });
  const sql = postgresPool(process.env.DIRECT_URL || process.env.DATABASE_URL);
  try {
    source.exec("BEGIN");
    await sql.begin(async tx => {
      await tx`SELECT pg_advisory_xact_lock(592304831)`;
      const version = "sqlite-progress-import-v1";
      if ((await tx`SELECT version FROM culture_hunt.schema_migrations WHERE version=${version}`).length) { console.log("Legacy progress was already imported."); return; }
      let count = 0;
      for (const run of source.prepare("SELECT * FROM runs ORDER BY rowid").all()) {
        const present = await tx`SELECT id FROM culture_hunt.runs WHERE id=${String(run.id)}`;
        if (present.length) continue;
        await tx`UPDATE culture_hunt.runs SET status='abandoned' WHERE owner=${String(run.owner)} AND status='active' AND ${String(run.status)}='active'`;
        await tx`INSERT INTO culture_hunt.runs(id,owner,started_at,completed_at,status) VALUES(${String(run.id)},${String(run.owner)},${String(run.started_at)},${run.completed_at ? String(run.completed_at) : null},${String(run.status)})`;
        for (const table of ["visits", "attempts", "recognitions", "game_attempts"]) {
          if (!source.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table)) continue;
          for (const row of source.prepare(`SELECT * FROM ${table} WHERE run_id=? ORDER BY rowid`).all(run.id)) {
            const fields = Object.keys(row).filter(key => key !== "id");
            await tx.unsafe(`INSERT INTO culture_hunt.${table}(${fields.join(",")}) VALUES(${fields.map((_,i)=>`$${i+1}`).join(",")}) ON CONFLICT DO NOTHING`, fields.map(field=>row[field]) as never[]);
          }
        }
        count++;
      }
      for (const award of source.prepare("SELECT * FROM awards ORDER BY rowid").all()) await tx`INSERT INTO culture_hunt.awards(owner,checkpoint_id,awarded_at) VALUES(${String(award.owner)},${String(award.checkpoint_id)},${String(award.awarded_at)}) ON CONFLICT DO NOTHING`;
      await tx`INSERT INTO culture_hunt.schema_migrations(version) VALUES(${version})`;
      console.log(`Imported ${count} legacy runs; history and lifetime awards preserved.`);
    });
  } finally { source.close(); await sql.end({ timeout: 3 }); }
}
main().catch(error => { console.error("Legacy import failed:", error.code || error.name); process.exitCode = 1; });
