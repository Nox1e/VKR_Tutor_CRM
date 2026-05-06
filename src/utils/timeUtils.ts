import { TimeInterval } from '@/types';

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('ru-RU', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}ч ${mins}м`;
  }
  return `${mins}м`;
}

export function calculateTotalActiveTime(intervals: TimeInterval[]): number {
  return intervals.reduce((total, interval) => {
    if (interval.endTime) {
      const duration = interval.endTime.getTime() - interval.startTime.getTime();
      return total + Math.floor(duration / (1000 * 60));
    }
    return total;
  }, 0);
}

export function calculateIndependentTime(
  lessonStart: Date, 
  lessonEnd: Date, 
  intervals: TimeInterval[]
): number {
  const now = new Date();
  const currentTime = now > lessonEnd ? lessonEnd : now;
  const elapsedTime = Math.floor((currentTime.getTime() - lessonStart.getTime()) / (1000 * 60));
  const activeTime = calculateTotalActiveTime(intervals);
  return Math.max(0, elapsedTime - activeTime);
}

export function calculateIdleTime(intervals: TimeInterval[]): number {
  if (intervals.length === 0) return 0;

  const lastInterval = intervals[intervals.length - 1];
  if (!lastInterval.endTime) return 0;

  const now = new Date();
  return Math.floor((now.getTime() - lastInterval.endTime.getTime()) / (1000 * 60));
}

export function isValidUrl(url: string): boolean {
  if (!url.trim()) return false;
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function calculateTotalLessonTime(lessons: { startTime: Date; endTime: Date }[]): number {
  if (lessons.length === 0) return 0;

  const sortedLessons = [...lessons].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  let totalTime = 0;
  let currentStart = sortedLessons[0].startTime;
  let currentEnd = sortedLessons[0].endTime;

  for (let i = 1; i < sortedLessons.length; i++) {
    const lesson = sortedLessons[i];
    if (lesson.startTime <= currentEnd) {
      currentEnd = new Date(Math.max(currentEnd.getTime(), lesson.endTime.getTime()));
    } else {
      totalTime += Math.floor((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60));
      currentStart = lesson.startTime;
      currentEnd = lesson.endTime;
    }
  }

  totalTime += Math.floor((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60));

  return totalTime;
}