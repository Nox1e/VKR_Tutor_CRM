import { format } from 'date-fns';
import type { Lesson, ScheduledLesson } from '@/types';

export type NextLessonType = 'existing' | 'scheduled';

export interface NextLessonInfo {
  type: NextLessonType;
  lesson: Lesson | ScheduledLesson;
  date: Date;
}

const cloneStartOfDay = (date: Date) => {
  const copy = new Date(date.getTime());
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const startOfDayMs = (date: Date) => cloneStartOfDay(date).getTime();

const isPlannedOrActive = (lesson: Lesson) => lesson.status === 'planned' || lesson.status === 'active';

const parseTimeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return 0;
  }
  return hours * 60 + minutes;
};

interface ScheduledSlot {
  lesson: ScheduledLesson;
  date: Date;
}

const findNextScheduledSlot = (
  scheduledLessons: ScheduledLesson[],
  reference: Date,
  options: { excludeToday?: boolean } = {},
): ScheduledSlot | null => {
  const { excludeToday = false } = options;
  const currentMinutes = reference.getHours() * 60 + reference.getMinutes();
  const currentDayOfWeek = reference.getDay();
  const startOfReferenceDay = cloneStartOfDay(reference);

  const candidates: ScheduledSlot[] = [];

  scheduledLessons.forEach((scheduled) => {
    const slotMinutes = parseTimeToMinutes(scheduled.startTime);
    const [startHours, startMinutes] = scheduled.startTime.split(':').map(Number);

    if (Number.isNaN(startHours) || Number.isNaN(startMinutes)) {
      return;
    }

    for (let weekOffset = 0; weekOffset < 2; weekOffset += 1) {
      let daysUntilSlot = scheduled.dayOfWeek - currentDayOfWeek + weekOffset * 7;
      if (daysUntilSlot < 0) {
        daysUntilSlot += 7;
      }

      if (daysUntilSlot === 0) {
        if (excludeToday) {
          continue;
        }

        if (slotMinutes <= currentMinutes) {
          continue;
        }
      }

      const candidateDate = new Date(startOfReferenceDay);
      candidateDate.setDate(candidateDate.getDate() + daysUntilSlot);
      candidateDate.setHours(startHours, startMinutes, 0, 0);

      candidates.push({
        lesson: scheduled,
        date: candidateDate,
      });
    }
  });

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((a, b) => a.date.getTime() - b.date.getTime());
  return candidates[0];
};

export const filterArchivedLessons = (lessons: Lesson[], reference: Date = new Date()): Lesson[] => {
  const today = startOfDayMs(reference);

  return lessons.filter((lesson) => {
    if (!isPlannedOrActive(lesson)) {
      // completed / archived — always past
      return true;
    }

    // planned/active counts as "past" only if its day is strictly before today.
    // Future planned lessons (now produced en-masse by week auto-materialisation)
    // must not pollute the "Проведённые уроки" list or its counter.
    const lessonDay = startOfDayMs(lesson.startTime);
    return lessonDay < today;
  });
};

export const sortLessonsByDateDesc = (lessons: Lesson[]): Lesson[] =>
  [...lessons].sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

export const sortScheduledLessons = (scheduledLessons: ScheduledLesson[]): ScheduledLesson[] =>
  [...scheduledLessons].sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) {
      return a.dayOfWeek - b.dayOfWeek;
    }

    return parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime);
  });

export const findCurrentLesson = (lessons: Lesson[], reference: Date = new Date()): Lesson | null => {
  const today = startOfDayMs(reference);

  return (
    [...lessons]
      .filter(isPlannedOrActive)
      .filter((lesson) => startOfDayMs(lesson.startTime) === today)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0] ?? null
  );
};

interface CalculateNextLessonArgs {
  lessons: Lesson[];
  scheduledLessons: ScheduledLesson[];
  reference?: Date;
  currentLesson?: Lesson | null;
}

export const calculateNextLesson = ({
  lessons,
  scheduledLessons,
  reference = new Date(),
  currentLesson,
}: CalculateNextLessonArgs): NextLessonInfo | null => {
  const activeLesson = currentLesson ?? findCurrentLesson(lessons, reference);

  if (activeLesson) {
    const nextSlot = findNextScheduledSlot(scheduledLessons, reference, { excludeToday: true });
    if (nextSlot) {
      return {
        type: 'scheduled',
        lesson: nextSlot.lesson,
        date: nextSlot.date,
      };
    }

    return null;
  }

  const today = startOfDayMs(reference);

  const upcomingLessons = [...lessons]
    .filter(isPlannedOrActive)
    .filter((lesson) => startOfDayMs(lesson.startTime) >= today)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  if (upcomingLessons.length > 0) {
    const nextLesson = upcomingLessons[0];
    return {
      type: 'existing',
      lesson: nextLesson,
      date: nextLesson.startTime,
    };
  }

  const nextSlot = findNextScheduledSlot(scheduledLessons, reference);
  if (nextSlot) {
    return {
      type: 'scheduled',
      lesson: nextSlot.lesson,
      date: nextSlot.date,
    };
  }

  return null;
};

export const getNextDateForDayOfWeek = (dayOfWeek: number, reference: Date = new Date()): Date => {
  const base = cloneStartOfDay(reference);
  const currentDay = reference.getDay();
  let delta = dayOfWeek - currentDay;

  if (delta <= 0) {
    delta += 7;
  }

  base.setDate(base.getDate() + delta);
  return base;
};

export const findTemplateToConsume = (
  scheduledLessons: ScheduledLesson[],
  startTime: Date,
): ScheduledLesson | null => {
  const lessonDay = startTime.getDay();
  const lessonTime = format(startTime, 'HH:mm');

  // 1. Точное совпадение по дню недели и времени
  const exactMatch = scheduledLessons.find(
    (s) => s.dayOfWeek === lessonDay && s.startTime === lessonTime,
  );
  if (exactMatch) return exactMatch;

  // 2. Совпадение только по дню недели
  const dayMatch = scheduledLessons.find((s) => s.dayOfWeek === lessonDay);
  if (dayMatch) return dayMatch;

  // 3. Крайний случай: если нет совпадения по дню/времени, берем единственный шаблон с подготовкой
  const templatesWithPrep = scheduledLessons.filter((s) => s.preparationId || s.homeworkId);
  if (templatesWithPrep.length === 1) {
    return templatesWithPrep[0];
  }

  return null;
};

export const studentScheduleUtils = {
  filterArchivedLessons,
  sortLessonsByDateDesc,
  sortScheduledLessons,
  findCurrentLesson,
  calculateNextLesson,
  getNextDateForDayOfWeek,
  findTemplateToConsume,
};
