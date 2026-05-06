import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { useUpdatePreparation } from '@/hooks/useApi';
import { Preparation } from '@/types';
import { FormDialog } from '@/components/dialogs/FormDialog';
import { TagPicker } from '@/components/TagPicker';
import {
  usePreparationTags,
  useCreatePreparationTag,
  useDeletePreparationTag,
} from '@/hooks/api/tags';

const schema = z.object({
  taskNumber: z.string().min(1),
  method: z.enum(['program', 'analytics', 'excel']),
  title: z.string().min(1),
  message: z.string().min(1),
  tagIds: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof schema>;

const methodOptions = [
  { value: 'program', label: 'Программа' },
  { value: 'analytics', label: 'Аналитика' },
  { value: 'excel', label: 'Excel' },
];

interface EditPreparationDialogProps {
  preparation: Preparation;
  trigger?: React.ReactNode;
}

export function EditPreparationDialog({ preparation, trigger }: EditPreparationDialogProps) {
  const [open, setOpen] = useState(false);
  const updatePreparation = useUpdatePreparation();
  const { data: tags = [] } = usePreparationTags();
  const createTag = useCreatePreparationTag();
  const deleteTag = useDeletePreparationTag();

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(true);
  };

  const triggerNode = trigger ? (
    <div onClick={handleTriggerClick} className="cursor-pointer">
      {trigger}
    </div>
  ) : (
    <Button variant="ghost" size="sm" onClick={handleTriggerClick}>
      <Edit className="w-4 h-4" />
    </Button>
  );

  return (
    <>
      {triggerNode}
      <FormDialog<FormValues>
        open={open}
        onOpenChange={setOpen}
        title="Редактировать подготовку"
        description="Измените информацию о подготовке."
        schema={schema}
        defaultValues={{
          taskNumber: preparation.taskNumber,
          method: preparation.method,
          title: preparation.title,
          message: preparation.message,
          tagIds: preparation.tags?.map((t) => t.id) ?? [],
        }}
        contentClassName="sm:max-w-[600px]"
        layout="grid-2"
        submitLabel="Сохранить изменения"
        pendingLabel="Сохранение…"
        isPending={updatePreparation.isPending}
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
        onSubmit={(values) => {
          const v = values as FormValues;
          return updatePreparation.mutateAsync({
            id: preparation.id,
            preparation: {
              taskNumber: v.taskNumber,
              method: v.method,
              title: v.title,
              message: v.message,
              tagIds: v.tagIds,
            },
          });
        }}
      />
    </>
  );
}
