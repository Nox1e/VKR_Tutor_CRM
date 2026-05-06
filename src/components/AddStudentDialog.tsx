import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FormDialog } from '@/components/dialogs/FormDialog';

interface AddStudentDialogProps {
  onAddStudent: (name: string) => string;
}

const schema = z.object({
  name: z.string().trim().min(1, 'Имя обязательно'),
});

type FormValues = z.infer<typeof schema>;

export function AddStudentDialog({ onAddStudent }: AddStudentDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  return (
    <FormDialog<FormValues>
      open={open}
      onOpenChange={setOpen}
      title="Добавить нового ученика"
      schema={schema}
      defaultValues={{ name: '' }}
      contentClassName="sm:max-w-[400px]"
      submitLabel="Добавить"
      pendingLabel="Добавляем…"
      trigger={
        <Button variant="outline">
          <UserPlus className="w-4 h-4 mr-2" />
          Добавить ученика
        </Button>
      }
      fields={[
        {
          name: 'name',
          label: 'Имя ученика',
          type: 'text',
          placeholder: 'Введите имя ученика',
          autoFocus: true,
          required: true,
        },
      ]}
      onSubmit={({ name }) => {
        try {
          onAddStudent(name.trim());
        } catch {
          toast({
            title: 'Ошибка',
            description: 'Не удалось добавить ученика',
            variant: 'destructive',
          });
          throw new Error('add-student-failed');
        }
      }}
    />
  );
}
