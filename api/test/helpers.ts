import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { pool } from '../src/db';

const here = dirname(fileURLToPath(import.meta.url));
const schema = readFileSync(join(here, '..', 'db', 'schema.sql'), 'utf8');

// Creates the test database if it does not exist yet. Assumes the compose
// Postgres from the repo root is running.
export async function ensureTestDatabase() {
  const url = new URL(
    process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/deskline_test'
  );
  const dbName = url.pathname.slice(1);
  url.pathname = '/postgres';
  const admin = new pg.Client({ connectionString: url.toString() });
  await admin.connect();
  const { rows } = await admin.query('select 1 from pg_database where datname = $1', [dbName]);
  if (rows.length === 0) {
    await admin.query(`create database ${dbName}`);
  }
  await admin.end();
}

// Drops and recreates all tables, then loads a small fixture set.
export async function resetDatabase() {
  await pool.query('drop table if exists comments, tickets, users cascade');
  await pool.query(schema);

  await pool.query(`
    insert into users (name, email) values
      ('Ada Fixture', 'ada@deskline.local'),
      ('Grace Fixture', 'grace@deskline.local')
  `);

  await pool.query(`
    insert into tickets (subject, description, status, priority, assignee_id, sla_hours, created_at, updated_at, resolved_at) values
      ('Printer on fire', 'The office printer is quite literally on fire.', 'open', 'urgent', 1, 4, now() - interval '2 hours', now() - interval '2 hours', null),
      ('Slow reports page', 'Reports page takes ages to load on Mondays.', 'in_progress', 'medium', 2, 24, now() - interval '2 days', now() - interval '1 day', null),
      ('Unassigned question', 'How do I export my data?', 'open', 'low', null, 8, now() - interval '1 hour', now() - interval '1 hour', null),
      ('Closed legacy import', 'Import failed on legacy details.', 'closed', 'medium', null, 8, now() - interval '25 days', now() - interval '22 days', null)
  `);

  await pool.query(`
    insert into comments (ticket_id, author_id, body, created_at) values
      (1, 2, 'Extinguisher deployed, assessing damage.', now() - interval '90 minutes'),
      (1, 1, 'Ordering a replacement.', now() - interval '60 minutes'),
      (2, 1, 'Profiling the query now.', now() - interval '12 hours')
  `);
}
