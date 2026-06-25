import { t } from 'elysia';

export const FormattedFinancialAccountDto = t.Object({
  id: t.String(),
  name: t.String(),
  type: t.String(),
  currency: t.String(),
  balance: t.Number(),
  isDefault: t.Boolean(),
  createdAt: t.String(),
  updatedAt: t.String(),
});

export const CreateFinancialAccountRequestDto = t.Object({
  name: t.String({ minLength: 1 }),
  type: t.Union([t.Literal('bank'), t.Literal('e-wallet'), t.Literal('cash'), t.Literal('other')]),
  currency: t.Optional(t.String({ minLength: 3, maxLength: 3 })),
  initialBalance: t.Optional(t.Number({ minimum: 0 })),
});

export type CreateFinancialAccountRequest = typeof CreateFinancialAccountRequestDto.static;

export const UpdateFinancialAccountRequestDto = t.Object({
  name: t.Optional(t.String({ minLength: 1 })),
  type: t.Optional(
    t.Union([t.Literal('bank'), t.Literal('e-wallet'), t.Literal('cash'), t.Literal('other')]),
  ),
  isDefault: t.Optional(t.Boolean()),
});

export type UpdateFinancialAccountRequest = typeof UpdateFinancialAccountRequestDto.static;

export const GetFinancialAccountsResponseDto = t.Object({
  data: t.Array(FormattedFinancialAccountDto),
});

export type GetFinancialAccountsResponse = typeof GetFinancialAccountsResponseDto.static;

export const FinancialAccountResponseDto = t.Object({
  data: FormattedFinancialAccountDto,
});

export type FinancialAccountResponse = typeof FinancialAccountResponseDto.static;
