import { Elysia, t } from 'elysia';
import { db } from '../lib/db';
import { expenses } from '../db/schema';
import { env } from '../lib/env';
import { authGuard } from '../lib/auth-guard';
import { createOpenModelClient } from '../lib/openmodel';

const openmodel = createOpenModelClient({
  apiKey: env.OPENMODEL_API_KEY,
  baseUrl: env.OPENMODEL_BASE_URL,
  model: env.OPENMODEL_MODEL,
});

export const chatRoutes = new Elysia({ prefix: '/api/chat' }).use(authGuard).post(
  '/',
  async ({ body, user, set }) => {
    const { expense, reply } = await openmodel.chat(body.message);

    const [saved] = await db
      .insert(expenses)
      .values({
        userId: user.id,
        amount: expense.amount.toString(),
        currency: expense.currency,
        category: expense.category,
        description: expense.description,
        date: expense.date,
      })
      .returning();

    set.status = 201;
    return {
      expense: {
        ...saved,
        amount: Number(saved.amount),
      },
      reply,
    };
  },
  {
    auth: true,
    body: t.Object({
      message: t.String({ minLength: 1 }),
    }),
  },
);
