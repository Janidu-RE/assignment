import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildServer } from '../src/server';
import { pool } from '../src/db';
import { ensureTestDatabase, resetDatabase } from './helpers';

const app = buildServer({ logger: false });

beforeAll(async () => {
  await ensureTestDatabase();
  await app.ready();
});

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await app.close();
  await pool.end();
});

describe('GET /tickets', () => {
  it('returns all tickets with assignee name and comment count', async () => {
    const res = await app.inject({ method: 'GET', url: '/tickets' });

    expect(res.statusCode).toBe(200);
    const tickets = res.json();
    expect(tickets).toHaveLength(4);

    const printer = tickets.find((t: any) => t.subject === 'Printer on fire');
    expect(printer).toMatchObject({
      status: 'open',
      priority: 'urgent',
      assigneeName: 'Ada Fixture',
      commentCount: 2,
      slaHours: 4,
      slaStatus: 'ok',
    });
    expect(printer.createdAt).toBeTypeOf('string');

    const slow = tickets.find((t: any) => t.subject === 'Slow reports page');
    expect(slow).toMatchObject({
      status: 'in_progress',
      priority: 'medium',
      assigneeName: 'Grace Fixture',
      slaHours: 24,
      slaStatus: 'breached',
    });

    const unassigned = tickets.find((t: any) => t.subject === 'Unassigned question');
    expect(unassigned.assigneeId).toBeNull();
    expect(unassigned.assigneeName).toBeNull();
    expect(unassigned.commentCount).toBe(0);
    expect(unassigned.slaStatus).toBe('ok');

    const closed = tickets.find((t: any) => t.subject === 'Closed legacy import');
    expect(closed.slaStatus).toBeNull();
  });

  it('filters by status only', async () => {
    const res = await app.inject({ method: 'GET', url: '/tickets?status=in_progress' });
    expect(res.statusCode).toBe(200);
    const tickets = res.json();
    expect(tickets).toHaveLength(1);
    expect(tickets[0].subject).toBe('Slow reports page');
  });

  it('filters by assigneeId only', async () => {
    const res = await app.inject({ method: 'GET', url: '/tickets?assigneeId=1' });
    expect(res.statusCode).toBe(200);
    const tickets = res.json();
    expect(tickets).toHaveLength(1);
    expect(tickets[0].subject).toBe('Printer on fire');
  });

  it('filters by unassigned (assigneeId=null)', async () => {
    const res = await app.inject({ method: 'GET', url: '/tickets?assigneeId=null' });
    expect(res.statusCode).toBe(200);
    const tickets = res.json();
    expect(tickets).toHaveLength(2);
    const subjects = tickets.map((t: any) => t.subject);
    expect(subjects).toContain('Unassigned question');
    expect(subjects).toContain('Closed legacy import');
  });

  it('combines status and assignee filters', async () => {
    const res = await app.inject({ method: 'GET', url: '/tickets?status=open&assigneeId=1' });
    expect(res.statusCode).toBe(200);
    const tickets = res.json();
    expect(tickets).toHaveLength(1);
    expect(tickets[0].subject).toBe('Printer on fire');
  });

  it('filters by assigneeName only', async () => {
    const res = await app.inject({ method: 'GET', url: '/tickets?assigneeName=Ada+Fixture' });
    expect(res.statusCode).toBe(200);
    const tickets = res.json();
    expect(tickets).toHaveLength(1);
    expect(tickets[0].subject).toBe('Printer on fire');
  });

  it('combines status and assigneeName filters', async () => {
    const res = await app.inject({ method: 'GET', url: '/tickets?status=open&assigneeName=Ada+Fixture' });
    expect(res.statusCode).toBe(200);
    const tickets = res.json();
    expect(tickets).toHaveLength(1);
    expect(tickets[0].subject).toBe('Printer on fire');
  });

  it('returns empty array when no tickets match combined filter', async () => {
    const res = await app.inject({ method: 'GET', url: '/tickets?status=resolved&assigneeId=1' });
    expect(res.statusCode).toBe(200);
    const tickets = res.json();
    expect(tickets).toHaveLength(0);
  });
});

describe('GET /tickets/:id', () => {
  it('returns the ticket with its comments', async () => {
    const res = await app.inject({ method: 'GET', url: '/tickets/1' });

    expect(res.statusCode).toBe(200);
    const ticket = res.json();
    expect(ticket.subject).toBe('Printer on fire');
    expect(ticket.comments).toHaveLength(2);
    expect(ticket.comments[0]).toMatchObject({
      ticketId: 1,
      authorName: 'Grace Fixture',
      body: 'Extinguisher deployed, assessing damage.',
    });
  });

  it('returns 404 for an unknown ticket', async () => {
    const res = await app.inject({ method: 'GET', url: '/tickets/999' });

    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: 'Ticket 999 not found' });
  });
});

describe('POST /tickets', () => {
  it('creates a ticket with defaults applied', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/tickets',
      payload: {
        subject: 'Keyboard missing keys',
        description: 'The E and R keys have vanished.',
      },
    });

    expect(res.statusCode).toBe(201);
    const ticket = res.json();
    expect(ticket).toMatchObject({
      subject: 'Keyboard missing keys',
      status: 'open',
      priority: 'medium',
      assigneeId: null,
      assigneeName: null,
      slaHours: 8,
      commentCount: 0,
      resolvedAt: null,
    });
  });

  it('rejects an invalid payload', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/tickets',
      payload: { subject: '' },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('Validation failed');
  });
});

describe('PATCH /tickets/:id/status', () => {
  it('updates the status and returns the ticket', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/tickets/1/status',
      payload: { status: 'in_progress' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe('in_progress');
  });

  it('rejects an unknown status value', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/tickets/1/status',
      payload: { status: 'archived' },
    });

    expect(res.statusCode).toBe(400);
  });
});

describe('GET /users', () => {
  it('returns all users ordered by name', async () => {
    const res = await app.inject({ method: 'GET', url: '/users' });
    expect(res.statusCode).toBe(200);
    const users = res.json();
    expect(users).toHaveLength(2);
    expect(users[0].name).toBe('Ada Fixture');
    expect(users[1].name).toBe('Grace Fixture');
  });
});
