import { Button, Input } from '@cuan/ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetAccountListQuery } from '@/modules/account/hooks/use-get-account-list-query';
import { useGetCategoriesQuery } from '@/modules/profile/hooks/use-get-categories-query';
import { useCreateTransactionMutation } from '../hooks/use-create-transaction-mutation';

type Props = {
  onSuccess: () => void;
  onCancel: () => void;
  defaultAccountId?: string;
};

export function CreateTransactionForm({ onSuccess, onCancel, defaultAccountId }: Props) {
  const { t } = useTranslation();
  const { data: accountsData } = useGetAccountListQuery();
  const { data: categoriesData } = useGetCategoriesQuery();
  const { mutateAsync: createTx, isPending } = useCreateTransactionMutation();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [accountId, setAccountId] = useState(defaultAccountId || '');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  const accounts = accountsData?.data ?? [];
  const categories = categoriesData?.data ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !accountId || !categoryId || !date) {
      setError(t('common.error'));
      return;
    }

    try {
      setError(null);
      await createTx({
        type,
        amount: Number(amount),
        currency: 'IDR',
        categoryId: Number(categoryId),
        description,
        date: new Date(date).toISOString(),
        accountId,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 border border-border/10 rounded-2xl p-5 sm:p-6 bg-background shadow-tint-sm max-w-xl animate-in slide-in-from-top-2 duration-300 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 to-transparent" />

      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground text-sm tracking-tight">
          {t('transactions.addTransaction')}
        </h3>

        <div className="flex bg-muted/40 p-1 rounded-lg border border-border/10">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${type === 'expense' ? 'bg-background shadow-tint text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t('transactions.typeExpense')}
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${type === 'income' ? 'bg-background shadow-tint text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t('transactions.typeIncome')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label
            htmlFor="tx-description"
            className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
          >
            {t('common.description')}
          </label>
          <Input
            id="tx-description"
            placeholder="e.g. Kopi susu"
            value={description}
            onChange={e => setDescription(e.target.value)}
            autoFocus
            className="h-10 text-sm"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="tx-amount"
            className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
          >
            {t('common.amount')}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
              Rp
            </span>
            <Input
              id="tx-amount"
              type="number"
              min="0"
              step="1000"
              placeholder="50000"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="pl-9 h-10 font-mono text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="tx-date"
            className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
          >
            {t('common.date')}
          </label>
          <Input
            id="tx-date"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="h-10 text-sm"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="tx-account"
            className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
          >
            {t('common.account')}
          </label>
          <select
            id="tx-account"
            value={accountId}
            onChange={e => setAccountId(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="" disabled>
              {t('transactions.selectAccount')}
            </option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="tx-category"
            className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
          >
            {t('common.category')}
          </label>
          <select
            id="tx-category"
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="" disabled>
              {t('transactions.selectCategory')}
            </option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive font-medium bg-destructive/10 p-3 rounded-lg">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3 mt-2">
        <Button type="button" variant="ghost" onClick={onCancel} className="h-9 px-4 text-sm">
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isPending} className="h-9 px-6 text-sm shadow-tint">
          {isPending ? t('common.loading') : t('common.save')}
        </Button>
      </div>
    </form>
  );
}
