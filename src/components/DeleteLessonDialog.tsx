import { Trash2, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';

interface DeleteLessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: {
    id: string;
    startTime: Date;
    endTime: Date;
    title?: string;
    isPaid?: boolean;
  } | null;
  onConfirm: () => void;
}

export function DeleteLessonDialog({
  open,
  onOpenChange,
  lesson,
  onConfirm,
}: DeleteLessonDialogProps) {
  if (!lesson) return null;

  const startDate = new Date(lesson.startTime);
  const endDate = new Date(lesson.endTime);

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="destructive"
      icon={<Trash2 className="w-5 h-5" />}
      title="Удалить проведенное занятие"
      description="Вы уверены, что хотите удалить это занятие?"
      body={
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Calendar className="w-4 h-4" />
            <span>{format(startDate, 'd MMMM yyyy', { locale: ru })}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Clock className="w-4 h-4" />
            <span>
              {format(startDate, 'HH:mm', { locale: ru })} - {format(endDate, 'HH:mm', { locale: ru })}
            </span>
          </div>
          {lesson.title ? (
            <div className="text-sm text-gray-800 font-medium">{lesson.title}</div>
          ) : null}
          {lesson.isPaid ? (
            <div className="text-sm text-green-600 font-medium">Статус: Оплачено</div>
          ) : null}
        </div>
      }
      warning="⚠️ Это действие нельзя отменить. Если занятие было оплачено, оплата будет возвращена в счетчик оплаченных занятий."
      confirmLabel="Удалить занятие"
      onConfirm={onConfirm}
    />
  );
}
