import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@cuan/ui';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
  variant?: 'danger' | 'warning' | 'default';
};

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  isPending,
  variant = 'danger',
}: ConfirmModalProps) {
  const { t } = useTranslation();
  const resolvedConfirmText = confirmText ?? t('common.confirm');
  const resolvedCancelText = cancelText ?? t('common.cancel');

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        if (!open && !isPending) {
          onCancel();
        }
      }}
    >
      <DialogContent className="max-w-md sm:rounded-2xl p-6">
        <div className="flex items-start mb-1">
          <div
            className={`p-3 rounded-full ${
              variant === 'danger'
                ? 'bg-destructive/10 text-destructive'
                : 'bg-primary/10 text-primary'
            }`}
          >
            <AlertCircle size={24} strokeWidth={2} />
          </div>
        </div>

        <DialogHeader className="space-y-2 text-left">
          <DialogTitle className="text-xl font-semibold text-foreground tracking-tight">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-4">
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            {resolvedCancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={isPending}
            className="w-full sm:w-auto shadow-tint"
          >
            {isPending ? t('common.loading') : resolvedConfirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
