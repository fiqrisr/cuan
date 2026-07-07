import { AccountCard } from '../components/account-card';
import { AccountEmptyState } from '../components/account-empty-state';
import { AccountListSkeleton } from '../components/account-list-skeleton';
import { useGetAccountListQuery } from '../hooks/use-get-account-list-query';

export function AccountsPage() {
  const { data, isLoading, isError, error } = useGetAccountListQuery();

  const accounts = data?.data ?? [];

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
      <div className="px-5 py-12 sm:px-16 max-w-[1440px] mx-auto w-full flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2 border-b border-border/10">
          <div>
            <h1 className="headline-md text-foreground tracking-tight">Accounts</h1>
            <p className="body-md text-muted-foreground mt-1">
              Manage your financial assets and balances
            </p>
          </div>
        </div>

        {isLoading && <AccountListSkeleton />}

        {isError && (
          <div
            role="alert"
            className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded"
          >
            {error instanceof Error ? error.message : 'Failed to load accounts.'}
          </div>
        )}

        {!isLoading && !isError && accounts.length === 0 && <AccountEmptyState />}

        {!isLoading && !isError && accounts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {accounts.map(account => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
