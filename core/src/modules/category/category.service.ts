import { and, eq, isNull, or } from 'drizzle-orm';
import { db } from '@/db';
import { categories } from './category.schema';

export class CategoryService {
  async getUserCategories(userId: string) {
    return db
      .select()
      .from(categories)
      .where(or(eq(categories.userId, userId), isNull(categories.userId)));
  }

  async getByName(name: string, userId: string) {
    return db.query.categories.findFirst({
      where: and(
        eq(categories.name, name),
        or(eq(categories.userId, userId), isNull(categories.userId)),
      ),
    });
  }

  async create(data: { name: string; label: string; userId: string }) {
    const [created] = await db.insert(categories).values(data).returning();
    return created;
  }

  async update(id: number, userId: string, data: { name?: string; label?: string }) {
    const [updated] = await db
      .update(categories)
      .set(data)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning();
    return updated;
  }
}

export const categoryService = new CategoryService();
