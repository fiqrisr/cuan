import type { ManageAccountResponse } from '../../../lib/openmodel.schema';
import { financialAccountService } from '../../financial-account/financial-account.service';
import type { ChatResult } from '../chat.types';

export async function handleManageAccount(
  response: ManageAccountResponse,
  userId: string,
): Promise<ChatResult> {
  switch (response.action) {
    case 'create_account':
      return createAccount(response, userId);
    case 'set_default':
      return setDefaultAccount(response, userId);
    case 'list_accounts':
      return listAccounts(userId);
    default:
      return { intent: 'manage_account', reply: 'Aksi tidak dikenali.' };
  }
}

async function createAccount(response: ManageAccountResponse, userId: string): Promise<ChatResult> {
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
): Promise<ChatResult> {
  if (!response.accountName) {
    return { intent: 'manage_account', reply: 'Nama akun diperlukan.' };
  }

  const acct = await financialAccountService.getByName(response.accountName, userId);
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

async function listAccounts(userId: string): Promise<ChatResult> {
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
