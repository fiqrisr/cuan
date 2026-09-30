import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { eq } from 'drizzle-orm';
import { app } from '@/app';
import { db } from '@/db';
import {
  account,
  categories,
  chatMessages,
  financialAccounts,
  session,
  transactions,
  user,
  verification,
} from '@/db/schema';
import { auth } from '@/modules/auth';
import { chatService } from '@/modules/chat/chat.service';
import { handleAddTransaction } from '@/modules/chat/handlers/add-transaction.handler';
import { handleDeleteTransaction } from '@/modules/chat/handlers/delete-transaction.handler';
import { handleUpdateTransaction } from '@/modules/chat/handlers/update-transaction.handler';

async function clearDatabase(): Promise<void> {
  await db.delete(chatMessages);
  await db.delete(transactions);
  await db.delete(financialAccounts);
  await db.delete(categories);
  await db.delete(session);
  await db.delete(account);
  await db.delete(verification);
  await db.delete(user);

  const cats = [
    { name: 'food-beverage', label: 'Makanan & Minuman' },
    { name: 'shopping', label: 'Belanja' },
    { name: 'transfer', label: 'Transfer' },
  ];
  for (const c of cats) {
    await db.insert(categories).values(c);
  }
}

async function signUpAndGetCookies(email: string): Promise<{ cookies: string; userId: string }> {
  const res = await auth.handler(
    new Request('http://localhost/api/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'password123', name: 'Memory Test' }),
    }),
  );
  const cookies = res.headers.getSetCookie().join('; ');
  const dbUser = await db.query.user.findFirst({
    where: (u, { eq }) => eq(u.email, email),
  });
  if (!dbUser) throw new Error('User not found in test setup');
  return { cookies, userId: dbUser.id };
}

