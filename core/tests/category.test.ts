import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { app } from '@/app';
import { db } from '@/db';
import { categories, session, transactions, user } from '@/db/schema';
import { auth } from '@/modules/auth';

async function clearDatabase(): Promise<void> {
  await db.delete(transactions);
  await db.delete(categories);
  await db.delete(session);
  await db.delete(user);

  const cats = [{ name: 'food-beverage', label: 'Makanan & Minuman' }];
  for (const c of cats) {
    await db.insert(categories).values(c);
  }
}

async function signUpAndGetCookies(email: string): Promise<string> {
  const res = await auth.handler(
    new Request('http://localhost/api/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'password123', name: 'Cat Test' }),
    }),
  );
  return res.headers.getSetCookie().join('; ');
}

describe('Category API', () => {
  beforeEach(clearDatabase);
  afterEach(clearDatabase);

  it('lists categories including global ones', async () => {
    const cookies = await signUpAndGetCookies('cat1@example.com');
    const res = await app.handle(
      new Request('http://localhost/api/categories', {
        headers: { Cookie: cookies },
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: { name: string; userId: string | null; id: number }[];
    };
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data.find(c => c.name === 'food-beverage')).toBeDefined();
  });

  it('creates a custom category', async () => {
    const cookies = await signUpAndGetCookies('cat2@example.com');
    const res = await app.handle(
      new Request('http://localhost/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookies },
        body: JSON.stringify({ name: 'custom cat', label: 'Custom Cat' }),
      }),
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as { data: { name: string; label: string } };
    expect(body.data.name).toBe('custom-cat');
    expect(body.data.label).toBe('Custom Cat');
  });

  it('updates a custom category', async () => {
    const cookies = await signUpAndGetCookies('cat3@example.com');

    // create
    const createRes = await app.handle(
      new Request('http://localhost/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookies },
        body: JSON.stringify({ name: 'cat', label: 'Cat' }),
      }),
    );
    const { data: created } = (await createRes.json()) as { data: { id: number } };

    // update
    const updateRes = await app.handle(
      new Request(`http://localhost/api/categories/${created.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookies },
        body: JSON.stringify({ name: 'new cat', label: 'New Cat' }),
      }),
    );
    expect(updateRes.status).toBe(200);
    const { data: updated } = (await updateRes.json()) as { data: { name: string; label: string } };
    expect(updated.name).toBe('new-cat');
    expect(updated.label).toBe('New Cat');
  });

  it('prevents updating a default category', async () => {
    const cookies = await signUpAndGetCookies('cat4@example.com');

    const catsRes = await app.handle(
      new Request('http://localhost/api/categories', {
        headers: { Cookie: cookies },
      }),
    );
    const { data: cats } = (await catsRes.json()) as {
      data: { id: number; userId: string | null }[];
    };
    const defaultCat = cats.find(c => c.userId === null);
    if (!defaultCat) throw new Error('No default category found');

    const updateRes = await app.handle(
      new Request(`http://localhost/api/categories/${defaultCat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookies },
        body: JSON.stringify({ name: 'new cat' }),
      }),
    );
    expect(updateRes.status).toBe(400);
  });

  it('deletes a custom category', async () => {
    const cookies = await signUpAndGetCookies('cat5@example.com');

    // create
    const createRes = await app.handle(
      new Request('http://localhost/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookies },
        body: JSON.stringify({ name: 'cat', label: 'Cat' }),
      }),
    );
    const { data: created } = (await createRes.json()) as { data: { id: number } };

    // delete
    const deleteRes = await app.handle(
      new Request(`http://localhost/api/categories/${created.id}`, {
        method: 'DELETE',
        headers: { Cookie: cookies },
      }),
    );
    expect(deleteRes.status).toBe(204);

    // fetch
    const getRes = await app.handle(
      new Request(`http://localhost/api/categories/${created.id}`, {
        headers: { Cookie: cookies },
      }),
    );
    expect(getRes.status).toBe(404);
  });
});
