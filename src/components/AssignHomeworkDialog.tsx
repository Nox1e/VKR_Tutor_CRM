import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Homework } from '@/types';
import { useHomeworks } from '@/hooks/useApi';
import { Clipboard, Copy, CheckCircle, ExternalLink } from 'lucide-react';
import { SelectDialog } from '@/components/dialogs/SelectDialog';

interface AssignHomeworkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonId: string;
  lessonTitle: string;
  currentHomework?: Homework | null;
  onAssign: (homeworkId: string | null) => void;
}

export function AssignHomeworkDialog({
  open,
  onOpenChange,
  lessonTitle,
  currentHomework,
  onAssign,
}: AssignHomeworkDialogProps) {
  const { data: homeworks = [], isLoading } = useHomeworks();
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = async (hw: Homework) => {
    const content = hw.link ? `1) ${hw.title} - ${hw.link}` : `1) ${hw.title}`;
    const formattedText = `💪 ДОМАШНЕЕ ЗАДАНИЕ 💪\n\n${content}`;

    try {
      await navigator.clipboard.writeText(formattedText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Ошибка при копировании в буфер обмена:', err);
    }
  };

  return (
    <SelectDialog<Homework>
      open={open}
      onOpenChange={onOpenChange}
      title="Назначить домашнее задание"
      description={lessonTitle}
      icon={<Clipboard className="w-5 h-5" />}
      items={homeworks}
      isLoading={isLoading}
      current={currentHomework ?? null}
      getId={(h) => h.id}
      searchKeys={(h) => [h.title, h.taskNumber]}
      searchPlaceholder="Поиск по названию или номеру задачи…"
      emptyIcon={<Clipboard className="w-12 h-12 mx-auto" />}
      emptyMessage="Домашние задания не найдены"
      selectLabel="Назначить"
      removeLabel="Убрать"
      renderCurrent={(hw) => (
        <>
          <p className="font-medium text-green-900">Текущее домашнее задание:</p>
          <p className="text-sm text-green-700">{hw.title}</p>
          <div className="flex items-center gap-2 mt-1">
            {hw.link ? (
              <a
                href={hw.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800"
              >
                <ExternalLink className="w-3 h-3" />
                Ссылка
              </a>
            ) : null}
          </div>
        </>
      )}
      currentActions={(hw) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleCopy(hw);
          }}
          className="text-green-600 hover:text-green-700"
        >
          {copySuccess ? <CheckCircle className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
          {copySuccess ? 'Скопировано!' : 'Копировать'}
        </Button>
      )}
      renderItem={(hw) => (
        <>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm">{hw.title}</h4>
            <Badge variant="outline" className="text-xs">Задача №{hw.taskNumber}</Badge>
          </div>
          <div className="flex items-center gap-2">
            {hw.link ? (
              <a
                href={hw.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="w-3 h-3" />
                Ссылка
              </a>
            ) : null}
          </div>
        </>
      )}
      onSelect={(hw) => onAssign(hw?.id ?? null)}
    />
  );
}
