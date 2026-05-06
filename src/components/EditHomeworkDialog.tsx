import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { useUpdateHomework } from '@/hooks/useApi';
import { Homework } from '@/types';
import { FormDialog } from '@/components/dialogs/FormDialog';
import { TagPicker } from '@/components/TagPicker';
import { useHomeworkTags, useCreateHomeworkTag, useDeleteHomeworkTag } from '@/hooks/api/tags';

const schema = z.object({
  taskNumber: z.string().min(1),
  title: z.string().min(1),
  link: z.string().min(1, 'Укажите ссылку на материалы'),
  tagIds: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof schema>;

interface EditHomeworkDialogProps {
  homework: Homework;
  trigger?: React.ReactNode;
}

export function EditHomeworkDialog({ homework, trigger }: EditHomeworkDialogProps) {
  const [open, setOpen] = useState(false);
  const updateHomework = useUpdateHomework();
  const { data: tags = [] } = useHomeworkTags();
  const createTag = useCreateHomeworkTag();
  const deleteTag = useDeleteHomeworkTag();

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(true);
  };

  const triggerNode = trigger ? (
    <div onClick={handleTriggerClick}>{trigger}</div>
  ) : (
    <Button variant="ghost" size="sm" onClick={handleTriggerClick} className="h-8 w-8 p-0">
      <Edit className="w-4 h-4" />
    </Button>
  );

  return (
    <>
      {triggerNode}
      <FormDialog<FormValues>
        open={open}
        onOpenChange={setOpen}
        title="Редактировать домашнее задание"
        description="Измените информацию о домашнем задании"
        schema={schema}
        defaultValues={{
          taskNumber: homework.taskNumber,
          title: homework.title,
          link: homework.link ?? '',
          tagIds: homework.tags?.map((t) => t.id) ?? [],
        }}
        contentClassName="max-w-md"
        submitLabel="Сохранить"
        pendingLabel="Сохранение…"
        isPending={updateHomework.isPending}
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
        onSubmit={(values) => {
          const v = values as FormValues;
          return updateHomework.mutateAsync({
            id: homework.id,
            homework: {
              taskNumber: v.taskNumber,
              title: v.title,
              link: v.link,
              tagIds: v.tagIds,
            },
          });
        }}
      />
    </>
  );
}
