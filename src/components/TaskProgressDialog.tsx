import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CheckCircle2, Circle } from 'lucide-react';
import { Lesson, Preparation, TrialResult, Student } from '@/types';
import { cn } from '@/lib/utils';
import { useUpdateStudent } from '@/hooks/useApi';

interface TaskProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessons: Lesson[];
  preparations: Preparation[];
  trialResults: TrialResult[];
  student: Student;
}

export const TaskProgressDialog: React.FC<TaskProgressDialogProps> = ({
  open,
  onOpenChange,
  lessons,
  preparations,
  trialResults,
  student,
}) => {
  const updateStudent = useUpdateStudent();
  
  const manualTasks = useMemo<number[]>(() => {
    const raw = student.manualTaskProgress;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw as number[];
    // Tolerate legacy snake_case / stringified payloads.
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }, [student.manualTaskProgress]);

  const taskStats = useMemo(() => {
    const preparationMap = new Map(preparations.map((p) => [p.id, p]));
    const assignedPreparationIds = new Set(
      lessons.map((l) => l.preparationId).filter((id): id is string => !!id)
    );

    const firstLessonDatePerTask: Record<number, number> = {};

    lessons.forEach(lesson => {
      if (lesson.preparationId) {
        const prep = preparationMap.get(lesson.preparationId);
        if (prep) {
          const match = prep.taskNumber.match(/^(\d+)/);
          if (match) {
            const taskNum = parseInt(match[1], 10);
            const lessonTime = lesson.startTime.getTime();
            if (!firstLessonDatePerTask[taskNum] || lessonTime < firstLessonDatePerTask[taskNum]) {
              firstLessonDatePerTask[taskNum] = lessonTime;
            }
          }
        }
      }
    });

    const stats: Record<number, { 
      isCompleted: boolean; 
      isManual: boolean; 
      correct: number; 
      total: number;
      postCorrect: number;
      postTotal: number;
    }> = {};

    for (let i = 1; i <= 27; i++) {
      stats[i] = { 
        isCompleted: false, 
        isManual: manualTasks.includes(i), 
        correct: 0, 
        total: 0,
        postCorrect: 0,
        postTotal: 0,
      };
    }

    assignedPreparationIds.forEach((prepId) => {
      const prep = preparationMap.get(prepId);
      if (prep) {
        const match = prep.taskNumber.match(/^(\d+)/);
        if (match) {
          const taskNum = parseInt(match[1], 10);
          if (taskNum >= 1 && taskNum <= 27) {
            stats[taskNum].isCompleted = true;
          }
        }
      }
    });

    trialResults.forEach((result) => {
      const resultDate = result.createdAt.getTime();

      result.taskScores.forEach((score, index) => {
        const taskNum = index + 1;
        if (taskNum >= 1 && taskNum <= 27) {
          stats[taskNum].total += 1;
          if (score > 0) {
            stats[taskNum].correct += 1;
          }

          const firstLessonDate = firstLessonDatePerTask[taskNum];
          if (firstLessonDate && resultDate > firstLessonDate) {
            stats[taskNum].postTotal += 1;
            if (score > 0) {
              stats[taskNum].postCorrect += 1;
            }
          }
        }
      });
    });

    return stats;
  }, [lessons, preparations, trialResults, manualTasks]);

  const handleToggleManual = (taskNum: number) => {
    if (taskStats[taskNum].isCompleted) return;

    let newManualTasks: number[];
    if (manualTasks.includes(taskNum)) {
      newManualTasks = manualTasks.filter(id => id !== taskNum);
    } else {
      newManualTasks = [...manualTasks, taskNum];
    }

    updateStudent.mutate({
      id: student.id,
      student: {
        manualTaskProgress: newManualTasks,
      },
    });
  };

  const autoCompletedCount = Object.values(taskStats).filter(s => s.isCompleted).length;
  const manualCompletedCount = Object.values(taskStats).filter(s => !s.isCompleted && s.isManual).length;
  const totalTrials = trialResults.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Прогресс по заданиям ЕГЭ</DialogTitle>
          <DialogDescription>
            Статистика пройденных тем и результатов пробников ({totalTrials} пробников).
            Темы: {autoCompletedCount + manualCompletedCount} из 27
            <span className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1 text-xs">
                <span className="w-2 h-2 rounded-full bg-green-500" /> Авто
              </span>
              <span className="flex items-center gap-1 text-xs">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Ручная
              </span>
              <span className="flex items-center gap-1 text-xs ml-auto text-muted-foreground italic">
                Всего / После урока
              </span>
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 py-4">
          {Array.from({ length: 27 }, (_, i) => i + 1).map((taskNum) => {
            const stat = taskStats[taskNum];
            const isAuto = stat.isCompleted;
            const isManual = !isAuto && stat.isManual;

            return (
              <div
                key={taskNum}
                onClick={() => handleToggleManual(taskNum)}
                className={cn(
                  "flex flex-col items-center justify-between p-1 rounded-lg border-2 transition-colors min-h-[80px] cursor-pointer",
                  isAuto
                    ? "bg-green-50 border-green-200"
                    : isManual
                      ? "bg-blue-50 border-blue-200"
                      : "bg-gray-50 border-gray-100 hover:bg-gray-100"
                )}
              >
                <div className="flex items-center justify-between w-full mb-1 px-1">
                  <span className={cn(
                    "text-xs font-bold",
                    isAuto ? "text-green-700" : isManual ? "text-blue-700" : "text-gray-400"
                  )}>{taskNum}</span>
                  {isAuto ? (
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                  ) : isManual ? (
                    <CheckCircle2 className="w-3 h-3 text-blue-600" />
                  ) : (
                    <Circle className="w-3 h-3 text-gray-300 opacity-20" />
                  )}
                </div>
                
                <div className="flex flex-col items-center w-full gap-1">
                  <div className="flex justify-between w-full px-2">
                    <span className={cn(
                      "text-[10px] font-medium leading-none",
                      stat.total > 0 ? "text-gray-500" : "text-gray-300"
                    )}>
                      {stat.correct}/{stat.total}
                    </span>
                    {stat.postTotal > 0 && (
                      <span className="text-[10px] font-bold leading-none text-blue-600">
                        {stat.postCorrect}/{stat.postTotal}
                      </span>
                    )}
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden mx-1">
                    <div 
                      className={cn(
                        "h-full transition-all",
                        stat.postTotal > 0 && stat.postCorrect / stat.postTotal > 0.7 ? "bg-green-500" :
                        stat.postTotal > 0 && stat.postCorrect / stat.postTotal > 0.4 ? "bg-yellow-500" :
                        stat.postTotal > 0 ? "bg-red-500" : "bg-transparent"
                      )}
                      style={{ width: `${stat.postTotal > 0 ? (stat.postCorrect / stat.postTotal) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

