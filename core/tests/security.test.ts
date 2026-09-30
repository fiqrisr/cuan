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
      body: JSON.stringify({ email, password: 'password123', name: 'Security Test' }),
    }),
  );
  return res.headers.getSetCookie().join('; ');
}

describe('Security Hardening & Regression Suite', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  describe('HTTP Security Headers', () => {
    it('sets standard defensive security headers on responses', async () => {
      const res = await app.handle(new Request('http://localhost/'));
      expect(res.headers.get('x-content-type-options')).toBe('nosniff');
      expect(res.headers.get('x-frame-options')).toBe('DENY');
      expect(res.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
      expect(res.headers.get('strict-transport-security')).toContain('max-age=31536000');
    });
  });

  describe('CORS Origin Validation', () => {
    it('does not reflect untrusted origins with credentials', async () => {
      const res = await app.handle(
        new Request('http://localhost/', {
          headers: { Origin: 'https://evil-attacker.com' },
        }),
      );
      expect(res.headers.get('access-control-allow-origin')).toBeNull();
    });

    it('allows trusted development origins with credentials', async () => {
      const res = await app.handle(
        new Request('http://localhost/auth/api/get-session', {
          headers: { Origin: 'http://localhost:5173' },
        }),
      );
      expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:5173');
      expect(res.headers.get('access-control-allow-credentials')).toBe('true');
    });
  });

  describe('IDOR & Cross-Tenant Balance Protection', () => {
    it('prevents User A from creating a transaction against User B account', async () => {
      const userACookies = await getAuthCookies('userA@example.com');
      const userBCookies = await getAuthCookies('userB@example.com');

      // User B creates an account with 1,000,000 balance
      const createAcctRes = await app.handle(
        new Request('http://localhost/api/financial-accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: userBCookies },
          body: JSON.stringify({ name: 'UserB Vault', type: 'bank', initialBalance: 1000000 }),
        }),
      );
      expect(createAcctRes.status).toBe(201);
      const userBAccount = ((await createAcctRes.json()) as { data: { id: string } }).data;

      // Ensure global category exists
      let globalCat = await db.query.categories.findFirst({
        where: (c, { eq }) => eq(c.name, 'food'),
      });
      if (!globalCat) {
        const [inserted] = await db
          .insert(categories)
          .values({ name: 'food', label: 'Food & Dining' })
          .returning();
        globalCat = inserted;
      }

      // User A attempts to create an expense targeting User B's account
      const attackRes = await app.handle(
        new Request('http://localhost/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: userACookies },
          body: JSON.stringify({
            type: 'expense',
            amount: 500000,
            categoryId: globalCat.id,
            accountId: userBAccount.id,
            date: '2026-10-01T12:00:00Z',
          }),
        }),
      );

      // Must be rejected with 404 (account not found for user A)
      expect(attackRes.status).toBe(404);
      const attackBody = (await attackRes.json()) as { error: string };
      expect(attackBody.error).toBe('Financial account not found');

      // Verify User B's balance was NOT modified
      const acctCheck = await app.handle(
        new Request('http://localhost/api/financial-accounts', {
          headers: { Cookie: userBCookies },
        }),
      );
      const acctList = ((await acctCheck.json()) as { data: { id: string; balance: number }[] })
        .data;
      const bVault = acctList.find(a => a.id === userBAccount.id);
      expect(bVault?.balance).toBe(1000000);
    });

    it('prevents User A from referencing User B private category', async () => {
      const userACookies = await getAuthCookies('userA-cat@example.com');
      const userBCookies = await getAuthCookies('userB-cat@example.com');

      // User B creates a private category
      const createCatRes = await app.handle(
        new Request('http://localhost/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: userBCookies },
          body: JSON.stringify({ name: 'Secret Projects', label: 'Secret Projects' }),
        }),
      );
      expect(createCatRes.status).toBe(201);
      const userBCat = ((await createCatRes.json()) as { data: { id: number } }).data;

      // User A creates their own account
      const acctRes = await app.handle(
        new Request('http://localhost/api/financial-accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: userACookies },
          body: JSON.stringify({ name: 'UserA Wallet', type: 'cash', initialBalance: 50000 }),
        }),
      );
      const userAAccount = ((await acctRes.json()) as { data: { id: string } }).data;

      // User A attempts to link transaction to User B's private category
      const attackRes = await app.handle(
        new Request('http://localhost/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: userACookies },
          body: JSON.stringify({
            type: 'expense',
            amount: 10000,
            categoryId: userBCat.id,
            accountId: userAAccount.id,
            date: '2026-10-01T12:00:00Z',
          }),
        }),
      );

      expect(attackRes.status).toBe(404);
      const attackBody = (await attackRes.json()) as { error: string };
      expect(attackBody.error).toBe('Category not found');
    });
  });

  describe('Input Validation & Boundary Hardening', () => {
    it('rejects oversized chat messages (> 2000 chars) with 422', async () => {
      const cookies = await getAuthCookies('chat-bounds@example.com');
      const oversizedMessage = 'A'.repeat(2001);

      const res = await app.handle(
        new Request('http://localhost/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: cookies },
          body: JSON.stringify({ message: oversizedMessage }),
        }),
      );

      expect(res.status).toBe(422);
      const body = (await res.json()) as { code: string };
      expect(body.code).toBe('VALIDATION_ERROR');
    });

    it('rejects oversized chat history arrays (> 30 items) with 422', async () => {
      const cookies = await getAuthCookies('chat-history-bounds@example.com');
      const oversizedHistory = Array.from({ length: 31 }, (_, i) => ({
        role: 'user' as const,
        content: `Msg ${i}`,
      }));

      const res = await app.handle(
        new Request('http://localhost/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: cookies },
          body: JSON.stringify({ message: 'Hello', history: oversizedHistory }),
        }),
      );

      expect(res.status).toBe(422);
      const body = (await res.json()) as { code: string };
      expect(body.code).toBe('VALIDATION_ERROR');
    });

    it('rejects duplicate categories regardless of whitespace or casing', async () => {
      const cookies = await getAuthCookies('cat-collision@example.com');

      const first = await app.handle(
        new Request('http://localhost/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: cookies },
          body: JSON.stringify({ name: 'Gaming Subscription', label: 'Gaming Subscription' }),
        }),
      );
      expect(first.status).toBe(201);

      // Attempt to create " gaming  subscription "
      const duplicate = await app.handle(
        new Request('http://localhost/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: cookies },
          body: JSON.stringify({
            name: '  gaming   subscription  ',
            label: 'Gaming Subscription',
          }),
        }),
      );
      expect(duplicate.status).toBe(400);
      const body = (await duplicate.json()) as { error: string };
      expect(body.error).toContain('already exists');
    });

    it('rejects transactions with excessive descriptions (> 500 chars)', async () => {
      const cookies = await getAuthCookies('tx-desc-bounds@example.com');

      const res = await app.handle(
        new Request('http://localhost/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: cookies },
          body: JSON.stringify({
            type: 'expense',
            amount: 1000,
            categoryId: 1,
            description: 'x'.repeat(501),
            date: '2026-10-01',
          }),
        }),
      );

      expect(res.status).toBe(422);
      const body = (await res.json()) as { code: string };
      expect(body.code).toBe('VALIDATION_ERROR');
    });
  });
});
