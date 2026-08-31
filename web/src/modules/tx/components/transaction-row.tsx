import { Button, Input } from '@cuan/ui';
import {
  Apple,
  Car,
  Coffee,
  CreditCard,
  Edit2,
  ShoppingBag,
  Trash2,
  TrendingUp,
  Utensils,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmModal } from '@/components/confirm-modal';
import { useDeleteTransactionMutation } from '../hooks/use-delete-transaction-mutation';
import { useUpdateTransactionMutation } from '../hooks/use-update-transaction-mutation';
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
  const { t } = useTranslation();
  const isIncome = tx.type === 'income';
  const Icon = getCategoryIcon(tx.category);

  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(tx.description);
  const [amount, setAmount] = useState(tx.amount.toString());
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { mutateAsync: deleteTx, isPending: isDeleting } = useDeleteTransactionMutation();
  const { mutateAsync: updateTx, isPending: isUpdating } = useUpdateTransactionMutation();

  const handleSave = async () => {
    if (!description.trim() || !amount) return;
    try {
      await updateTx({
        id: tx.id,
        description: description.trim(),
        amount: Number(amount),
      });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTx(tx.id);
      setShowDeleteModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (isEditing) {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-3 px-3 -mx-3 bg-muted/20 rounded-xl border border-border/10">
        <div className="flex flex-col gap-2 w-full sm:w-auto flex-1">
          <Input
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="h-8 text-sm w-full"
            placeholder={t('common.description')}
            autoFocus
          />
          <Input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="h-8 text-sm w-full font-mono"
            placeholder={t('common.amount')}
          />
        </div>
        <div className="flex items-center gap-2 self-end sm:self-center">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setIsEditing(false);
              setDescription(tx.description);
              setAmount(tx.amount.toString());
            }}
            className="h-8 px-3 text-xs"
          >
            {t('common.cancel')}
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isUpdating}
            className="h-8 px-4 text-xs shadow-tint"
          >
            {isUpdating ? t('common.loading') : t('common.save')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="group flex items-center justify-between gap-4 py-3 sm:py-4 px-2 sm:px-4 -mx-2 sm:-mx-4 hover:bg-muted/30 transition-colors rounded-xl">
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div
            className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border ${
              isIncome
                ? 'bg-primary/5 text-primary border-primary/10'
                : 'bg-muted/30 text-muted-foreground border-border/10'
            }`}
          >
            <Icon size={16} strokeWidth={1.75} />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-foreground truncate">
                {tx.description}
              </span>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-muted-foreground hover:text-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-0.5"
                aria-label={t('common.edit')}
              >
                <Edit2 size={12} />
              </button>
            </div>
            <span className="text-xs text-muted-foreground mt-0.5">
              {tx.category || 'Uncategorized'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="font-mono text-sm font-medium">
            <TransactionAmount amount={tx.amount} type={tx.type} />
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="text-destructive hover:text-destructive/80 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1"
            aria-label={t('common.delete')}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title={t('transactions.deleteConfirmTitle')}
        description={t('transactions.deleteConfirmBody')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        isPending={isDeleting}
        variant="danger"
      />
    </>
  );
}
