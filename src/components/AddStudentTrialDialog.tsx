import { z } from 'zod';
import { Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useTrials, useCreateStudentTrial } from '@/hooks/useApi';
import { FormDialog } from '@/components/dialogs/FormDialog';

const schema = z.object({
  trialId: z.string().min(1, 'Выберите пробник'),
  deadline: z.date({ required_error: 'Укажите дедлайн' }),
  comment: z.string().optional().or(z.literal('')),
  complications: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

interface AddStudentTrialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
}

export function AddStudentTrialDialog({ open, onOpenChange, studentId }: AddStudentTrialDialogProps) {
  const { data: trials = [], isLoading: trialsLoading } = useTrials();
  const createStudentTrial = useCreateStudentTrial();

  return (
    <FormDialog<FormValues>
      open={open}
      onOpenChange={onOpenChange}
      title="Добавить пробник"
      schema={schema}
      defaultValues={{
        trialId: '',
        deadline: undefined as unknown as Date,
        comment: '',
        complications: '',
      }}
      contentClassName="sm:max-w-[500px]"
      submitLabel="Добавить пробник"
      pendingLabel="Добавление…"
      isPending={createStudentTrial.isPending}
      onSubmit={(values) => {
        const v = values as Required<FormValues>;
        return createStudentTrial.mutateAsync({
          studentId,
          trialId: v.trialId,
          deadline: v.deadline,
          comment: v.comment?.trim() || undefined,
          complications: v.complications?.trim() || undefined,
        });
      }}
    >
      {(form) => {
        const selectedTrialId = form.watch('trialId');
        const selectedTrial = trials.find((t) => t.id === selectedTrialId);

        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="trialId">
                Пробник<span className="text-destructive"> *</span>
              </Label>
              <Controller
                control={form.control}
                name="trialId"
                render={({ field }) => (
                  <Select value={field.value ?? ''} onValueChange={field.onChange}>
                    <SelectTrigger id="trialId">
                      <SelectValue placeholder="Выберите пробник" />
                    </SelectTrigger>
                    <SelectContent>
                      {trialsLoading ? (
                        <SelectItem value="__loading" disabled>
                          Загрузка…
                        </SelectItem>
                      ) : (
                        trials.map((trial) => {
                          const levelLabel =
                            trial.difficultyLevel === 'easy'
                              ? 'Легкий'
                              : trial.difficultyLevel === 'ege'
                              ? 'Уровень ЕГЭ'
                              : 'Усложненный';
                          return (
                            <SelectItem key={trial.id} value={trial.id}>
                              {trial.title} ({levelLabel})
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {selectedTrial ? (
                <div className="text-sm text-muted-foreground">
                  <p>
                    <strong>Ссылка:</strong> {selectedTrial.link}
                  </p>
                </div>
              ) : null}
              {form.formState.errors.trialId ? (
                <p className="text-xs text-destructive">
                  {String(form.formState.errors.trialId.message)}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>
                Дедлайн<span className="text-destructive"> *</span>
              </Label>
              <Controller
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !field.value && 'text-muted-foreground',
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, 'PPP', { locale: ru }) : 'Выберите дату'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value as Date | undefined}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {form.formState.errors.deadline ? (
                <p className="text-xs text-destructive">
                  {String(form.formState.errors.deadline.message)}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment">Комментарий к решению</Label>
              <Textarea
                id="comment"
                rows={3}
                placeholder="Дополнительные указания по решению…"
                {...form.register('comment')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="complications">Усложнения</Label>
              <Textarea
                id="complications"
                rows={3}
                placeholder="Дополнительные усложнения или модификации…"
                {...form.register('complications')}
              />
            </div>
          </>
        );
      }}
    </FormDialog>
  );
}
