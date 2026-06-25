import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { app } from '../src/app';
import {
  account,
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

async function signUp(email: string): Promise<Response> {
  return auth.handler(
    new Request('http://localhost/api/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: 'password123',
        name: 'FA Test',
      }),
    }),
  );
}

async function getAuthCookies(email: string): Promise<string> {
  const res = await signUp(email);
  return res.headers.getSetCookie().join('; ');
}

describe('Financial Accounts API', () => {
  beforeEach(clearDatabase);
  afterEach(clearDatabase);

  it('creates a financial account', async () => {
    const cookies = await getAuthCookies(`fa-create-${Date.now()}@example.com`);

    const response = await app.handle(
      new Request('http://localhost/api/financial-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookies },
        body: JSON.stringify({
          name: 'BCA',
          type: 'bank',
          currency: 'IDR',
          initialBalance: 5000000,
        }),
      }),
    );

    expect(response.status).toBe(201);
    const body = (await response.json()) as unknown as {
      data: { name: string; type: string; balance: number; isDefault: boolean };
    };
    expect(body.data.name).toBe('BCA');
    expect(body.data.type).toBe('bank');
    expect(body.data.balance).toBe(5000000);
    expect(body.data.isDefault).toBe(true); // first account is auto-default
  });

  it('lists accounts for the user', async () => {
    const cookies = await getAuthCookies(`fa-list-${Date.now()}@example.com`);

    // Create two accounts
    await app.handle(
      new Request('http://localhost/api/financial-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookies },
        body: JSON.stringify({ name: 'BCA', type: 'bank' }),
      }),
    );
    await app.handle(
      new Request('http://localhost/api/financial-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookies },
        body: JSON.stringify({ name: 'GoPay', type: 'e-wallet' }),
      }),
    );

    const response = await app.handle(
      new Request('http://localhost/api/financial-accounts', {
        headers: { Cookie: cookies },
      }),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as unknown as { data: unknown[] };
    expect(body.data).toHaveLength(2);
  });

  it('sets a new default account', async () => {
    const cookies = await getAuthCookies(`fa-default-${Date.now()}@example.com`);

    const res1 = await app.handle(
      new Request('http://localhost/api/financial-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookies },
        body: JSON.stringify({ name: 'BCA', type: 'bank' }),
      }),
    );
    const bca = ((await res1.json()) as unknown as { data: { isDefault: boolean; id: string } })
      .data;
    expect(bca.isDefault).toBe(true);

    const res2 = await app.handle(
      new Request('http://localhost/api/financial-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookies },
        body: JSON.stringify({ name: 'GoPay', type: 'e-wallet' }),
      }),
    );
    const gopay = ((await res2.json()) as unknown as { data: { id: string } }).data;

    // Set GoPay as default
    const patchRes = await app.handle(
      new Request(`http://localhost/api/financial-accounts/${gopay.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookies },
        body: JSON.stringify({ isDefault: true }),
      }),
    );
    expect(patchRes.status).toBe(200);
    const updated = ((await patchRes.json()) as unknown as { data: { isDefault: boolean } }).data;
    expect(updated.isDefault).toBe(true);

    // BCA should no longer be default
    const listRes = await app.handle(
      new Request('http://localhost/api/financial-accounts', {
        headers: { Cookie: cookies },
      }),
    );
    const all = (
      (await listRes.json()) as unknown as { data: Array<{ name: string; isDefault: boolean }> }
    ).data;
    const bcaAccount = all.find((a: { name: string }) => a.name === 'BCA');
    expect(bcaAccount?.isDefault).toBe(false);
  });

  it('prevents deleting the default account', async () => {
    const cookies = await getAuthCookies(`fa-del-default-${Date.now()}@example.com`);

    const res = await app.handle(
      new Request('http://localhost/api/financial-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookies },
        body: JSON.stringify({ name: 'Cash', type: 'cash' }),
      }),
    );
    const acct = ((await res.json()) as unknown as { data: { id: string } }).data;

    const delRes = await app.handle(
      new Request(`http://localhost/api/financial-accounts/${acct.id}`, {
        method: 'DELETE',
        headers: { Cookie: cookies },
      }),
    );
    expect(delRes.status).toBe(400);
  });

  it('prevents duplicate account names', async () => {
    const cookies = await getAuthCookies(`fa-dup-${Date.now()}@example.com`);

    await app.handle(
      new Request('http://localhost/api/financial-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookies },
        body: JSON.stringify({ name: 'BCA', type: 'bank' }),
      }),
    );

    const res = await app.handle(
      new Request('http://localhost/api/financial-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookies },
        body: JSON.stringify({ name: 'BCA', type: 'bank' }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 401 without auth', async () => {
    const response = await app.handle(new Request('http://localhost/api/financial-accounts'));
    expect(response.status).toBe(401);
  });
});
