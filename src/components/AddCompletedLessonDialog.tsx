import { z } from 'zod';
import { Plus } from 'lucide-react';
import { FormDialog } from '@/components/dialogs/FormDialog';

const timePattern = /^([01]?\d|2[0-3]):([0-5]\d)$/;

const schema = z
  .object({
    startDate: z.string().min(1, 'Укажите дату'),
    startTime: z.string().regex(timePattern, 'Формат HH:MM'),
    endTime: z.string().regex(timePattern, 'Формат HH:MM'),
    meetLink: z.string().optional().or(z.literal('')),
    comment: z.string().optional().or(z.literal('')),
  })
  .refine(
    (d) => new Date(`${d.startDate}T${d.startTime}`) < new Date(),
    { message: 'Дата урока должна быть в прошлом', path: ['startDate'] },
  )
  .refine(
    (d) => new Date(`${d.startDate}T${d.endTime}`) > new Date(`${d.startDate}T${d.startTime}`),
    { message: 'Время окончания должно быть после времени начала', path: ['endTime'] },
  );

type FormValues = z.infer<typeof schema>;

interface AddCompletedLessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  onAdd: (lesson: {
    studentId: string;
    startTime: Date;
    endTime: Date;
    meetLink?: string;
    comment?: string;
    status: 'archived';
  }) => void;
}

export function AddCompletedLessonDialog({
  open,
  onOpenChange,
  studentId,
  onAdd,
}: AddCompletedLessonDialogProps) {
  return (
    <FormDialog<FormValues>
      open={open}
      onOpenChange={onOpenChange}
      title={
        <span className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Добавить проведенный урок
        </span>
      }
      schema={schema}
      defaultValues={{ startDate: '', startTime: '', endTime: '', meetLink: '', comment: '' }}
      contentClassName="max-w-md"
      submitLabel="Добавить урок"
      fields={[
        { name: 'startDate', label: 'Дата урока', type: 'date', required: true, colSpan: 2 },
        { name: 'startTime', label: 'Время начала', type: 'time', required: true },
        { name: 'endTime', label: 'Время окончания', type: 'time', required: true },
        { name: 'meetLink', label: 'Ссылка на встречу (необязательно)', type: 'url', placeholder: 'https://meet.google.com/…', colSpan: 2 },
        { name: 'comment', label: 'Комментарий (необязательно)', type: 'textarea', placeholder: 'Дополнительная информация об уроке…', rows: 3, colSpan: 2 },
      ]}
      layout="grid-2"
      onSubmit={(values) => {
        const v = values as Required<FormValues>;
        onAdd({
          studentId,
          startTime: new Date(`${v.startDate}T${v.startTime}`),
          endTime: new Date(`${v.startDate}T${v.endTime}`),
          meetLink: v.meetLink || undefined,
          comment: v.comment || undefined,
          status: 'archived',
        });
      }}
    />
  );
}
