import { z } from 'zod';
import { AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormDialog } from '@/components/dialogs/FormDialog';

const schema = z.object({
  count: z.coerce.number().int().min(0, 'Не может быть меньше нуля'),
});

type FormValues = z.infer<typeof schema>;

interface EditPaidLessonsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCount: number;
  onSave: (count: number) => void;
}

export function EditPaidLessonsDialog({
  open,
  onOpenChange,
  currentCount,
  onSave,
}: EditPaidLessonsDialogProps) {
  return (
    <FormDialog<FormValues>
      open={open}
      onOpenChange={onOpenChange}
      title="Редактировать баланс оплаченных занятий"
      description="Изменение баланса напрямую без учета истории оплат"
      schema={schema}
      defaultValues={{ count: currentCount }}
      contentClassName="max-w-md"
      submitLabel="Сохранить"
      onSubmit={(values) => onSave((values as FormValues).count)}
    >
      {(form) => (
        <>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Внимание!</p>
              <p>
                Это действие изменит баланс напрямую, без создания записи в истории оплат.
                Используйте эту функцию только для исправления ошибок.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="count">Баланс оплаченных занятий</Label>
            <Input
              id="count"
              type="number"
              {...form.register('count', { valueAsNumber: true })}
              placeholder="Введите количество"
            />
            <p className="text-sm text-muted-foreground">
              Текущий баланс: <strong>{currentCount}</strong>
            </p>
          </div>
        </>
      )}
    </FormDialog>
  );
}
