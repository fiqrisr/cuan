import type { z } from 'zod';
import { BadRequestError } from '@/lib/error';
import { logger } from '@/middleware/logger';
import { financialAccountService } from '@/modules/financial-account/financial-account.service';
import type { manageAccountActionSchema } from '../chat.ai-schema';

type ManageAccountParams = {
  action: z.infer<typeof manageAccountActionSchema>;
  accountName?: string;
  accountType?: string;
  currency?: string;
  initialBalance?: number;
};

export async function handleManageAccount(params: ManageAccountParams, userId: string) {
  logger.info(
    { event: 'handle_manage_account', action: params.action, accountName: params.accountName },
    'processing manage account intent',
  );
  switch (params.action) {
    case 'create_account':
      return createAccount(params, userId);
    case 'set_default':
      return setDefaultAccount(params, userId);
    case 'list_accounts':
      return listAccounts(userId);
    default:
      throw new BadRequestError('Action not recognized.');
  }
}

async function createAccount(params: ManageAccountParams, userId: string) {
  if (!params.accountName) {
    throw new BadRequestError('Account name is required to create a new account.');
  }

  const created = await financialAccountService.create({
    userId,
    name: params.accountName,
    type: params.accountType ?? 'other',
    currency: params.currency ?? 'IDR',
    initialBalance: params.initialBalance,
  });

  logger.info(
    { event: 'account_created', accountId: created.id, accountName: created.name },
    'financial account created',
  );

  return {
    account: {
      id: created.id,
      name: created.name,
      type: created.type,
      currency: created.currency,
      balance: Number(created.balance),
      isDefault: created.isDefault,
    },
  };
}

async function setDefaultAccount(params: ManageAccountParams, userId: string) {
  if (!params.accountName) {
    logger.warn(
      { event: 'set_default_account_failed', reason: 'Missing accountName' },
      'account name required',
    );
    throw new BadRequestError('Account name is required.');
  }

  const acct = await financialAccountService.getByName(params.accountName, userId);
  logger.info(
    { event: 'set_default_account', accountId: acct?.id, accountName: params.accountName },
    'setting default account',
  );
  if (!acct) {
    throw new BadRequestError(`Account '${params.accountName}' not found.`);
  }

  await financialAccountService.update(acct.id, userId, { isDefault: true });
  return {
    account: { id: acct.id, name: acct.name, isDefault: true },
  };
}

async function listAccounts(userId: string) {
  logger.info({ event: 'list_accounts', userId }, 'listing financial accounts');
  const accounts = await financialAccountService.getByUserId(userId);
  const formatted = accounts.map(a => ({
    id: a.id,
    name: a.name,
    type: a.type,
    currency: a.currency,
    balance: Number(a.balance),
    isDefault: a.isDefault,
  }));

  return { accounts: formatted };
}
