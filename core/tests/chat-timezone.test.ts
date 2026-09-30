import { beforeEach, describe, expect, it } from 'bun:test';
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
import {
  extractedTransactionSchema,
  transferFundsSchema,
  updateTransactionSchema,
} from '@/modules/chat/chat.ai-schema';
import { formatLocalDate, getSystemPrompt } from '@/modules/chat/chat.prompt';
import { handleAddTransaction } from '@/modules/chat/handlers/add-transaction.handler';
import { handleQuery } from '@/modules/chat/handlers/query.handler';
import { handleTransferFunds } from '@/modules/chat/handlers/transfer-funds.handler';
import { handleUpdateTransaction } from '@/modules/chat/handlers/update-transaction.handler';
import { financialAccountService } from '@/modules/financial-account/financial-account.service';

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

async function signUpUser(email: string): Promise<string> {
  const res = await auth.handler(
    new Request('http://localhost/api/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email,
        password: 'password123',
      }),
    }),
  );
  const data = (await res.json()) as { user?: { id: string } };
  if (!data.user?.id) throw new Error('Failed to sign up user');
  return data.user.id;
}

describe('Chat Timezone Handling', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe('formatLocalDate helper', () => {
    it('formats a UTC instant into user timezone local date (YYYY-MM-DD)', () => {
      // 2026-09-30 19:18:00 UTC is 2026-10-01 02:18:00 in Asia/Jakarta
      const utcIso = '2026-09-30T19:18:00.000Z';
      expect(formatLocalDate(utcIso, 'Asia/Jakarta')).toBe('2026-10-01');
      expect(formatLocalDate(utcIso, 'America/New_York')).toBe('2026-09-30');
      expect(formatLocalDate(utcIso, 'UTC')).toBe('2026-09-30');
    });
  });

  describe('AI Schemas with Timezone Offsets', () => {
    it('accepts ISO 8601 strings with timezone offset (+07:00) in extractedTransactionSchema', () => {
      const result = extractedTransactionSchema.shape.date.safeParse('2026-10-01T02:18:00+07:00');
      expect(result.success).toBe(true);
    });

    it('accepts ISO 8601 strings with timezone offset (+07:00) in transferFundsSchema', () => {
      const result = transferFundsSchema.shape.date.safeParse('2026-10-01T14:18:00+07:00');
      expect(result.success).toBe(true);
    });

    it('accepts ISO 8601 strings with timezone offset (+07:00) in updateTransactionSchema', () => {
      const result = updateTransactionSchema.shape.date.safeParse('2026-10-01T14:18:00+07:00');
      expect(result.success).toBe(true);
    });
  });

  describe('getSystemPrompt - Timezone Awareness', () => {
    it('accurately sets User Local Date to 2026-10-01 when UTC is 2026-09-30T19:18:00.000Z in Asia/Jakarta', () => {
      // 1 Oct 2026 02:18 AM in Jakarta is 2026-09-30T19:18:00.000Z in UTC
      const fixedDate = new Date('2026-09-30T19:18:00.000Z');
      const prompt = getSystemPrompt('', '', 'id', 'Asia/Jakarta', fixedDate);

      expect(prompt).toContain('Asia/Jakarta');
      expect(prompt).toContain('2026-10-01');
      expect(prompt).toContain('User Local Date');
      expect(prompt).toContain('User Timezone');
    });

    it('instructs that confirmation date Tanggal must be in user timezone', () => {
      const fixedDate = new Date('2026-09-30T19:18:00.000Z');
      const prompt = getSystemPrompt('', '', 'id', 'Asia/Jakarta', fixedDate);

      expect(prompt.toLowerCase()).toContain('user');
      expect(prompt).toContain('2026-10-01');
    });

    it('accurately handles different global timezones (Tokyo, New York, London, Kolkata)', () => {
      // At 2026-09-30 19:18:00 UTC:
      // - New York (EDT, UTC-4): 2026-09-30 15:18 (Wednesday)
      // - London (BST, UTC+1): 2026-09-30 20:18 (Wednesday)
      // - Kolkata (IST, UTC+5:30): 2026-10-01 00:48 (Thursday)
      // - Tokyo (JST, UTC+9): 2026-10-01 04:18 (Thursday)
      const fixedDate = new Date('2026-09-30T19:18:00.000Z');

      const promptTokyo = getSystemPrompt('', '', 'en', 'Asia/Tokyo', fixedDate);
      expect(promptTokyo).toContain('Asia/Tokyo');
      expect(promptTokyo).toContain('2026-10-01');
      expect(promptTokyo).toContain('Thursday');

      const promptNY = getSystemPrompt('', '', 'en', 'America/New_York', fixedDate);
      expect(promptNY).toContain('America/New_York');
      expect(promptNY).toContain('2026-09-30');
      expect(promptNY).toContain('Wednesday');

      const promptKolkata = getSystemPrompt('', '', 'en', 'Asia/Kolkata', fixedDate);
      expect(promptKolkata).toContain('Asia/Kolkata');
      expect(promptKolkata).toContain('2026-10-01');
      expect(promptKolkata).toContain('UTC+05:30');
    });
  });

  describe('Handlers with Timezone Support', () => {
    it('returns localDate as 2026-10-01 when transaction is created at 2026-10-01T02:18:00+07:00 in Asia/Jakarta', async () => {
      const userId = await signUpUser('tz-add@example.com');
      await financialAccountService.create({
        userId,
        name: 'E-wallet',
        type: 'e-wallet',
        isDefault: true,
      });

      const result = await handleAddTransaction(
        [
          {
            type: 'expense',
            amount: 20000,
            currency: 'IDR',
            category: 'food-beverage',
            description: 'kopi fore',
            date: '2026-10-01T02:18:00+07:00',
          },
        ],
        userId,
        'Asia/Jakarta',
      );

      expect(result.savedTransactions.length).toBe(1);
      const saved = result.savedTransactions[0];
      expect(saved.description).toBe('kopi fore');
      expect(saved.amount).toBe(20000);
      // The UTC date string stored
      expect(saved.date).toBe('2026-09-30T19:18:00.000Z');
      // The user local date in Asia/Jakarta is 2026-10-01
      expect(saved.localDate).toBe('2026-10-01');
    });

    it('returns localDate as 2026-10-01 when transfer occurs at 2026-10-01T02:18:00+07:00 in Asia/Jakarta', async () => {
      const userId = await signUpUser('tz-transfer@example.com');
      await financialAccountService.create({
        userId,
        name: 'BCA',
        type: 'bank',
        isDefault: true,
      });
      await financialAccountService.create({
        userId,
        name: 'GoPay',
        type: 'e-wallet',
        isDefault: false,
      });

      const result = await handleTransferFunds(
        {
          sourceAccount: 'BCA',
          destinationAccount: 'GoPay',
          amount: 50000,
          date: '2026-10-01T02:18:00+07:00',
        },
        userId,
        'Asia/Jakarta',
      );

      expect(result.transfer.localDate).toBe('2026-10-01');
      expect(result.transfer.transactions[0].localDate).toBe('2026-10-01');
    });

    it('returns localDate as 2026-10-01 on updateTransaction and query', async () => {
      const userId = await signUpUser('tz-update-query@example.com');
      await financialAccountService.create({
        userId,
        name: 'BCA',
        type: 'bank',
        isDefault: true,
      });

      const addResult = await handleAddTransaction(
        [
          {
            type: 'expense',
            amount: 20000,
            currency: 'IDR',
            category: 'food-beverage',
            description: 'kopi',
            date: '2026-10-01T02:18:00+07:00',
          },
        ],
        userId,
        'Asia/Jakarta',
      );
      const txId = addResult.savedTransactions[0].id;

      const updateResult = await handleUpdateTransaction(
        {
          transactionId: txId,
          amount: 25000,
        },
        userId,
        'Asia/Jakarta',
      );
      const updatedTx = updateResult.updatedTransaction as { localDate?: string };
      expect(updatedTx.localDate).toBe('2026-10-01');

      const queryResult = (await handleQuery(
        'recent_transactions',
        { limit: 5 },
        userId,
        'Asia/Jakarta',
      )) as { transactions: Array<{ localDate?: string }> };
      expect(queryResult.transactions[0].localDate).toBe('2026-10-01');
    });
  });
});
