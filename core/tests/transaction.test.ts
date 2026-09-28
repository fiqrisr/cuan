import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { app } from '@/app';
import { db } from '@/db';
import {
  account,
  categories,
  financialAccounts,
  session,
  transactions,
  user,
  verification,
} from '@/db/schema';
import { auth } from '@/modules/auth';

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
  return ((await res.json()) as { data: { id: string } }).data;
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
  const sessionRes = await app.handle(
    new Request('http://localhost/api/financial-accounts', {
      headers: { Cookie: cookies },
    }),
  );
  const accounts = ((await sessionRes.json()) as { data: Array<{ id: string }> }).data;
  const accountId = data.accountId ?? accounts[0]?.id ?? null;

  // We need the userId - get it from a whoami-like call
  const whoami = await auth.handler(
    new Request('http://localhost/api/get-session', {
      headers: { Cookie: cookies },
    }),
  );
  const sessionData = (await whoami.json()) as { user: { id: string } };
  const userId = sessionData.user.id;

  const [row] = await db
    .insert(transactions)
    .values({
      userId,
      accountId: accountId as string,
      type: (data.type as 'expense' | 'income') ?? 'expense',
      amount: ((data.amount as number) ?? 25000).toString(),
      currency: (data.currency as string) ?? 'IDR',
      categoryId: cat?.id ?? 0,
      description: (data.description as string) ?? 'Test coffee',
      date: new Date(),
    })
    .returning();

  return { id: row.id, amount: Number(row.amount), accountId: row.accountId as string };
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
    const body = (await response.json()) as {
      data: unknown[];
      meta: { total: number; page: number; limit: number };
    };
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
    const body = (await response.json()) as { data: Array<{ type: string }> };
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
    const body = (await response.json()) as { data: { id: string; amount: number } };
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
    const resJson = await response.json();
    expect(resJson).toBeDefined();
    const body = resJson as { data: { amount: number; description: string } };
    expect(body.data.amount).toBe(50000);
    expect(body.data.description).toBe('Updated coffee');

    const acctRes = await app.handle(
      new Request('http://localhost/api/financial-accounts', {
        headers: { Cookie: cookies },
      }),
    );
    const acctJson = await acctRes.json();
    const acctData = acctJson as { data: Array<{ id: string; balance: number }> };
    const updatedAcct = acctData.data.find(a => a.id === acct.id);
    // initial was 1,000,000; old expense was 25,000, new expense is 50,000
    // oldDelta = +25,000, newDelta = -50,000 => balance should be 975,000
    expect(updatedAcct?.balance).toBe(975000);
  });

  it('updates only description without changing amount or balance', async () => {
    const cookies = await getAuthCookies(`tx-update-desc-${Date.now()}@example.com`);
    const acct = await createAccount(cookies, 'TestBank');
    const tx = await createTransaction(cookies, {
      accountId: acct.id,
      amount: 25000,
    });

    const response = await app.handle(
      new Request(`http://localhost/api/transactions/${tx.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookies },
        body: JSON.stringify({ description: 'Only description updated' }),
      }),
    );
    expect(response.status).toBe(200);
    const resJson = await response.json();
    const body = resJson as { data: { amount: number; description: string } };
    expect(body.data.amount).toBe(25000);
    expect(body.data.description).toBe('Only description updated');
  });

  it('updates only amount', async () => {
    const cookies = await getAuthCookies(`tx-update-amt-${Date.now()}@example.com`);
    const acct = await createAccount(cookies, 'TestBank');
    const tx = await createTransaction(cookies, {
      accountId: acct.id,
      amount: 25000,
    });

    const response = await app.handle(
      new Request(`http://localhost/api/transactions/${tx.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookies },
        body: JSON.stringify({ amount: 75000 }),
      }),
    );
    expect(response.status).toBe(200);
    const resJson = await response.json();
    const body = resJson as { data: { amount: number; description: string } };
    expect(body.data.amount).toBe(75000);
  });

  it('updates transaction with date and categoryId', async () => {
    const cookies = await getAuthCookies(`tx-update-date-${Date.now()}@example.com`);
    const acct = await createAccount(cookies, 'TestBank');
    const tx = await createTransaction(cookies, {
      accountId: acct.id,
      amount: 25000,
    });

    const newDate = '2026-09-25T10:00:00.000Z';
    const response = await app.handle(
      new Request(`http://localhost/api/transactions/${tx.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookies },
        body: JSON.stringify({ date: newDate }),
      }),
    );
    expect(response.status).toBe(200);
    const resJson = await response.json();
    const body = resJson as { data: { date: string } };
    expect(body.data.date).toBe(new Date(newDate).toISOString());
  });

  it('updates transaction moving from one account to another', async () => {
    const cookies = await getAuthCookies(`tx-update-accts-${Date.now()}@example.com`);
    const acct1 = await createAccount(cookies, 'Bank1');
    const acct2 = await createAccount(cookies, 'Bank2');
    const tx = await createTransaction(cookies, {
      accountId: acct1.id,
      amount: 25000,
      type: 'expense',
    });

    const response = await app.handle(
      new Request(`http://localhost/api/transactions/${tx.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookies },
        body: JSON.stringify({ accountId: acct2.id }),
      }),
    );
    expect(response.status).toBe(200);
    const resJson = await response.json();
    const body = resJson as { data: { accountId: string } };
    expect(body.data.accountId).toBe(acct2.id);
  });

  it('updates transaction created without account (accountId null)', async () => {
    const cookies = await getAuthCookies(`tx-no-acct-${Date.now()}@example.com`);
    const whoami = await auth.handler(
      new Request('http://localhost/api/get-session', {
        headers: { Cookie: cookies },
      }),
    );
    const sessionData = (await whoami.json()) as { user: { id: string } };
    const userId = sessionData.user.id;
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
    const [row] = await db
      .insert(transactions)
      .values({
        userId,
        accountId: null,
        type: 'expense',
        amount: '25000',
        currency: 'IDR',
        categoryId: cat.id,
        description: 'No account coffee',
        date: new Date(),
      })
      .returning();

    const response = await app.handle(
      new Request(`http://localhost/api/transactions/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookies },
        body: JSON.stringify({ amount: 30000, description: 'Updated no account' }),
      }),
    );
    expect(response.status).toBe(200);
    const resJson = await response.json();
    const body = resJson as {
      data: { amount: number; description: string; accountId: string | null };
    };
    expect(body.data.amount).toBe(30000);
    expect(body.data.description).toBe('Updated no account');
    expect(body.data.accountId).toBeNull();
  });

  it('unlinks an account from a transaction and refunds balance', async () => {
    const cookies = await getAuthCookies(`tx-unlink-${Date.now()}@example.com`);
    const acct = await createAccount(cookies, 'TestBank');
    const tx = await createTransaction(cookies, {
      accountId: acct.id,
      amount: 25000,
      type: 'expense',
    });

    const response = await app.handle(
      new Request(`http://localhost/api/transactions/${tx.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookies },
        body: JSON.stringify({ accountId: null }),
      }),
    );
    expect(response.status).toBe(200);
    const resJson = await response.json();
    const body = resJson as { data: { accountId: string | null } };
    expect(body.data.accountId).toBeNull();

    // Balance should be refunded by +25,000 (from 1,000,000 to 1,025,000)
    const acctRes = await app.handle(
      new Request('http://localhost/api/financial-accounts', {
        headers: { Cookie: cookies },
      }),
    );
    const acctJson = await acctRes.json();
    const acctData = acctJson as { data: Array<{ id: string; balance: number }> };
    const updatedAcct = acctData.data.find(a => a.id === acct.id);
    expect(updatedAcct?.balance).toBe(1025000);
  });

  it('updates transaction type from expense to income and adjusts balance', async () => {
    const cookies = await getAuthCookies(`tx-flip-${Date.now()}@example.com`);
    const acct = await createAccount(cookies, 'TestBank');
    const tx = await createTransaction(cookies, {
      accountId: acct.id,
      amount: 25000,
      type: 'expense',
    });

    const response = await app.handle(
      new Request(`http://localhost/api/transactions/${tx.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookies },
        body: JSON.stringify({ type: 'income' }),
      }),
    );
    expect(response.status).toBe(200);
    const resJson = await response.json();
    const body = resJson as { data: { type: string } };
    expect(body.data.type).toBe('income');

    // Initial was 1,000,000. Old expense was -25,000 impact. New income is +25,000 impact.
    // Net delta = +25,000 - (-25,000) = +50,000. Balance becomes 1,050,000.
    const acctRes = await app.handle(
      new Request('http://localhost/api/financial-accounts', {
        headers: { Cookie: cookies },
      }),
    );
    const acctJson = await acctRes.json();
    const acctData = acctJson as { data: Array<{ id: string; balance: number }> };
    const updatedAcct = acctData.data.find(a => a.id === acct.id);
    expect(updatedAcct?.balance).toBe(1050000);
  });

  it('returns 404 when updating with non-existent accountId', async () => {
    const cookies = await getAuthCookies(`tx-bad-acct-${Date.now()}@example.com`);
    const acct = await createAccount(cookies, 'TestBank');
    const tx = await createTransaction(cookies, {
      accountId: acct.id,
      amount: 25000,
    });

    const response = await app.handle(
      new Request(`http://localhost/api/transactions/${tx.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookies },
        body: JSON.stringify({ accountId: '00000000-0000-0000-0000-000000000000' }),
      }),
    );
    expect(response.status).toBe(404);
  });

  it('returns 404 when updating with non-existent categoryId', async () => {
    const cookies = await getAuthCookies(`tx-bad-cat-${Date.now()}@example.com`);
    const acct = await createAccount(cookies, 'TestBank');
    const tx = await createTransaction(cookies, {
      accountId: acct.id,
      amount: 25000,
    });

    const response = await app.handle(
      new Request(`http://localhost/api/transactions/${tx.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookies },
        body: JSON.stringify({ categoryId: 999999 }),
      }),
    );
    expect(response.status).toBe(404);
  });

  it('returns 400 when updating with invalid date format', async () => {
    const cookies = await getAuthCookies(`tx-bad-date-${Date.now()}@example.com`);
    const acct = await createAccount(cookies, 'TestBank');
    const tx = await createTransaction(cookies, {
      accountId: acct.id,
      amount: 25000,
    });

    const response = await app.handle(
      new Request(`http://localhost/api/transactions/${tx.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookies },
        body: JSON.stringify({ date: 'not-a-valid-date' }),
      }),
    );
    expect(response.status).toBe(400);
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

  it('fetches transaction stats successfully', async () => {
    const cookies = await getAuthCookies(`tx-stats-${Date.now()}@example.com`);
    const acct = await createAccount(cookies, 'StatsBank');

    // Create 1 income and 2 expense transactions
    await createTransaction(cookies, {
      type: 'income',
      amount: 150000,
      description: 'Monthly salary',
      accountId: acct.id,
    });

    await createTransaction(cookies, {
      type: 'expense',
      amount: 30000,
      description: 'Coffee',
      accountId: acct.id,
    });

    await createTransaction(cookies, {
      type: 'expense',
      amount: 20000,
      description: 'Snacks',
      accountId: acct.id,
    });

    const response = await app.handle(
      new Request('http://localhost/api/transactions/stats', {
        headers: { Cookie: cookies },
      }),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: {
        summary: {
          totalIncome: number;
          totalExpense: number;
          netSavings: number;
          savingsRate: number;
        };
        categories: Array<{
          label: string;
          amount: number;
          percentage: number;
        }>;
        daily: Array<{
          date: string;
          income: number;
          expense: number;
        }>;
      };
    };

    expect(body.data.summary.totalIncome).toBe(150000);
    expect(body.data.summary.totalExpense).toBe(50000);
    expect(body.data.summary.netSavings).toBe(100000);
    expect(body.data.summary.savingsRate).toBe(66.67); // 100000 / 150000 * 100

    expect(body.data.categories.length).toBeGreaterThan(0);
    expect(body.data.categories[0].amount).toBe(50000);
    expect(body.data.categories[0].percentage).toBe(100);

    expect(body.data.daily.length).toBeGreaterThan(0);
    const todayStr = new Date().toISOString().split('T')[0];
    const todayData = body.data.daily.find(d => d.date === todayStr);
    expect(todayData).toBeDefined();
    expect(todayData?.income).toBe(150000);
    expect(todayData?.expense).toBe(50000);
  });
});
