import { Elysia, t } from 'elysia';
import { logger } from '@/middleware/logger';
import { authGuard } from '@/modules/auth';
import {
  CreateFinancialAccountRequestDto,
  FinancialAccountResponseDto,
  GetFinancialAccountsResponseDto,
  UpdateFinancialAccountRequestDto,
} from './financial-account.dto';
import { financialAccountService } from './financial-account.service';
import type { FormattedAccount } from './financial-account.types';

export const financialAccountController = new Elysia({ prefix: '/api/financial-accounts' })
  .use(authGuard)
  .get(
    '/',
    async ({ user }) => {
      logger.info({ event: 'get_financial_accounts' }, 'fetching user financial accounts');
      const accounts = await financialAccountService.getByUserId(user.id);
      return { data: accounts.map(formatAccount) };
    },
    {
      auth: true,
      response: GetFinancialAccountsResponseDto,
    },
  )
  .post(
    '/',
    async ({ body, user, set }) => {
      logger.info(
        { event: 'create_financial_account', accountName: body.name },
        'creating financial account',
      );
      const created = await financialAccountService.create({
        userId: user.id,
        name: body.name,
        type: body.type,
        currency: body.currency ?? 'IDR',
        initialBalance: body.initialBalance,
      });
      set.status = 201;
      return { data: formatAccount(created) };
    },
    {
      auth: true,
      body: CreateFinancialAccountRequestDto,
      response: {
        201: FinancialAccountResponseDto,
      },
    },
  )
  .patch(
    '/:id',
    async ({ params, body, user }) => {
      logger.info(
        { event: 'update_financial_account', accountId: params.id, updates: body },
        'updating financial account',
      );
      const updated = await financialAccountService.update(params.id, user.id, body);
      return { data: formatAccount(updated) };
    },
    {
      auth: true,
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: UpdateFinancialAccountRequestDto,
      response: FinancialAccountResponseDto,
    },
  )
  .delete(
    '/:id',
    async ({ params, user, set }) => {
      logger.info(
        { event: 'delete_financial_account', accountId: params.id },
        'deleting financial account',
      );
      await financialAccountService.remove(params.id, user.id);
      set.status = 204;
    },
    {
      auth: true,
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
    },
  );

function formatAccount(a: {
  id: string;
  name: string;
  type: string;
  currency: string;
  balance: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}): FormattedAccount {
  return {
    id: a.id,
    name: a.name,
    type: a.type,
    currency: a.currency,
    balance: Number(a.balance),
    isDefault: a.isDefault,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}
