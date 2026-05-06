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

// Module-level guard — shared across every component instance that calls
// useMaterializeWeek(). Both Index.tsx (via useAutoMaterializeCurrentWeek)
// and Calendar.tsx use this hook simultaneously, and React 18 StrictMode
// double-mounts every component in dev, so a per-instance ref wasn't enough:
// each consumer owned its own ref and could race the others into duplicate
// materialisations. Keying by ISO week start collapses all of those into a
// single in-flight call per week regardless of who triggered it.
const inflight = new Map<string, Promise<number>>();

/**
 * Creates concrete `Lesson` records for every `ScheduledLesson` that has no
 * counterpart in the given week. Idempotent and concurrency-safe.
 *
 * Runs silently — no toasts for auto-materialisation.
 */
export function useMaterializeWeek() {
  const queryClient = useQueryClient();

  return useCallback(
    async (
      weekStart: Date,
      scheduledLessons: ScheduledLesson[],
      existingLessons: Lesson[],
    ): Promise<number> => {
      const weekKey = weekStart.toISOString().slice(0, 10);
      const existing = inflight.get(weekKey);
      if (existing) return existing;
      if (scheduledLessons.length === 0) return 0;

      // Auto-materialise only pristine weeks. Once the week has any lesson
      // (created, dragged in, or materialised earlier) it's considered
      // user-owned — auto-fill would re-create slots the user emptied on
      // purpose (e.g. by dragging a lesson to a different day). Force-adding
      // from template is available via the "Применить шаблон" button.
      const weekStartMs = new Date(weekStart).setHours(0, 0, 0, 0);
      const weekEndMs = weekStartMs + 7 * 24 * 60 * 60 * 1000;
      const weekHasLessons = existingLessons.some((l) => {
        const t = new Date(l.startTime).getTime();
        return t >= weekStartMs && t < weekEndMs;
      });
      if (weekHasLessons) return 0;

      const job = (async () => {
        try {
          const payloads: Array<Parameters<typeof lessonsApi.create>[0]> = [];
          const nowMs = Date.now();

          for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart);
            day.setDate(day.getDate() + i);
            day.setHours(0, 0, 0, 0);
            const weekday = day.getDay();

            for (const sl of scheduledLessons) {
              if (sl.dayOfWeek !== weekday) continue;

              const start = parseHHMM(sl.startTime, day);
              const end = parseHHMM(sl.endTime, day);
              if (end <= start) continue;
              // Skip slots whose end_time is already in the past at
              // materialisation time — otherwise the completion worker would
              // immediately mark them completed and charge the balance for a
              // lesson that never happened (typical for new students
              // onboarded mid-week).
              if (end.getTime() <= nowMs) continue;

              payloads.push({
                studentId: sl.studentId,
                startTime: start.toISOString(),
                endTime: end.toISOString(),
                meetLink: sl.meetLink,
                comment: sl.comment,
                isScheduled: false,
                preparationId: sl.preparationId ?? null,
                homeworkId: sl.homeworkId ?? null,
              });
            }
          }

          if (payloads.length === 0) return 0;

          for (const p of payloads) {
            await lessonsApi.create(p);
          }
          await queryClient.invalidateQueries({ queryKey: lessonKeys.all });
          await queryClient.invalidateQueries({ queryKey: studentKeys.all });
          return payloads.length;
        } finally {
          inflight.delete(weekKey);
        }
      })();

      inflight.set(weekKey, job);
      return job;
    },
    [queryClient],
  );
}
