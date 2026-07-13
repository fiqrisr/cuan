import { Button } from '@cuan/ui';
import { AlertCircle, X } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

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
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isPending,
  variant = 'danger',
}: ConfirmModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={!isPending ? onCancel : undefined}
      />
      <div className="relative bg-background border border-border/10 rounded-2xl shadow-2xl w-full max-w-md p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start mb-4">
          <div
            className={`p-3 rounded-full ${variant === 'danger' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}
          >
            <AlertCircle size={24} strokeWidth={2} />
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        <h2 className="text-xl font-semibold text-foreground tracking-tight mb-2">{title}</h2>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">{description}</p>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={isPending}
            className="w-full sm:w-auto shadow-tint"
          >
            {isPending ? 'Confirming...' : confirmText}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
