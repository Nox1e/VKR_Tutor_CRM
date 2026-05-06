import { useState, type ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  /** Optional rich block rendered between description and the warning footer */
  body?: ReactNode;
  warning?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  icon?: ReactNode;
  onConfirm: () => void | Promise<void>;
  /** When true, the confirm button shows loading state and is disabled */
  isLoading?: boolean;
  /** When false, the dialog stays open after onConfirm resolves (defaults to true) */
  closeOnConfirm?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  body,
  warning,
  confirmLabel = 'Подтвердить',
  cancelLabel = 'Отмена',
  variant = 'default',
  icon,
  onConfirm,
  isLoading = false,
  closeOnConfirm = true,
}: ConfirmDialogProps) {
  const [submitting, setSubmitting] = useState(false);

  const busy = isLoading || submitting;

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
      if (closeOnConfirm) onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle
            className={cn(
              'flex items-center gap-2',
              variant === 'destructive' && 'text-red-600',
            )}
          >
            {icon}
            {title}
          </AlertDialogTitle>
          {description ? (
            <AlertDialogDescription className="space-y-3">
              {description}
            </AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>

        {body ? <div className="space-y-3">{body}</div> : null}
        {warning ? <div className="text-sm text-red-600">{warning}</div> : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              handleConfirm();
            }}
            disabled={busy}
            className={cn(
              variant === 'destructive' && 'bg-red-600 hover:bg-red-700 focus:ring-red-600',
            )}
          >
            {busy ? '...' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
