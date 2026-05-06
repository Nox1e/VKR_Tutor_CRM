import { z } from 'zod';
import { useCreateTrial } from '@/hooks/useApi';
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
  difficultyLevel: z.enum(['easy', 'ege', 'advanced'], {
    required_error: 'Выберите уровень',
  }),
  title: z.string().min(1, 'Укажите название'),
  link: z.string().url('Введите корректный URL'),
  tagIds: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof schema>;

interface AddTrialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTrialDialog({ open, onOpenChange }: AddTrialDialogProps) {
  const createTrial = useCreateTrial();
  const { data: tags = [] } = useTrialTags();
  const createTag = useCreateTrialTag();
  const deleteTag = useDeleteTrialTag();

  return (
    <FormDialog<FormValues>
      open={open}
      onOpenChange={onOpenChange}
      title="Добавить пробник"
      description="Создайте новый пробник для подготовки к экзаменам"
      schema={schema}
      defaultValues={{
        orderNumber: undefined as unknown as number,
        difficultyLevel: undefined as unknown as FormValues['difficultyLevel'],
        title: '',
        link: '',
        tagIds: [],
      }}
      contentClassName="sm:max-w-[425px]"
      submitLabel="Создать"
      pendingLabel="Создание…"
      isPending={createTrial.isPending}
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
      onSubmit={(values) => createTrial.mutateAsync(values as never)}
    />
  );
}
