import { useGetAccountListQuery } from '../hooks/use-get-account-list-query';
import { AccountCard } from '../components/account-card';
import { AccountListSkeleton } from '../components/account-list-skeleton';
import { AccountEmptyState } from '../components/account-empty-state';

export function AccountsPage() {
  const { data, isLoading, isError, error } = useGetAccountListQuery();

  const accounts = Array.isArray(data) ? data : [];

  return (
    <div className='flex flex-col flex-1 min-h-0 overflow-y-auto'>
      <div className='p-4 lg:p-8 max-w-4xl mx-auto w-full flex flex-col gap-6'>
        <div className='flex items-center justify-between'>
          <h1 className='text-2xl font-semibold tracking-tight'>Accounts</h1>
        </div>

        {isLoading && <AccountListSkeleton />}

        {isError && (
          <div role='alert' className='text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-lg'>
            {error instanceof Error ? error.message : 'Failed to load accounts.'}
          </div>
        )}

        {!isLoading && !isError && accounts.length === 0 && <AccountEmptyState />}

        {!isLoading && !isError && accounts.length > 0 && (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4'>
            {accounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
