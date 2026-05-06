import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { lessonsApi } from '@/api';
import { lessonKeys } from '@/hooks/api/lessons';
import { studentKeys } from '@/hooks/api/students';
import type { Lesson, ScheduledLesson } from '@/types';

function parseHHMM(value: string, base: Date): Date {
  const [h, m] = value.split(':').map(Number);
  const out = new Date(base);
  out.setHours(h, m, 0, 0);
  return out;
}

export interface ReplaceWeekResult {
  deleted: number;
  created: number;
}

/**
 * Destructive reset: wipes every `planned` Lesson inside the given week and
 * recreates lessons from the current template. `active`, `completed` and
 * `archived` lessons are always preserved — never touches actual teaching
 * history.
 *
 * Used by the "Применить шаблон на эту неделю" button. All writes are serial
 * to avoid hitting the shared-connection SQLite transaction race.
 */
export function useReplaceWeekWithTemplate() {
  const queryClient = useQueryClient();

  return useCallback(
    async (
      weekStart: Date,
      scheduledLessons: ScheduledLesson[],
      allLessons: Lesson[],
    ): Promise<ReplaceWeekResult> => {
      const rangeStart = new Date(weekStart);
      rangeStart.setHours(0, 0, 0, 0);
      const rangeEnd = new Date(rangeStart);
      rangeEnd.setDate(rangeEnd.getDate() + 7);

      const toDelete = allLessons.filter((l) => {
        if (l.status !== 'planned') return false;
        const t = new Date(l.startTime).getTime();
        return t >= rangeStart.getTime() && t < rangeEnd.getTime();
      });

      for (const l of toDelete) {
        await lessonsApi.delete(l.id);
      }

      const nowMs = Date.now();
      let created = 0;
      for (let i = 0; i < 7; i++) {
        const day = new Date(rangeStart);
        day.setDate(day.getDate() + i);
        const weekday = day.getDay();

        for (const sl of scheduledLessons) {
          if (sl.dayOfWeek !== weekday) continue;
          const start = parseHHMM(sl.startTime, day);
          const end = parseHHMM(sl.endTime, day);
          if (end <= start) continue;
          // Skip past slots so the completion worker doesn't immediately mark
          // them as completed and consume balance for lessons that never ran.
          if (end.getTime() <= nowMs) continue;

          await lessonsApi.create({
            studentId: sl.studentId,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            meetLink: sl.meetLink,
            comment: sl.comment,
            isScheduled: false,
            preparationId: sl.preparationId ?? null,
            homeworkId: sl.homeworkId ?? null,
          });
          created += 1;
        }
      }

      await queryClient.invalidateQueries({ queryKey: lessonKeys.all });
      await queryClient.invalidateQueries({ queryKey: studentKeys.all });

      return { deleted: toDelete.length, created };
    },
    [queryClient],
  );
}
