import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { Elysia } from 'elysia';
import { z } from 'zod';
import { account, session, transactions, user, verification } from '../src/db/schema';
import { auth } from '../src/lib/auth';
import { authGuard } from '../src/lib/auth-guard';
import { db } from '../src/lib/db';

const testApp = new Elysia()
  .use(authGuard)
  .get('/whoami', ({ user }) => ({ id: user.id, email: user.email }), {
    auth: true,
  });

async function clearDatabase(): Promise<void> {
  await db.delete(transactions);
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
        name: 'Guard Test',
      }),
    }),
  );
}

describe('authGuard', () => {
  beforeEach(clearDatabase);
  afterEach(clearDatabase);

  it('returns 401 when no session cookie is provided', async () => {
    const response = await testApp.handle(new Request('http://localhost/whoami'));

    expect(response.status).toBe(401);
  });

  it('returns the current user when a valid session cookie is provided', async () => {
    const email = `guard-${Date.now()}@example.com`;
    const signUpResponse = await signUp(email);
    expect(signUpResponse.status).toBe(200);

    const cookies = signUpResponse.headers.getSetCookie();
    const response = await testApp.handle(
      new Request('http://localhost/whoami', {
        headers: { Cookie: cookies.join('; ') },
      }),
    );

    expect(response.status).toBe(200);
    const bodySchema = z.object({ id: z.string(), email: z.string() });
    const body = bodySchema.parse(await response.json());
    expect(body.email).toBe(email);
  });
});
