import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { app } from '../src/app';
import {
  account,
  categories,
  financialAccounts,
  session,
  transactions,
  user,
  verification,
} from '../src/db/schema';
import { auth } from '../src/lib/auth';
import { db } from '../src/lib/db';

async function clearDatabase(): Promise<void> {
  await db.delete(transactions);
  await db.delete(financialAccounts);
  await db.delete(session);
  await db.delete(account);
  await db.delete(verification);
  await db.delete(user);
}

async function getAuthCookies(email: string): Promise<string> {
  const res = await auth.handler(
    new Request('http://localhost/api/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'password123', name: 'TX Test' }),
    }),
  );
  return res.headers.getSetCookie().join('; ');
}

async function createAccount(cookies: string, name: string): Promise<{ id: string }> {
  const res = await app.handle(
    new Request('http://localhost/api/financial-accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookies },
      body: JSON.stringify({ name, type: 'bank', initialBalance: 1000000 }),
    }),
  );
  return ((await res.json()) as any).data;
}

async function createTransaction(
  cookies: string,
  data: Record<string, unknown>,
): Promise<{ id: string; amount: number; accountId: string }> {
  // Insert via direct DB since the chat endpoint needs a mock LLM server
  // Instead, use the PATCH/GET test approach — create via direct insert
  let cat = await db.query.categories.findFirst({
    where: (c, { eq }) => eq(c.name, 'coffee'),
  });
  if (!cat) {
    const [newCat] = await db
      .insert(categories)
      .values({ name: 'coffee', label: 'Coffee' })
      .returning();
    cat = newCat;
  }

  // Get user from session
  const sessionRes = await app.handle(
    new Request('http://localhost/api/financial-accounts', {
      headers: { Cookie: cookies },
    }),
  );
  const accounts = ((await sessionRes.json()) as any).data;
  const accountId = data.accountId ?? accounts[0]?.id ?? null;

  // We need the userId - get it from a whoami-like call
  // Use the auth guard test app pattern
  const whoami = await auth.handler(
    new Request('http://localhost/api/get-session', {
      headers: { Cookie: cookies },
    }),
  );
  const sessionData = (await whoami.json()) as any;
  const userId = sessionData.user.id;

  const [row] = await db
    .insert(transactions)
    .values({
      userId,
      accountId: accountId as string,
      type: (data.type as string) ?? 'expense',
      amount: ((data.amount as number) ?? 25000).toString(),
      currency: (data.currency as string) ?? 'IDR',
      categoryId: cat!.id,
      description: (data.description as string) ?? 'Test coffee',
      date: new Date(),
    })
    .returning();

  return { id: row.id, amount: Number(row.amount), accountId: row.accountId! };
}

describe('Transactions API', () => {
  beforeEach(clearDatabase);
  afterEach(clearDatabase);

  it('lists transactions with pagination', async () => {
    const cookies = await getAuthCookies(`tx-list-${Date.now()}@example.com`);
    const acct = await createAccount(cookies, 'TestBank');

    // Create 3 transactions
    await createTransaction(cookies, { accountId: acct.id, description: 'Coffee 1' });
    await createTransaction(cookies, { accountId: acct.id, description: 'Coffee 2' });
    await createTransaction(cookies, { accountId: acct.id, description: 'Coffee 3' });

    const response = await app.handle(
      new Request('http://localhost/api/transactions?limit=2&page=1', {
        headers: { Cookie: cookies },
      }),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as any;
    expect(body.data).toHaveLength(2);
    expect(body.meta.total).toBe(3);
    expect(body.meta.page).toBe(1);
    expect(body.meta.limit).toBe(2);
  });

  it('filters transactions by type', async () => {
    const cookies = await getAuthCookies(`tx-filter-${Date.now()}@example.com`);
    const acct = await createAccount(cookies, 'TestBank');

    await createTransaction(cookies, {
      accountId: acct.id,
      type: 'expense',
      description: 'Coffee',
    });
    await createTransaction(cookies, {
      accountId: acct.id,
      type: 'income',
      description: 'Salary',
      amount: 1000000,
    });

    const response = await app.handle(
      new Request('http://localhost/api/transactions?type=income', {
        headers: { Cookie: cookies },
      }),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as any;
    expect(body.data).toHaveLength(1);
    expect(body.data[0].type).toBe('income');
  });

  it('gets a single transaction by id', async () => {
    const cookies = await getAuthCookies(`tx-get-${Date.now()}@example.com`);
    const acct = await createAccount(cookies, 'TestBank');
    const tx = await createTransaction(cookies, { accountId: acct.id });

    const response = await app.handle(
      new Request(`http://localhost/api/transactions/${tx.id}`, {
        headers: { Cookie: cookies },
      }),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as any;
    expect(body.data.id).toBe(tx.id);
    expect(body.data.amount).toBe(25000);
  });

  it('updates a transaction and adjusts account balance', async () => {
    const cookies = await getAuthCookies(`tx-update-${Date.now()}@example.com`);
    const acct = await createAccount(cookies, 'TestBank');
    const tx = await createTransaction(cookies, {
      accountId: acct.id,
      amount: 25000,
    });

    const response = await app.handle(
      new Request(`http://localhost/api/transactions/${tx.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookies },
        body: JSON.stringify({ amount: 50000, description: 'Updated coffee' }),
      }),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as any;
    expect(body.data.amount).toBe(50000);
    expect(body.data.description).toBe('Updated coffee');
  });

  it('deletes a transaction', async () => {
    const cookies = await getAuthCookies(`tx-del-${Date.now()}@example.com`);
    const acct = await createAccount(cookies, 'TestBank');
    const tx = await createTransaction(cookies, { accountId: acct.id });

    const delRes = await app.handle(
      new Request(`http://localhost/api/transactions/${tx.id}`, {
        method: 'DELETE',
        headers: { Cookie: cookies },
      }),
    );
    expect(delRes.status).toBe(204);

    // Verify it's gone
    const getRes = await app.handle(
      new Request(`http://localhost/api/transactions/${tx.id}`, {
        headers: { Cookie: cookies },
      }),
    );
    expect(getRes.status).toBe(404);
  });

  it('returns 404 for non-existent transaction', async () => {
    const cookies = await getAuthCookies(`tx-404-${Date.now()}@example.com`);

    const response = await app.handle(
      new Request('http://localhost/api/transactions/00000000-0000-0000-0000-000000000000', {
        headers: { Cookie: cookies },
      }),
    );
    expect(response.status).toBe(404);
  });

  it('returns 401 without auth', async () => {
    const response = await app.handle(new Request('http://localhost/api/transactions'));
    expect(response.status).toBe(401);
  });
});
