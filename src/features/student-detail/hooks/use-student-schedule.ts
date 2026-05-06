import { useMemo } from 'react';
import type { Lesson, ScheduledLesson } from '@/types';
import {
  calculateNextLesson,
  filterArchivedLessons,
  findCurrentLesson,
  sortLessonsByDateDesc,
  sortScheduledLessons,
  type NextLessonInfo,
} from '../utils/schedule';

export interface StudentScheduleState {
  archivedLessons: Lesson[];
  completedLessonsCount: number;
  nextLesson: NextLessonInfo | null;
  currentLesson: Lesson | null;
  scheduledTemplates: ScheduledLesson[];
}

export const useStudentSchedule = (
  lessons: Lesson[] = [],
  scheduledLessons: ScheduledLesson[] = [],
): StudentScheduleState => {
  return useMemo(() => {
    const archivedLessons = sortLessonsByDateDesc(filterArchivedLessons(lessons));
    const currentLesson = findCurrentLesson(lessons);
    const nextLesson = calculateNextLesson({ lessons, scheduledLessons, currentLesson });
    const scheduledTemplates = sortScheduledLessons(scheduledLessons);

    return {
      archivedLessons,
      completedLessonsCount: archivedLessons.length,
      nextLesson,
      currentLesson,
      scheduledTemplates,
    };
  }, [lessons, scheduledLessons]);
};
