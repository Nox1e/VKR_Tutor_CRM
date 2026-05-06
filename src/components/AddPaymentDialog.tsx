import { z } from 'zod';
import { DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormDialog } from '@/components/dialogs/FormDialog';

const schema = z.object({
  lessonsCount: z.coerce.number().int().positive('Должно быть больше нуля'),
  amount: z.coerce.number().positive('Сумма должна быть больше нуля'),
});

type FormValues = z.infer<typeof schema>;

interface AddPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  onAdd: (payment: { studentId: string; lessonsCount: number; amount: number }) => void;
}

export function AddPaymentDialog({ open, onOpenChange, studentId, onAdd }: AddPaymentDialogProps) {
  return (
    <FormDialog<FormValues>
      open={open}
      onOpenChange={onOpenChange}
      title={
        <span className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Добавить оплаченные занятия
        </span>
      }
      schema={schema}
      defaultValues={{ lessonsCount: 1, amount: undefined as unknown as number }}
      contentClassName="max-w-md"
      submitLabel="Добавить оплату"
      onSubmit={(values) => {
        const v = values as Required<FormValues>;
        onAdd({ studentId, lessonsCount: v.lessonsCount, amount: v.amount });
      }}
    >
      {(form) => {
        const lessonsCount = Number(form.watch('lessonsCount')) || 0;
        const amount = Number(form.watch('amount')) || 0;
        const showCost = lessonsCount > 0 && amount > 0;

        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="lessonsCount">Количество занятий</Label>
              <Input
                id="lessonsCount"
                type="number"
                min={1}
                {...form.register('lessonsCount', { valueAsNumber: true })}
              />
              {form.formState.errors.lessonsCount ? (
                <p className="text-xs text-destructive">
                  {String(form.formState.errors.lessonsCount.message)}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Сумма оплаты (руб.)</Label>
              <Input
                id="amount"
                type="number"
                min={0.01}
                step={0.01}
                placeholder="0.00"
                {...form.register('amount', { valueAsNumber: true })}
              />
              {form.formState.errors.amount ? (
                <p className="text-xs text-destructive">
                  {String(form.formState.errors.amount.message)}
                </p>
              ) : null}
            </div>

            {showCost ? (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Стоимость за занятие:</strong> {Math.round(amount / lessonsCount)} руб.
                </p>
              </div>
            ) : null}
          </>
        );
      }}
    </FormDialog>
  );
}
