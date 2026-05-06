import { z } from 'zod';
import { Lesson } from '@/types';
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
    (d) => {
      const start = new Date(`${d.startDate}T${d.startTime}`);
      const end = new Date(`${d.startDate}T${d.endTime}`);
      return end > start;
    },
    { message: 'Время окончания должно быть больше времени начала', path: ['endTime'] },
  );

type FormValues = z.infer<typeof schema>;

interface EditLessonDialogProps {
  lesson: Lesson | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    lessonId: string,
    updates: { startTime: Date; endTime: Date; meetLink?: string; comment?: string },
  ) => void;
}

export function EditLessonDialog({ lesson, open, onOpenChange, onSave }: EditLessonDialogProps) {
  if (!lesson) return null;

  const start = new Date(lesson.startTime);
  const end = new Date(lesson.endTime);

  const defaultValues = {
    startDate: start.toISOString().split('T')[0],
    startTime: start.toTimeString().slice(0, 5),
    endTime: end.toTimeString().slice(0, 5),
    meetLink: lesson.meetLink ?? '',
    comment: lesson.comment ?? '',
  };

  return (
    <FormDialog<FormValues>
      open={open}
      onOpenChange={onOpenChange}
      title="Редактировать занятие"
      schema={schema}
      defaultValues={defaultValues}
      contentClassName="sm:max-w-[500px]"
      submitLabel="Сохранить"
      fields={[
        { name: 'startDate', label: 'Дата', type: 'date', required: true, colSpan: 2 },
        { name: 'startTime', label: 'Время начала', type: 'time', required: true },
        { name: 'endTime', label: 'Время окончания', type: 'time', required: true },
        { name: 'meetLink', label: 'Ссылка на звонок', type: 'text', placeholder: 'https://…', colSpan: 2 },
        { name: 'comment', label: 'Комментарий', type: 'textarea', placeholder: 'Дополнительные заметки', rows: 4, colSpan: 2 },
      ]}
      layout="grid-2"
      onSubmit={(values) => {
        const v = values as Required<FormValues>;
        const startDateTime = new Date(`${v.startDate}T${v.startTime}`);
        const endDateTime = new Date(`${v.startDate}T${v.endTime}`);
        onSave(lesson.id, {
          startTime: startDateTime,
          endTime: endDateTime,
          meetLink: v.meetLink || undefined,
          comment: v.comment || undefined,
        });
      }}
    />
  );
}
