import type { Pino as Logger } from 'logixlysia';
import type { z } from 'zod';
import type { manageAccountActionSchema } from '../../../lib/openmodel.schema';
import { financialAccountService } from '../../financial-account/financial-account.service';

type ManageAccountParams = {
  action: z.infer<typeof manageAccountActionSchema>;
  accountName?: string;
  accountType?: string;
  currency?: string;
  initialBalance?: number;
};

export async function handleManageAccount(
  params: ManageAccountParams,
  userId: string,
  log: Logger,
) {
  log.info(
    { event: 'handle_manage_account', action: params.action, accountName: params.accountName },
    'processing manage account intent',
  );
  switch (params.action) {
    case 'create_account':
      return createAccount(params, userId, log);
    case 'set_default':
      return setDefaultAccount(params, userId, log);
    case 'list_accounts':
      return listAccounts(userId, log);
    default:
      throw new Error('Aksi tidak dikenali.');
  }
}

async function createAccount(params: ManageAccountParams, userId: string, log: Logger) {
  if (!params.accountName) {
    throw new Error('Nama akun diperlukan untuk membuat akun baru.');
  }

  const created = await financialAccountService.create({
    userId,
    name: params.accountName,
    type: params.accountType ?? 'other',
    currency: params.currency ?? 'IDR',
    initialBalance: params.initialBalance,
  });

  log.info(
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

async function setDefaultAccount(params: ManageAccountParams, userId: string, log: Logger) {
  if (!params.accountName) {
    log.warn(
      { event: 'set_default_account_failed', reason: 'Missing accountName' },
      'account name required',
    );
    throw new Error('Nama akun diperlukan.');
  }

  const acct = await financialAccountService.getByName(params.accountName, userId);
  log.info(
    { event: 'set_default_account', accountId: acct?.id, accountName: params.accountName },
    'setting default account',
  );
  if (!acct) {
    throw new Error(`Akun '${params.accountName}' tidak ditemukan.`);
  }

  await financialAccountService.update(acct.id, userId, { isDefault: true });
  return {
    account: { id: acct.id, name: acct.name, isDefault: true },
  };
}

async function listAccounts(userId: string, log: Logger) {
  log.info({ event: 'list_accounts', userId }, 'listing financial accounts');
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
