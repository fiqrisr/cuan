import { Badge, Button, Card, CardContent, CardFooter, CardHeader, Input } from '@cuan/ui';
import { Link } from '@tanstack/react-router';
import { ArrowRight, Check, Pencil, Wallet, X } from 'lucide-react';
import { useState } from 'react';
import { useUpdateAccountMutation } from '../hooks/use-update-account-mutation';
import type { FinancialAccount } from '../types';

type AccountCardProps = {
  account: FinancialAccount;
};

export function AccountCard({ account }: AccountCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(account.name);
  const { mutateAsync: updateAccount, isPending: isUpdating } = useUpdateAccountMutation();

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

  return (
    <Card
      className={
        account.isDefault
          ? 'ring-1 ring-primary/25 relative flex flex-col justify-between'
          : 'relative flex flex-col justify-between'
      }
    >
      <div>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="p-2 glass-panel border-primary/20 rounded-xl text-primary shrink-0">
                <Wallet size={16} strokeWidth={1.75} />
              </div>
              {isEditing ? (
                <div className="flex items-center gap-1 flex-1">
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="h-8 text-sm py-1 w-full"
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
                    className="h-8 w-8 text-success shrink-0"
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
                    className="h-8 w-8 text-destructive shrink-0"
                  >
                    <X size={14} />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1 min-w-0 flex-1 group/title">
                  <span className="text-sm font-semibold text-foreground truncate">
                    {account.name}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsEditing(true)}
                    className="h-6 w-6 opacity-0 group-hover/title:opacity-100 focus:opacity-100 transition-opacity shrink-0"
                    title="Rename account"
                  >
                    <Pencil size={12} className="text-muted-foreground hover:text-foreground" />
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {account.isDefault ? (
                <Badge variant="success">Default</Badge>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSetDefault}
                  disabled={isUpdating}
                  className="h-7 px-2 text-[10px] min-w-0 font-medium"
                >
                  Set Default
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="headline-sm text-foreground font-semibold mt-2 data-mono">
            {formatted}
          </div>
        </CardContent>
      </div>
      <CardFooter className="justify-end border-t border-border/10 pt-4 mt-2">
        <Link
          to="/accounts/$accountId/transactions"
          params={{ accountId: account.id }}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline underline-offset-4 transition-colors"
        >
          View transactions
          <ArrowRight size={14} strokeWidth={1.75} />
        </Link>
      </CardFooter>
    </Card>
  );
}
