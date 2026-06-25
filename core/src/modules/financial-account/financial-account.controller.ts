import { Elysia, t } from 'elysia';
import { authGuard } from '../../lib/auth-guard';
import { AccountError, financialAccountService } from './financial-account.service';

export const financialAccountController = new Elysia({ prefix: '/api/financial-accounts' })
  .use(authGuard)
  .onError(({ error, set }) => {
    if (error instanceof AccountError) {
      set.status = error.statusCode;
      return { error: error.message };
    }
  })
  .get(
    '/',
    async ({ user }) => {
      const accounts = await financialAccountService.getByUserId(user.id);
      return { data: accounts.map(formatAccount) };
    },
    { auth: true },
  )
  .post(
    '/',
    async ({ body, user, set }) => {
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
      body: t.Object({
        name: t.String({ minLength: 1 }),
        type: t.Union([
          t.Literal('bank'),
          t.Literal('e-wallet'),
          t.Literal('cash'),
          t.Literal('other'),
        ]),
        currency: t.Optional(t.String({ minLength: 3, maxLength: 3 })),
        initialBalance: t.Optional(t.Number({ minimum: 0 })),
      }),
    },
  )
  .patch(
    '/:id',
    async ({ params, body, user }) => {
      const updated = await financialAccountService.update(params.id, user.id, body);
      return { data: formatAccount(updated) };
    },
    {
      auth: true,
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1 })),
        type: t.Optional(
          t.Union([
            t.Literal('bank'),
            t.Literal('e-wallet'),
            t.Literal('cash'),
            t.Literal('other'),
          ]),
        ),
        isDefault: t.Optional(t.Boolean()),
      }),
    },
  )
  .delete(
    '/:id',
    async ({ params, user, set }) => {
      await financialAccountService.remove(params.id, user.id);
      set.status = 204;
    },
    {
      auth: true,
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
    },
  );

interface FormattedAccount {
  id: string;
  name: string;
  type: string;
  currency: string;
  balance: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

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
