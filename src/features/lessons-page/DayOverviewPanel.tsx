import { DaySummary } from '@/components/DaySummary';
import { DataManager } from '@/components/DataManager';
import type { AppState, Lesson, ScheduledLesson, Student } from '@/types';

interface Props {
  todayLessons: Lesson[];
  students: Student[];
  lessons: Lesson[];
  scheduledLessons: ScheduledLesson[];
  selectedLessonId?: string;
  onImportData: (data: AppState) => void;
  onClearData: () => void;
}

export function DayOverviewPanel({
  todayLessons,
  students,
  lessons,
  scheduledLessons,
  selectedLessonId,
  onImportData,
  onClearData,
}: Props) {
  return (
    <div className="col-span-3 space-y-4">
      <DaySummary lessons={todayLessons} students={students} />
      <DataManager
        appState={{ students, lessons, scheduledLessons, selectedLessonId } as AppState}
        onImportData={onImportData}
        onClearData={onClearData}
      />
    </div>
  );
}
