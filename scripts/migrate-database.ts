import { loadEnvConfig } from "@next/env";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { postgresPool } from "../lib/database";

async function main() {
  loadEnvConfig(process.cwd());
  const sql = postgresPool(process.env.DIRECT_URL || process.env.DATABASE_URL);
  try {
    const directory = join(process.cwd(), "supabase/migrations");
    for (const file of (await readdir(directory)).filter(file => file.endsWith(".sql")).sort()) {
      await sql.begin(async tx => {
        await tx`SELECT pg_advisory_xact_lock(592304831)`;
        const existing = await tx`SELECT to_regclass('culture_hunt.schema_migrations') as name`;
        if (existing[0].name && (await tx`SELECT version FROM culture_hunt.schema_migrations WHERE version=${file}`).length) return;
        await tx.unsafe(await readFile(join(directory, file), "utf8"));
        await tx`INSERT INTO culture_hunt.schema_migrations(version) VALUES(${file})`;
        console.log(`Applied ${file}`);
      });
    }
  } finally { await sql.end({ timeout: 3 }); }
}
main().catch(error => { console.error("Database migration failed:", error.code || error.name); process.exitCode = 1; });
