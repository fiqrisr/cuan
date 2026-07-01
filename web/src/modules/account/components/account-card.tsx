import { Card, CardHeader, CardContent, Badge } from '@cuan/ui';
import { Wallet } from 'lucide-react';
import type { FinancialAccount } from '../types';

type AccountCardProps = {
  account: FinancialAccount;
};

export function AccountCard({ account }: AccountCardProps) {
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: account.currency || 'IDR',
    minimumFractionDigits: 0,
  }).format(Number(account.balance));

  return (
    <Card className={account.isDefault ? 'ring-1 ring-primary/30' : ''}>
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <div className='p-2 bg-primary/10 rounded-full text-primary'>
              <Wallet size={20} />
            </div>
            <span className='text-base font-semibold'>{account.name}</span>
          </div>
          {account.isDefault && <Badge variant='success'>Default</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <div className='text-3xl font-bold text-body-strong'>{formatted}</div>
      </CardContent>
    </Card>
  );
}
