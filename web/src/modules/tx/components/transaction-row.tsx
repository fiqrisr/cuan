import { Badge } from '@cuan/ui';
import {
  Apple,
  Car,
  Coffee,
  CreditCard,
  ShoppingBag,
  TrendingUp,
  Utensils,
  Zap,
} from 'lucide-react';
import type { Transaction } from '../types';
import { TransactionAmount } from './transaction-amount';

type Props = {
  transaction: Transaction;
};

const getCategoryIcon = (category: string | null) => {
  if (!category) return CreditCard;
  const cat = category.toLowerCase();
  if (
    cat.includes('food') ||
    cat.includes('dining') ||
    cat.includes('restaurant') ||
    cat.includes('cafe')
  ) {
    return Utensils;
  }
  if (cat.includes('coffee') || cat.includes('beverage')) {
    return Coffee;
  }
  if (
    cat.includes('transport') ||
    cat.includes('travel') ||
    cat.includes('subway') ||
    cat.includes('bus') ||
    cat.includes('train')
  ) {
    return Car;
  }
  if (cat.includes('shopping') || cat.includes('clothes') || cat.includes('purchase')) {
    return ShoppingBag;
  }
  if (cat.includes('groceries') || cat.includes('market') || cat.includes('food store')) {
    return Apple;
  }
  if (
    cat.includes('utility') ||
    cat.includes('utilities') ||
    cat.includes('electricity') ||
    cat.includes('water') ||
    cat.includes('internet')
  ) {
    return Zap;
  }
  if (
    cat.includes('salary') ||
    cat.includes('deposit') ||
    cat.includes('income') ||
    cat.includes('dividend')
  ) {
    return TrendingUp;
  }
  return CreditCard;
};

export function TransactionRow({ transaction: tx }: Props) {
  const isIncome = tx.type === 'income';
  const Icon = getCategoryIcon(tx.category);

  return (
    <div className="glass-panel glass-panel-interactive rounded-lg p-4 flex items-center justify-between gap-4 transition-all">
      <div className="flex items-center gap-3 min-w-0">
        {/* Category Icon */}
        <div
          className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center border ${
            isIncome
              ? 'bg-primary/10 text-primary border-primary/20'
              : 'bg-muted/40 text-muted-foreground border-border/10'
          }`}
        >
          <Icon size={16} />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-sm text-foreground truncate">{tx.description}</span>
          <span className="text-xs text-muted-foreground mt-1">
            {tx.category || 'Uncategorized'}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end shrink-0 gap-1.5">
        <TransactionAmount amount={tx.amount} type={tx.type} />
        {tx.category && <Badge variant="success">AI Categorized</Badge>}
      </div>
    </div>
  );
}
