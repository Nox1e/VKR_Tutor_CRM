import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useCreatePreparation } from '@/hooks/useApi';
import { FormDialog } from '@/components/dialogs/FormDialog';
import { TagPicker } from '@/components/TagPicker';
import {
  usePreparationTags,
  useCreatePreparationTag,
  useDeletePreparationTag,
} from '@/hooks/api/tags';

const schema = z.object({
  taskNumber: z.string().min(1, 'Укажите номер задачи'),
  method: z.enum(['program', 'analytics', 'excel'], {
    required_error: 'Выберите метод',
  }),
  title: z.string().min(1, 'Укажите название'),
  message: z.string().min(1, 'Опишите подготовку'),
  tagIds: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof schema>;

const methodOptions = [
  { value: 'program', label: 'Программа' },
  { value: 'analytics', label: 'Аналитика' },
  { value: 'excel', label: 'Excel' },
];

export function AddPreparationDialog() {
  const [open, setOpen] = useState(false);
  const createPreparation = useCreatePreparation();
  const { data: tags = [] } = usePreparationTags();
  const createTag = useCreatePreparationTag();
  const deleteTag = useDeletePreparationTag();

  return (
    <FormDialog<FormValues>
      open={open}
      onOpenChange={setOpen}
      title="Добавить новую подготовку"
      description="Создайте новую подготовку для учеников с указанием номера задачи, метода решения и описания."
      schema={schema}
      defaultValues={{
        taskNumber: '',
        method: undefined as unknown as FormValues['method'],
        title: '',
        message: '',
        tagIds: [],
      }}
      contentClassName="sm:max-w-[600px]"
      layout="grid-2"
      submitLabel="Создать подготовку"
      pendingLabel="Создание…"
      isPending={createPreparation.isPending}
      trigger={
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Добавить подготовку
        </Button>
      }
      fields={[
        { name: 'taskNumber', label: '№ задачи', type: 'text', placeholder: 'Например: 1, 2.1, 3.2.1', required: true },
        { name: 'method', label: 'Метод решения', type: 'select', options: methodOptions, placeholder: 'Выберите метод', required: true },
        { name: 'title', label: 'Название подготовки', type: 'text', placeholder: 'Краткое название подготовки', required: true, colSpan: 2 },
        { name: 'message', label: 'Текст сообщения подготовки', type: 'textarea', placeholder: 'Введите текст сообщения с ссылками на видео и описанием задания…', rows: 6, required: true, colSpan: 2 },
        {
          name: 'tagIds',
          label: 'Теги',
          type: 'custom',
          colSpan: 2,
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
      onSubmit={(values) => createPreparation.mutateAsync(values as never)}
    />
  );
}
