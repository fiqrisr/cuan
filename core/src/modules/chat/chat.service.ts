import { transactions } from '../../db/schema';
import { db } from '../../lib/db';
import { env } from '../../lib/env';
import { createOpenModelClient } from '../../lib/openmodel';

const openmodel = createOpenModelClient({
  apiKey: env.OPENMODEL_API_KEY,
  baseUrl: env.OPENMODEL_BASE_URL,
  model: env.OPENMODEL_MODEL,
});

export class ChatService {
  async processChat(message: string, userId: string) {
    const { transaction, reply } = await openmodel.chat(message);

    const categoryName = transaction.category;
    const cat = await db.query.categories.findFirst({
      where: (categories, { eq }) => eq(categories.name, categoryName),
    });

    if (!cat) {
      return { error: `Category '${categoryName}' not found` };
    }

    const [saved] = await db
      .insert(transactions)
      .values({
        userId,
        type: transaction.type,
        amount: transaction.amount.toString(),
        currency: transaction.currency,
        categoryId: cat.id,
        description: transaction.description,
        date: new Date(transaction.date),
      })
      .returning();

    return {
      success: true,
      data: {
        transaction: {
          ...saved,
          category: cat.name,
          amount: Number(saved.amount),
        },
        reply,
      },
    };
  }
}

export const chatService = new ChatService();
