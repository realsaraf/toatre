#!/usr/bin/env tsx
import postgres from 'postgres';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

async function main() {
  const file = process.argv[2];
  if (!file) { console.error('usage: tsx scripts/query-sql.ts <file>'); process.exit(1); }
  const conn = process.env.SUPABASE_DB_URL;
  if (!conn) { console.error('SUPABASE_DB_URL required'); process.exit(1); }
  const sql = await readFile(resolve(file), 'utf8');
  const client = postgres(conn, { ssl: 'require', max: 1 });
  try {
    const rows = await client.unsafe(sql);
    console.table(rows);
  } finally {
    await client.end();
  }
}
main();
