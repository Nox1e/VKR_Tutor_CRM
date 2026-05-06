import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useCreateHomework } from '@/hooks/useApi';
import { FormDialog } from '@/components/dialogs/FormDialog';
import { TagPicker } from '@/components/TagPicker';
import { useHomeworkTags, useCreateHomeworkTag, useDeleteHomeworkTag } from '@/hooks/api/tags';

const schema = z.object({
  taskNumber: z.string().min(1, 'Укажите номер задачи'),
  title: z.string().min(1, 'Укажите название'),
  link: z.string().min(1, 'Укажите ссылку на материалы'),
  tagIds: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof schema>;

export function AddHomeworkDialog() {
  const [open, setOpen] = useState(false);
  const createHomework = useCreateHomework();
  const { data: tags = [] } = useHomeworkTags();
  const createTag = useCreateHomeworkTag();
  const deleteTag = useDeleteHomeworkTag();

  return (
    <FormDialog<FormValues>
      open={open}
      onOpenChange={setOpen}
      title="Добавить домашнее задание"
      description="Создайте новое домашнее задание для учеников"
      schema={schema}
      defaultValues={{ taskNumber: '', title: '', link: '', tagIds: [] }}
      contentClassName="max-w-md"
      submitLabel="Создать"
      pendingLabel="Создание…"
      isPending={createHomework.isPending}
      trigger={
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Добавить домашнее задание
        </Button>
      }
      fields={[
        { name: 'taskNumber', label: 'Номер задачи', type: 'text', placeholder: 'Например: 3', required: true },
        { name: 'title', label: 'Название домашнего задания', type: 'text', placeholder: 'Введите название домашнего задания', required: true },
        { name: 'link', label: 'Ссылка на материалы', type: 'url', placeholder: 'https://…', required: true },
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
      onSubmit={(values) =>
        createHomework.mutateAsync({
          taskNumber: values.taskNumber,
          title: values.title,
          link: values.link,
          tagIds: values.tagIds,
        })
      }
    />
  );
}
