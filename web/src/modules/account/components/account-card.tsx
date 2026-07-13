import { Badge, Button, Input } from '@cuan/ui';
import { Link } from '@tanstack/react-router';
import { Check, Edit2, Wallet, X } from 'lucide-react';
import { useState } from 'react';
import { ConfirmModal } from '@/components/confirm-modal';
import { useDeleteAccountMutation } from '../hooks/use-delete-account-mutation';
import { useUpdateAccountMutation } from '../hooks/use-update-account-mutation';
import type { FinancialAccount } from '../types';

type AccountCardProps = {
  account: FinancialAccount;
};

export function AccountCard({ account }: AccountCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(account.name);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { mutateAsync: updateAccount, isPending: isUpdating } = useUpdateAccountMutation();
  const { mutateAsync: deleteAccount, isPending: isDeleting } = useDeleteAccountMutation();

  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: account.currency || 'IDR',
    minimumFractionDigits: 0,
  }).format(account.balance);

  const handleSaveName = async () => {
    if (!name.trim()) return;
    try {
      await updateAccount({ id: account.id, name: name.trim() });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetDefault = async () => {
    try {
      await updateAccount({ id: account.id, isDefault: true });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAccount(account.id);
      setShowDeleteModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div
        className={`relative flex flex-col justify-between p-5 rounded-2xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md ${account.isDefault ? 'border-primary/30 ring-1 ring-primary/20' : 'border-border/10'}`}
      >
        <div>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Wallet size={18} strokeWidth={1.75} />
              </div>

              {isEditing ? (
                <div className="flex items-center gap-1.5 flex-1">
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="h-8 text-sm py-1 max-w-[140px] sm:max-w-[200px]"
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') {
                        setIsEditing(false);
                        setName(account.name);
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleSaveName}
                    disabled={isUpdating}
                    className="h-8 w-8 text-success hover:text-success/80 shrink-0"
                  >
                    <Check size={14} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setIsEditing(false);
                      setName(account.name);
                    }}
                    className="h-8 w-8 text-destructive hover:text-destructive/80 shrink-0"
                  >
                    <X size={14} />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-foreground truncate">
                      {account.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1"
                      aria-label="Edit account name"
                    >
                      <Edit2 size={12} />
                    </button>
                  </div>
                  {account.isDefault && (
                    <Badge variant="success" className="h-5 px-1.5 text-[9px] w-fit mt-0.5">
                      Default
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!account.isDefault && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSetDefault}
                  disabled={isUpdating}
                  className="h-7 px-2 text-[10px] font-medium"
                >
                  Set Default
                </Button>
              )}
            </div>
          </div>

          <div className="font-mono text-2xl font-bold text-foreground tracking-tight mb-6">
            {formatted}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border/10 pt-4 mt-auto">
          <Link
            to="/accounts/$accountId/transactions"
            params={{ accountId: account.id }}
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            View history →
          </Link>

          {!account.isDefault && (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="text-xs font-medium text-destructive hover:text-destructive/80 transition-colors"
            >
              Delete account
            </button>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Account"
        description={`Are you sure you want to delete "${account.name}"? This action cannot be undone and will permanently delete all associated transactions.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        isPending={isDeleting}
        variant="danger"
      />
    </>
  );
}