describe('Chat Conversational Memory & Transaction Correction', () => {
  beforeEach(clearDatabase);
  afterEach(clearDatabase);

  describe('update_transaction tool handler', () => {
    it('updates the last transaction amount and atomically recalculates account balance', async () => {
      const { userId } = await signUpAndGetCookies('update-test@example.com');

      // Create an account with 1,000,000 balance
      const [acc] = await db
        .insert(financialAccounts)
        .values({
          userId,
          name: 'Cash',
          type: 'cash',
          balance: '1000000',
        })
        .returning();

      const cat = await db.query.categories.findFirst({
        where: (c, { eq }) => eq(c.name, 'food-beverage'),
      });

      // User initially recorded 500,000 expense by mistake (Balance becomes 500,000)
      const [tx] = await db
        .insert(transactions)
        .values({
          userId,
          accountId: acc.id,
          type: 'expense',
          amount: '500000',
          currency: 'IDR',
          categoryId: cat?.id ?? 1,
          description: 'Expensive coffee typo',
          date: new Date(),
        })
        .returning();

      // Deduct 500,000 from account balance
      await db
        .update(financialAccounts)
        .set({ balance: '500000' })
        .where(eq(financialAccounts.id, acc.id));

      // User says: "Typo, make it 50k" -> update_transaction with amount: 50000
      const result = await handleUpdateTransaction(
        {
          amount: 50000,
        },
        userId,
      );

      expect(result.updatedTransaction.id).toBe(tx.id);
      expect(result.updatedTransaction.amount).toBe(50000);
      expect(result.updatedTransaction.accountName).toBe('Cash');
      // Verify account balance was adjusted from 500,000 to 950,000 (+450,000 difference)
      const updatedAcc = await db.query.financialAccounts.findFirst({
        where: (fa, { eq }) => eq(fa.id, acc.id),
      });
      expect(Number(updatedAcc?.balance)).toBe(950000);
    });

    it('returns exact accountName on add_transaction when default account is used', async () => {
      const { userId } = await signUpAndGetCookies('add-acct-test@example.com');

      await db.insert(financialAccounts).values({
        userId,
        name: 'Dompet Utama',
        type: 'cash',
        balance: '50000',
        isDefault: true,
      });

      const result = await handleAddTransaction(
        [
          {
            type: 'expense',
            amount: 20000,
            currency: 'IDR',
            category: 'food-beverage',
            description: 'kopi jago',
            date: new Date().toISOString(),
          },
        ],
        userId,
      );

      expect(result.savedTransactions.length).toBe(1);
      expect(result.savedTransactions[0].accountName).toBe('Dompet Utama');
    });

    it('updates account when user switches account name', async () => {
      const { userId } = await signUpAndGetCookies('account-switch@example.com');

      const [cashAcc] = await db
        .insert(financialAccounts)
        .values({
          userId,
          name: 'Cash',
          type: 'cash',
          balance: '100000',
        })
        .returning();

      const [bankAcc] = await db
        .insert(financialAccounts)
        .values({
          userId,
          name: 'BCA',
          type: 'bank',
          balance: '500000',
        })
        .returning();

      const cat = await db.query.categories.findFirst({
        where: (c, { eq }) => eq(c.name, 'food-beverage'),
      });

      // Transaction initially on Cash: 40,000 (Cash balance becomes 60,000)
      await db
        .insert(transactions)
        .values({
          userId,
          accountId: cashAcc.id,
          type: 'expense',
          amount: '40000',
          currency: 'IDR',
          categoryId: cat?.id ?? 1,
          description: 'Lunch',
          date: new Date(),
        })
        .returning();

      await db
        .update(financialAccounts)
        .set({ balance: '60000' })
        .where(eq(financialAccounts.id, cashAcc.id));

      // User says: "Actually it was from BCA"
      await handleUpdateTransaction(
        {
          accountName: 'BCA',
        },
        userId,
      );

      // Cash balance restored to 100,000; BCA balance deducted by 40,000 -> 460,000
      const updatedCash = await db.query.financialAccounts.findFirst({
        where: (fa, { eq }) => eq(fa.id, cashAcc.id),
      });
      const updatedBca = await db.query.financialAccounts.findFirst({
        where: (fa, { eq }) => eq(fa.id, bankAcc.id),
      });

      expect(Number(updatedCash?.balance)).toBe(100000);
      expect(Number(updatedBca?.balance)).toBe(460000);
    });
  });

  describe('delete_transaction tool handler', () => {
    it('deletes the latest transaction and reverses the account balance', async () => {
      const { userId } = await signUpAndGetCookies('delete-test@example.com');

      const [acc] = await db
        .insert(financialAccounts)
        .values({
          userId,
          name: 'GoPay',
          type: 'e-wallet',
          balance: '200000',
        })
        .returning();

      const cat = await db.query.categories.findFirst({
        where: (c, { eq }) => eq(c.name, 'shopping'),
      });

      // Insert transaction of 75,000
      const [tx] = await db
        .insert(transactions)
        .values({
          userId,
          accountId: acc.id,
          type: 'expense',
          amount: '75000',
          currency: 'IDR',
          categoryId: cat?.id ?? 1,
          description: 'Accidental purchase',
          date: new Date(),
        })
        .returning();

      await db
        .update(financialAccounts)
        .set({ balance: '125000' })
        .where(eq(financialAccounts.id, acc.id));

      // User says: "Cancel that last expense"
      const result = await handleDeleteTransaction({}, userId);

      expect(result.deletedTransaction.id).toBe(tx.id);
      expect(result.deletedTransaction.amount).toBe(75000);

      // Transaction should no longer exist in db
      const foundTx = await db.query.transactions.findFirst({
        where: (t, { eq }) => eq(t.id, tx.id),
      });
      expect(foundTx).toBeUndefined();

      // Account balance should be restored to 200,000
      const updatedAcc = await db.query.financialAccounts.findFirst({
        where: (fa, { eq }) => eq(fa.id, acc.id),
      });
      expect(Number(updatedAcc?.balance)).toBe(200000);
    });
  });

  describe('Chat Messages Persistence & Retention', () => {
    it('persists and retrieves messages via GET /api/chat/messages', async () => {
      const { cookies, userId } = await signUpAndGetCookies('persist-test@example.com');

      await chatService.saveMessage(userId, 'user', 'Hello assistant');
      await chatService.saveMessage(userId, 'assistant', 'Hello! How can I help?');

      const res = await app.handle(
        new Request('http://localhost/api/chat/messages', {
          method: 'GET',
          headers: { Cookie: cookies },
        }),
      );

      expect(res.status).toBe(200);
      const json = (await res.json()) as { data: { role: string; content: string }[] };
      expect(json.data.length).toBe(2);
      expect(json.data[0].role).toBe('user');
      expect(json.data[0].content).toBe('Hello assistant');
      expect(json.data[1].role).toBe('assistant');
      expect(json.data[1].content).toBe('Hello! How can I help?');
    });

    it('clears messages via DELETE /api/chat/messages', async () => {
      const { cookies, userId } = await signUpAndGetCookies('clear-test@example.com');

      await chatService.saveMessage(userId, 'user', 'Message 1');
      await chatService.saveMessage(userId, 'assistant', 'Reply 1');

      const delRes = await app.handle(
        new Request('http://localhost/api/chat/messages', {
          method: 'DELETE',
          headers: { Cookie: cookies },
        }),
      );

      expect(delRes.status).toBe(200);

      const getRes = await app.handle(
        new Request('http://localhost/api/chat/messages', {
          method: 'GET',
          headers: { Cookie: cookies },
        }),
      );

      const json = (await getRes.json()) as { data: unknown[] };
      expect(json.data.length).toBe(0);
    });

    it('prunes old messages to maintain maximum 15 messages in retention', async () => {
      const { userId } = await signUpAndGetCookies('retention-test@example.com');

      // Insert 20 messages
      for (let i = 1; i <= 20; i++) {
        await chatService.saveMessage(userId, 'user', `Message number ${i}`);
      }

      const messages = await chatService.getMessages(userId);
      expect(messages.length).toBe(15);

      // The oldest 5 messages (1 to 5) should have been pruned; message 20 must be present
      const contents = messages.map(m => m.content);
      expect(contents).toContain('Message number 20');
      expect(contents).not.toContain('Message number 1');
      expect(contents).not.toContain('Message number 5');
    });

    it('limits conversation history to max 14 prior turns (15 total with user message)', async () => {
      const { userId } = await signUpAndGetCookies('history-limit-test@example.com');
      const anyChatService = chatService as unknown as {
        buildConversationHistory: (
          userId: string,
          history?: { role: 'user' | 'assistant'; content: string }[],
        ) => Promise<{ role: string; content: string }[]>;
      };

      // Test with history array > 15 items
      const clientHistory: { role: 'user' | 'assistant'; content: string }[] = [];
      for (let i = 1; i <= 20; i++) {
        clientHistory.push({
          role: i % 2 === 1 ? 'user' : 'assistant',
          content: `History turn ${i}`,
        });
      }
      const builtFromHistory = await anyChatService.buildConversationHistory(userId, clientHistory);
      expect(builtFromHistory.length).toBe(14);
      expect(builtFromHistory[0].content).toBe('History turn 7');
      expect(builtFromHistory[13].content).toBe('History turn 20');

      // Test with database rows
      for (let i = 1; i <= 15; i++) {
        await chatService.saveMessage(
          userId,
          i % 2 === 1 ? 'user' : 'assistant',
          `DB message ${i}`,
        );
      }
      const builtFromDb = await anyChatService.buildConversationHistory(userId);
      expect(builtFromDb.length).toBe(14);
      expect(builtFromDb[0].content).toBe('DB message 2');
      expect(builtFromDb[13].content).toBe('DB message 15');
    });
  });
});
