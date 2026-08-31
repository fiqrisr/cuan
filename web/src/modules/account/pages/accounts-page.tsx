import { Button, Input } from '@cuan/ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccountCard } from '../components/account-card';
import { AccountEmptyState } from '../components/account-empty-state';
import { AccountListSkeleton } from '../components/account-list-skeleton';
import { useCreateAccountMutation } from '../hooks/use-create-account-mutation';
import { useGetAccountListQuery } from '../hooks/use-get-account-list-query';

export function AccountsPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, error } = useGetAccountListQuery();
  const { mutateAsync: createAccount, isPending: isCreating } = useCreateAccountMutation();
  const [isCreatingMode, setIsCreatingMode] = useState(false);
  const [newName, setNewName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const accounts = data?.data ?? [];

  const handleCreate = async () => {
    const label = newName.trim();
    if (!label) return;
    try {
      setCreateError(null);
      await createAccount({ name: label, type: 'bank', currency: 'IDR', initialBalance: 0 });
      setIsCreatingMode(false);
      setNewName('');
    } catch (err) {
      console.error(err);
      setCreateError(err instanceof Error ? err.message : 'Failed to create account');
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
      <div className="px-5 pt-10 pb-28 lg:pb-10 sm:px-8 lg:px-16 xl:px-20 max-w-[1440px] mx-auto w-full flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-3 border-b border-border/10">
          <div>
            <h1 className="display-lg-mobile lg:headline-md text-foreground">
              {t('accounts.title')}
            </h1>
            <p className="body-md text-muted-foreground mt-2 prose-short">
              {t('accounts.subtitle')}
            </p>
          </div>
          <Button onClick={() => setIsCreatingMode(true)} disabled={isCreatingMode || isLoading}>
            + {t('accounts.addAccount')}
          </Button>
        </div>

        {isCreatingMode && (
          <div className="border border-border/20 rounded-lg p-5 flex flex-col gap-4 bg-muted/10 max-w-xl">
            <div>
              <label
                htmlFor="new-account-name"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
              >
                {t('accounts.accountName')}
              </label>
              <Input
                id="new-account-name"
                placeholder="e.g. Main Bank, E-Wallet"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="mt-1.5"
                autoFocus
              />
            </div>
            {createError && <p className="text-sm text-destructive font-semibold">{createError}</p>}
            <div className="flex justify-end gap-3 mt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsCreatingMode(false);
                  setNewName('');
                  setCreateError(null);
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? t('common.loading') : t('accounts.addAccount')}
              </Button>
            </div>
          </div>
        )}

        {isLoading && <AccountListSkeleton />}

        {isError && (
          <div
            role="alert"
            className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded"
          >
            {error instanceof Error ? error.message : 'Failed to load accounts.'}
          </div>
        )}

        {!isLoading && !isError && accounts.length === 0 && !isCreatingMode && (
          <AccountEmptyState />
        )}

        {!isLoading && !isError && accounts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map(account => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
