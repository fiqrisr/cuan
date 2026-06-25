import { Elysia, t } from 'elysia';
import { transactions } from '../db/schema';
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
    const { transaction, reply } = await openmodel.chat(body.message);

    const categoryName = transaction.category;
    const cat = await db.query.categories.findFirst({
      where: (categories, { eq }) => eq(categories.name, categoryName),
    });

    if (!cat) {
      set.status = 400;
      return { error: `Category '${categoryName}' not found` };
    }

    const [saved] = await db
      .insert(transactions)
      .values({
        userId: user.id,
        type: transaction.type,
        amount: transaction.amount.toString(),
        currency: transaction.currency,
        categoryId: cat.id,
        description: transaction.description,
        date: new Date(transaction.date),
      })
      .returning();

    set.status = 201;
    return {
      transaction: {
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
