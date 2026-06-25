import { Elysia, t } from 'elysia';
import { expenses } from '../db/schema';
import { authGuard } from '../lib/auth-guard';
import { db } from '../lib/db';
import { env } from '../lib/env';
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

    const categoryName = expense.category;
    const cat = await db.query.categories.findFirst({
      where: (categories, { eq }) => eq(categories.name, categoryName),
    });

    if (!cat) {
      set.status = 400;
      return { error: `Category '${categoryName}' not found` };
    }

    const [saved] = await db
      .insert(expenses)
      .values({
        userId: user.id,
        amount: expense.amount.toString(),
        currency: expense.currency,
        categoryId: cat.id,
        description: expense.description,
        date: expense.date,
      })
      .returning();

    set.status = 201;
    return {
      expense: {
        ...saved,
        category: cat.name,
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
