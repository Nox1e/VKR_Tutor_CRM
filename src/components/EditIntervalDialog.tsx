import { z } from 'zod';
import { TimeInterval } from '@/types';
import { formatTime } from '@/utils/timeUtils';
import { FormDialog } from '@/components/dialogs/FormDialog';

const timePattern = /^([01]?\d|2[0-3]):([0-5]\d)$/;

const schema = z
  .object({
    startTime: z.string().regex(timePattern, 'Формат HH:MM'),
    endTime: z.string().regex(timePattern, 'Формат HH:MM').optional().or(z.literal('')),
  })
  .refine(
    (d) => {
      if (!d.endTime) return true;
      const [sh, sm] = d.startTime.split(':').map(Number);
      const [eh, em] = d.endTime.split(':').map(Number);
      return eh * 60 + em > sh * 60 + sm;
    },
    { message: 'Время окончания должно быть больше времени начала', path: ['endTime'] },
  );

type FormValues = z.infer<typeof schema>;

interface EditIntervalDialogProps {
  interval: TimeInterval | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (intervalId: string, startTime: Date, endTime?: Date) => void;
}

export function EditIntervalDialog({ interval, open, onOpenChange, onSave }: EditIntervalDialogProps) {
  if (!interval) return null;

  const defaultValues = {
    startTime: formatTime(interval.startTime),
    endTime: interval.endTime ? formatTime(interval.endTime) : '',
  };

  return (
    <FormDialog<FormValues>
      open={open}
      onOpenChange={onOpenChange}
      title="Редактировать интервал"
      schema={schema}
      defaultValues={defaultValues}
      contentClassName="sm:max-w-[400px]"
      submitLabel="Сохранить"
      fields={[
        { name: 'startTime', label: 'Время начала', type: 'time', required: true },
        {
          name: 'endTime',
          label: 'Время окончания',
          type: 'time',
          description: 'Оставьте пустым для активного интервала',
        },
      ]}
      onSubmit={(values) => {
        const v = values as Required<FormValues>;
        const [sh, sm] = v.startTime.split(':').map(Number);
        const startDate = new Date();
        startDate.setHours(sh, sm, 0, 0);

        let endDate: Date | undefined;
        if (v.endTime) {
          const [eh, em] = v.endTime.split(':').map(Number);
          endDate = new Date();
          endDate.setHours(eh, em, 0, 0);
        }

        onSave(interval.id, startDate, endDate);
      }}
    />
  );
}
