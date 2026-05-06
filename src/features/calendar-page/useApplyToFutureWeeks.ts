import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { lessonsApi, scheduledLessonsApi } from '@/api';
import { lessonKeys } from '@/hooks/api/lessons';
import { scheduledLessonKeys } from '@/hooks/api/scheduled-lessons';
import { toast } from '@/hooks/use-toast';
import type { Lesson, ScheduledLesson } from '@/types';

export interface ApplyToFutureArgs {
  studentId: string;
  oldDayOfWeek: number;
  oldStartTime: string; // "HH:mm"
  oldEndTime: string;
  newDayOfWeek: number;
  newStartTime: string;
  newEndTime: string;
  /** Week (Monday) that the drag happened in — future deletions target weeks strictly after this. */
  anchorWeekStart: Date;
  scheduledLessons: ScheduledLesson[];
  lessons: Lesson[];
}

/**
 * Propagates a one-off drag/resize back to the weekly template.
 *
 * 1. Finds the `ScheduledLesson` matching the OLD (student, day, time) slot
 *    and updates it to the NEW slot.
 * 2. Deletes planned `Lesson`s in future weeks that still sit on the OLD slot
 *    (status='planned' only — never touches completed/active lessons). They'll
 *    be re-materialised at the NEW slot on the next week navigation.
 *
 * Linkage is by (studentId, weekday, time) match rather than a foreign key —
 * good enough until/unless we add scheduled_lesson_id to the Lesson schema.
 */
export function useApplyToFutureWeeks() {
  const queryClient = useQueryClient();

  return useCallback(async (args: ApplyToFutureArgs) => {
    const {
      studentId,
      oldDayOfWeek,
      oldStartTime,
      oldEndTime,
      newDayOfWeek,
      newStartTime,
      newEndTime,
      anchorWeekStart,
      scheduledLessons,
      lessons,
    } = args;

    const template = scheduledLessons.find(
      (sl) =>
        sl.studentId === studentId &&
        sl.dayOfWeek === oldDayOfWeek &&
        sl.startTime === oldStartTime &&
        sl.endTime === oldEndTime,
    );

    if (!template) {
      toast({
        title: 'Шаблон не найден',
        description: 'В плановом расписании нет записи с прежним временем. Правка применена только к этой неделе.',
        variant: 'destructive',
      });
      return;
    }

    const nextWeekStart = new Date(anchorWeekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    nextWeekStart.setHours(0, 0, 0, 0);

    const futureStaleLessons = lessons.filter((l) => {
      if (l.studentId !== studentId) return false;
      if (l.status !== 'planned') return false;
      const dt = new Date(l.startTime);
      if (dt.getTime() < nextWeekStart.getTime()) return false;
      if (dt.getDay() !== oldDayOfWeek) return false;
      const hhmm = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
      return hhmm === oldStartTime;
    });

    await scheduledLessonsApi.update(template.id, {
      dayOfWeek: newDayOfWeek,
      startTime: newStartTime,
      endTime: newEndTime,
    });

    // Serialise: backend transactions share one SQLite connection.
    for (const l of futureStaleLessons) {
      await lessonsApi.delete(l.id);
    }

    await queryClient.invalidateQueries({ queryKey: scheduledLessonKeys.all });
    await queryClient.invalidateQueries({ queryKey: lessonKeys.all });

    toast({
      title: 'Шаблон обновлён',
      description:
        futureStaleLessons.length > 0
          ? `Будущие недели (${futureStaleLessons.length}) будут перегенерированы по новому времени`
          : 'Будущие недели будут создаваться по новому времени',
    });
  }, [queryClient]);
}
