import { useEffect } from 'react';
import { useMaterializeWeek } from './useMaterializeWeek';
import type { Lesson, ScheduledLesson } from '@/types';

function startOfWeekMonday(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  const dow = out.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  out.setDate(out.getDate() + offset);
  return out;
}

/**
 * Ensures that this week's planned lessons exist as concrete Lesson records.
 * Run on mount of any page that reads today's lessons (e.g. the home page),
 * so users don't need to visit /calendar to see today's schedule materialised.
 */
export function useAutoMaterializeCurrentWeek(
  scheduledLessons: ScheduledLesson[],
  lessons: Lesson[],
) {
  const materialize = useMaterializeWeek();

  useEffect(() => {
    if (scheduledLessons.length === 0) return;
    void materialize(startOfWeekMonday(new Date()), scheduledLessons, lessons);
    // deliberately do not include `lessons` in deps — we want this to trigger
    // once per scheduledLessons change, not on every Lesson cache invalidation
    // (which would cause a loop since materialisation itself invalidates lessons).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduledLessons, materialize]);
}
