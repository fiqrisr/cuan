import type { Pino as Logger } from 'logixlysia';
import type { ManageAccountResponse } from '../../../lib/openmodel.types';
import { financialAccountService } from '../../financial-account/financial-account.service';
import type { ChatResult } from '../chat.types';

export async function handleManageAccount(
  response: ManageAccountResponse,
  userId: string,
  log: Logger,
): Promise<ChatResult> {
  log.info(
    { event: 'handle_manage_account', action: response.action, accountName: response.accountName },
    'processing manage account intent',
  );
  switch (response.action) {
    case 'create_account':
      return createAccount(response, userId, log);
    case 'set_default':
      return setDefaultAccount(response, userId, log);
    case 'list_accounts':
      return listAccounts(userId, log);
    default:
      return { intent: 'manage_account', reply: 'Aksi tidak dikenali.' };
  }
}

async function createAccount(
  response: ManageAccountResponse,
  userId: string,
  log: Logger,
): Promise<ChatResult> {
  if (!response.accountName) {
    return {
      intent: 'manage_account',
      reply: 'Nama akun diperlukan untuk membuat akun baru.',
    };
  }

  const created = await financialAccountService.create({
    userId,
    name: response.accountName,
    type: response.accountType ?? 'other',
    currency: response.currency ?? 'IDR',
    initialBalance: response.initialBalance,
  });

  log.info(
    { event: 'account_created', accountId: created.id, accountName: created.name },
    'financial account created',
  );
  return {
    intent: 'manage_account',
    reply: response.reply,
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

async function setDefaultAccount(
  response: ManageAccountResponse,
  userId: string,
  log: Logger,
): Promise<ChatResult> {
  if (!response.accountName) {
    log.warn(
      { event: 'set_default_account_failed', reason: 'Missing accountName' },
      'account name required',
    );
    return { intent: 'manage_account', reply: 'Nama akun diperlukan.' };
  }

  const acct = await financialAccountService.getByName(response.accountName, userId);
  log.info(
    { event: 'set_default_account', accountId: acct?.id, accountName: response.accountName },
    'setting default account',
  );
  if (!acct) {
    return {
      intent: 'manage_account',
      reply: `Akun '${response.accountName}' tidak ditemukan.`,
    };
  }

  await financialAccountService.update(acct.id, userId, { isDefault: true });
  return {
    intent: 'manage_account',
    reply: response.reply,
    account: { id: acct.id, name: acct.name, isDefault: true },
  };
}

async function listAccounts(userId: string, log: Logger): Promise<ChatResult> {
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

  if (formatted.length === 0) {
    return {
      intent: 'manage_account',
      reply: 'Belum ada akun keuangan. Buat akun baru dengan chat, contoh: "buat akun BCA bank".',
      accounts: [],
    };
  }

  const lines = formatted.map(
    a =>
      `- ${a.name} (${a.type}): ${a.balance.toLocaleString('id-ID')} ${a.currency}${a.isDefault ? ' ⭐ default' : ''}`,
  );

  return {
    intent: 'manage_account',
    reply: `Daftar akun:\n${lines.join('\n')}`,
    accounts: formatted,
  };
}
