import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lesson, Student, TimeInterval, Preparation } from '@/types';
import { formatTime, calculateTotalActiveTime, calculateIndependentTime, calculateIdleTime } from '@/utils/timeUtils';
import { Play, Pause, ExternalLink, Trash2, Archive, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getShortName } from '@/utils/nameUtils';

interface LessonCardProps {
  lesson: Lesson;
  student: Student;
  intervals: TimeInterval[];
  isSelected: boolean;
  onSelect: () => void;
  onToggleTimer: () => void;
  onOpenMeet: () => void;
  onConfirmScheduled?: () => void;
  onCancelScheduled?: () => void;
  onDelete?: () => void;
  onArchive?: () => void;
  nextPreparation?: Preparation | null;
}

export function LessonCard({
  lesson,
  student,
  intervals,
  isSelected,
  onSelect,
  onToggleTimer,
  onOpenMeet,
  onConfirmScheduled,
  onCancelScheduled,
  onDelete,
  onArchive,
  nextPreparation
}: LessonCardProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const activeTime = calculateTotalActiveTime(intervals);
  const independentTime = calculateIndependentTime(lesson.startTime, lesson.endTime, intervals);
  const hasActiveInterval = intervals.some(interval => !interval.endTime);
  const idleTime = calculateIdleTime(intervals);
  const now = new Date();
  const isLessonTimeOver = now > lesson.endTime;
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getStatusColor = () => {
    if (isLessonTimeOver) {
      return 'bg-success text-success-foreground';
    }
    if (hasActiveInterval) {
      return 'bg-primary text-primary-foreground';
    }
         if (intervals.length > 0) {
       return 'bg-warning text-warning-foreground';
     }
    return 'bg-neutral text-neutral-foreground';
  };

  const getStatusText = () => {
    if (isLessonTimeOver) {
      return 'Завершён';
    }
    if (hasActiveInterval) {
      return 'Активен';
    }
         if (intervals.length > 0) {
       return 'Ожидание';
     }
    return 'Запланирован';
  };

  const isScheduled = lesson.isScheduled;

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isSelected ? "ring-2 ring-primary" : "",
        isScheduled ? "opacity-75 bg-muted" : ""
      )}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">{getShortName(student.name)}</h3>
          <Badge className={getStatusColor()}>
            {getStatusText()}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {formatTime(lesson.startTime)} - {formatTime(lesson.endTime)}
        </p>
        {nextPreparation && (
          <div className="flex items-center gap-2 mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-blue-900 truncate">
                Следующая подготовка:
              </p>
              <p className="text-xs text-blue-700 truncate">
                {nextPreparation.title}
              </p>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {isScheduled ? (
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onConfirmScheduled?.();
              }}
              className="flex-1"
            >
              Подтвердить
            </Button>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onCancelScheduled?.();
              }}
              className="flex-1"
            >
              Отменить
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant={hasActiveInterval ? "destructive" : "default"}
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onToggleTimer();
              }}
              className="flex-1"
            >
              {hasActiveInterval ? (
                <>
                  <Pause className="w-4 h-4 mr-1" />
                  Стоп
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-1" />
                  Старт
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onOpenMeet();
              }}
              disabled={!lesson.meetLink}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>

            {onArchive && isLessonTimeOver && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onArchive();
                }}
                className="text-amber-600 hover:text-amber-700"
                title="Архивировать урок"
              >
                <Archive className="w-4 h-4" />
              </Button>
            )}

            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Активно:</span>
            <span className="font-medium">{activeTime}м</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Самостоятельно:</span>
            <span className="font-medium">{independentTime}м</span>
          </div>
          {!hasActiveInterval && intervals.length > 0 && !isLessonTimeOver && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Простой:</span>
              <span className="font-medium text-warning">{idleTime}м</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}