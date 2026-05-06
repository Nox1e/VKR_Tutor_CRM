import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Preparation } from '@/types';
import { usePreparations } from '@/hooks/useApi';
import { BookOpen, Copy, CheckCircle } from 'lucide-react';
import { SelectDialog } from '@/components/dialogs/SelectDialog';

interface AssignPreparationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonId: string;
  lessonTitle: string;
  currentPreparation?: Preparation | null;
  onAssign: (preparationId: string | null) => void;
}

const methodColors: Record<Preparation['method'], string> = {
  program: 'bg-blue-100 text-blue-800',
  analytics: 'bg-green-100 text-green-800',
  excel: 'bg-purple-100 text-purple-800',
};

const methodLabels: Record<Preparation['method'], string> = {
  program: 'Программирование',
  analytics: 'Аналитика',
  excel: 'Excel',
};

export function AssignPreparationDialog({
  open,
  onOpenChange,
  lessonTitle,
  currentPreparation,
  onAssign,
}: AssignPreparationDialogProps) {
  const { data: preparations = [], isLoading } = usePreparations();
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = async (prep: Preparation) => {
    const lessonNumberMatch = lessonTitle.match(/Урок #(\d+)/);
    const lessonNumber = lessonNumberMatch ? lessonNumberMatch[1] : '?';
    const formattedText = `🔥ПОДГОТОВКА К ЗАНЯТИЮ №${lessonNumber}🔥\n\n${prep.message}`;

    try {
      await navigator.clipboard.writeText(formattedText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Ошибка при копировании в буфер обмена:', err);
    }
  };

  return (
    <SelectDialog<Preparation>
      open={open}
      onOpenChange={onOpenChange}
      title="Назначить подготовку"
      description={lessonTitle}
      icon={<BookOpen className="w-5 h-5" />}
      items={preparations}
      isLoading={isLoading}
      current={currentPreparation ?? null}
      getId={(p) => p.id}
      searchKeys={(p) => [p.title, p.taskNumber, p.message]}
      searchPlaceholder="Поиск по названию, номеру задачи или содержанию…"
      emptyIcon={<BookOpen className="w-12 h-12 mx-auto" />}
      emptyMessage="Подготовки не найдены"
      selectLabel="Назначить"
      removeLabel="Убрать"
      renderCurrent={(prep) => (
        <>
          <p className="font-medium text-blue-900">Текущая подготовка:</p>
          <p className="text-sm text-blue-700">{prep.title}</p>
        </>
      )}
      currentActions={(prep) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleCopy(prep);
          }}
          className={copySuccess ? 'text-green-600 hover:text-green-700' : 'text-blue-600 hover:text-blue-700'}
        >
          {copySuccess ? <CheckCircle className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
          {copySuccess ? 'Скопировано!' : 'Копировать'}
        </Button>
      )}
      renderItem={(prep) => (
        <>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm">{prep.title}</h4>
            <Badge className={methodColors[prep.method]}>{methodLabels[prep.method]}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-2">Задача №{prep.taskNumber}</p>
          <p className="text-xs text-gray-600 line-clamp-2">{prep.message}</p>
        </>
      )}
      onSelect={(prep) => onAssign(prep?.id ?? null)}
    />
  );
}
