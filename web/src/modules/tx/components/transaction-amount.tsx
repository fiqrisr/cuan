import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import type { TransactionType } from '../types';

const formatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
});

type Props = {
  amount: string;
  type: TransactionType;
};

export function TransactionAmount({ amount, type }: Props) {
  const isIncome = type === 'income';
  return (
    <div className="flex items-center justify-end gap-1">
      {isIncome ? (
        <ArrowDownIcon size={14} className="text-success" />
      ) : (
        <ArrowUpIcon size={14} className="text-destructive" />
      )}
      <span
        className={
          isIncome
            ? 'text-success font-semibold data-mono'
            : 'text-body-strong font-semibold data-mono'
        }
      >
        {formatter.format(Number(amount))}
      </span>
    </div>
  );
}
