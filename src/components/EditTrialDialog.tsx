import { z } from 'zod';
import { useUpdateTrial } from '@/hooks/useApi';
import { Trial } from '@/types';
import { FormDialog } from '@/components/dialogs/FormDialog';
import { TagPicker } from '@/components/TagPicker';
import { useTrialTags, useCreateTrialTag, useDeleteTrialTag } from '@/hooks/api/tags';

const difficultyLevelOptions = [
  { value: 'easy', label: 'Легкий' },
  { value: 'ege', label: 'Уровень ЕГЭ' },
  { value: 'advanced', label: 'Усложненный' },
];

const schema = z.object({
  orderNumber: z.coerce.number().int().positive('Номер должен быть положительным числом'),
  difficultyLevel: z.enum(['easy', 'ege', 'advanced']),
  title: z.string().min(1, 'Укажите название'),
  link: z.string().url('Введите корректный URL'),
  tagIds: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof schema>;

interface EditTrialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trial: Trial | null;
}

export function EditTrialDialog({ open, onOpenChange, trial }: EditTrialDialogProps) {
  const updateTrial = useUpdateTrial();
  const { data: tags = [] } = useTrialTags();
  const createTag = useCreateTrialTag();
  const deleteTag = useDeleteTrialTag();

  if (!trial) return null;

  return (
    <FormDialog<FormValues>
      open={open}
      onOpenChange={onOpenChange}
      title="Редактировать пробник"
      description="Измените информацию о пробнике"
      schema={schema}
      defaultValues={{
        orderNumber: trial.orderNumber,
        difficultyLevel: trial.difficultyLevel,
        title: trial.title,
        link: trial.link,
        tagIds: trial.tags?.map((t) => t.id) ?? [],
      }}
      contentClassName="sm:max-w-[425px]"
      submitLabel="Сохранить"
      pendingLabel="Сохранение…"
      isPending={updateTrial.isPending}
      fields={[
        { name: 'orderNumber', label: 'Порядковый номер', type: 'number', placeholder: 'Введите номер пробника', required: true },
        { name: 'difficultyLevel', label: 'Уровень сложности', type: 'select', options: difficultyLevelOptions, placeholder: 'Выберите уровень сложности', required: true },
        { name: 'title', label: 'Название пробника', type: 'text', placeholder: 'Введите название пробника', required: true },
        { name: 'link', label: 'Ссылка на пробник', type: 'url', placeholder: 'https://example.com/trial', required: true },
        {
          name: 'tagIds',
          label: 'Теги',
          type: 'custom',
          render: ({ value, onChange }) => (
            <TagPicker
              allTags={tags}
              selectedIds={(value as string[]) ?? []}
              onChange={(ids) => onChange(ids)}
              onCreate={async (name) => {
                const created = await createTag.mutateAsync({ name });
                return { id: created.id, name: created.name, color: created.color ?? undefined };
              }}
              onDelete={(id) => deleteTag.mutateAsync(id)}
            />
          ),
        },
      ]}
      onSubmit={(values) => {
        const v = values as FormValues;
        return updateTrial.mutateAsync({
          id: trial.id,
          trial: {
            orderNumber: v.orderNumber,
            difficultyLevel: v.difficultyLevel,
            title: v.title,
            link: v.link,
            tagIds: v.tagIds,
          },
        });
      }}
    />
  );
}
