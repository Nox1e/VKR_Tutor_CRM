import { useState, useMemo } from 'react';
import { ToastAction } from '@/components/ui/toast';
import { Navigation } from '@/components/Navigation';
import { EditIntervalDialog } from '@/components/EditIntervalDialog';
import { LessonsPageHeader } from '@/features/lessons-page/LessonsPageHeader';
import { TodayLessonsPanel } from '@/features/lessons-page/TodayLessonsPanel';
import { LessonDetailsPanel } from '@/features/lessons-page/LessonDetailsPanel';
import { DayOverviewPanel } from '@/features/lessons-page/DayOverviewPanel';
import { useAutoMaterializeCurrentWeek } from '@/features/calendar-page/useAutoMaterializeCurrentWeek';
import { toast } from '@/hooks/use-toast';
import { addMinutes } from '@/utils/timeUtils';
import type { AppState, TimeInterval } from '@/types';
import {
  useStudents,
  useLessons,
  useScheduledLessons,
  useCreateStudent,
  useCreateLesson,
  useUpdateLesson,
  useDeleteStudent,
  useDeleteLesson,
  useCompleteLesson,
  useExportData,
  useImportData,
  useClearData,
  usePreparations,
  useLessonIntervalsMap,
  useCreateInterval,
  useUpdateInterval,
  useDeleteInterval,
} from '@/hooks/useApi';

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Загружаем данные...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Index() {
  const [editingInterval, setEditingInterval] = useState<TimeInterval | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<string | undefined>();

  const { data: students = [], isLoading: studentsLoading } = useStudents();
  const { data: lessons = [], isLoading: lessonsLoading } = useLessons();
  const { data: scheduledLessons = [], isLoading: scheduledLessonsLoading } = useScheduledLessons();
  const { data: preparations = [], isLoading: preparationsLoading } = usePreparations();

  const createStudent = useCreateStudent();
  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  useDeleteStudent();
  const deleteLessonMutation = useDeleteLesson();
  const completeLessonMutation = useCompleteLesson();
  useExportData();
  const importData = useImportData();
  const clearData = useClearData();
  const createIntervalMutation = useCreateInterval();
  const updateIntervalMutation = useUpdateInterval();
  const deleteIntervalMutation = useDeleteInterval();

  useAutoMaterializeCurrentWeek(scheduledLessons, lessons);

  const todayLessons = useMemo(() => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    return lessons.filter((lesson) => {
      const lessonDate = new Date(lesson.startTime);
      return lessonDate >= todayStart && lessonDate < todayEnd && lesson.status !== 'archived';
    });
  }, [lessons]);

  // Only fetch intervals for lessons actually displayed on this page.
  // Fetching for every non-archived lesson (as we did before auto-materialisation
  // created many future planned lessons) balloons into dozens/hundreds of
  // queries and trips the backend's per-route rate limit on every mutation.
  const neededIntervalLessonIds = useMemo(() => {
    const ids = new Set<string>();
    todayLessons.forEach((l) => ids.add(l.id));
    if (selectedLessonId) ids.add(selectedLessonId);
    return Array.from(ids);
  }, [todayLessons, selectedLessonId]);
  const { intervalsMap } = useLessonIntervalsMap(neededIntervalLessonIds);
  const getLessonIntervals = (lessonId: string) => intervalsMap[lessonId] ?? [];

  const selectedLesson = lessons.find((l) => l.id === selectedLessonId);

  const getNextPreparationForStudent = (studentId: string) => {
    const now = new Date();
    const relevant = lessons
      .filter(
        (lesson) =>
          lesson.studentId === studentId &&
          lesson.preparationId &&
          lesson.status !== 'archived' &&
          lesson.endTime >= now,
      )
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    return relevant.length > 0 ? preparations.find((p) => p.id === relevant[0].preparationId) ?? null : null;
  };

  const addStudent = (name: string): string => {
    const studentId = `student_${Date.now()}`;
    createStudent.mutate({ name });
    return studentId;
  };

  const addLesson = (lesson: Parameters<typeof createLesson.mutate>[0]) => {
    createLesson.mutate(lesson);
  };

  const toggleTimer = (lessonId: string) => {
    const lesson = lessons.find((l) => l.id === lessonId);
    if (!lesson) return;

    const now = new Date();
    const lessonIntervals = getLessonIntervals(lessonId);
    const activeInterval = lessonIntervals.find((interval) => !interval.endTime);

    if (activeInterval) {
      updateIntervalMutation.mutate({
        id: activeInterval.id,
        lessonId,
        interval: { startTime: activeInterval.startTime, endTime: now },
      });

      if (now > lesson.endTime) {
        setTimeout(() => {
          toast({
            title: 'Урок завершился',
            description: 'Хотите продлить урок на 15 минут?',
            action: (
              <ToastAction altText="Продлить урок" onClick={() => extendLesson(lessonId, 15)}>
                Продлить
              </ToastAction>
            ),
          });
        }, 100);
      }
    } else {
      createIntervalMutation.mutate({ lessonId, interval: { startTime: now } });
    }
  };

  const extendLesson = (_lessonId: string, minutes: number) => {
    toast({ title: 'Урок продлен', description: `Урок продлен на ${minutes} минут` });
    void addMinutes;
  };

  const openMeetLink = (lessonId: string) => {
    const lesson = lessons.find((l) => l.id === lessonId);
    if (!lesson?.meetLink) {
      toast({
        title: 'Ссылка отсутствует',
        description: 'Пожалуйста, добавьте ссылку на звонок',
        variant: 'destructive',
      });
      return;
    }

    const hasActive = getLessonIntervals(lessonId).some((interval) => !interval.endTime);
    if (!hasActive) {
      createIntervalMutation.mutate(
        { lessonId, interval: { startTime: new Date() } },
        {
          onSuccess: () =>
            toast({
              title: 'Таймер запущен',
              description: 'Таймер автоматически запущен при открытии ссылки на звонок',
            }),
        },
      );
    }
    window.open(lesson.meetLink, '_blank');
  };

  const updateMeetLink = (lessonId: string, meetLink: string) => {
    updateLesson.mutate({ id: lessonId, lesson: { meetLink } });
  };

  const archiveLesson = async (lessonId: string) => {
    const lesson = lessons.find((l) => l.id === lessonId);
    if (!lesson) return;

    try {
      await completeLessonMutation.mutateAsync(lessonId);
      await updateLesson.mutateAsync({ id: lessonId, lesson: { status: 'archived' } });
      toast({ title: 'Урок архивирован', description: 'Урок перемещен в архив' });
      if (selectedLessonId === lessonId) setSelectedLessonId(undefined);
    } catch (error) {
      toast({
        title: 'Ошибка архивирования',
        description: (error as Error).message || 'Не удалось архивировать урок',
        variant: 'destructive',
      });
    }
  };

  const editInterval = (interval: TimeInterval) => {
    setEditingInterval(interval);
    setEditDialogOpen(true);
  };

  const saveInterval = (intervalId: string, startTime: Date, endTime?: Date) => {
    const lessonId = Object.keys(intervalsMap).find((lid) =>
      intervalsMap[lid].some((iv) => iv.id === intervalId),
    );
    if (!lessonId) return;
    updateIntervalMutation.mutate({ id: intervalId, lessonId, interval: { startTime, endTime } });
  };

  const editLesson = (
    lessonId: string,
    updates: { startTime: Date; endTime: Date; meetLink?: string; comment?: string },
  ) => {
    updateLesson.mutate({
      id: lessonId,
      lesson: {
        startTime: updates.startTime.toISOString(),
        endTime: updates.endTime.toISOString(),
        meetLink: updates.meetLink,
        comment: updates.comment,
      },
    });
  };

  const handleImportData = (data: AppState) => {
    const now = new Date().toISOString();
    importData.mutate({
      students: data.students.map((s) => ({ id: s.id, name: s.name, createdAt: now })),
      lessons: data.lessons.map((l) => ({
        id: l.id,
        studentId: l.studentId,
        startTime: l.startTime.toISOString(),
        endTime: l.endTime.toISOString(),
        meetLink: l.meetLink,
        comment: l.comment,
        isScheduled: l.isScheduled || false,
        status: l.status,
        createdAt: now,
      })),
      scheduledLessons: data.scheduledLessons.map((sl) => ({
        id: sl.id,
        studentId: sl.studentId,
        dayOfWeek: sl.dayOfWeek,
        startTime: sl.startTime,
        endTime: sl.endTime,
        meetLink: sl.meetLink,
        comment: sl.comment,
        createdAt: now,
      })),
      intervals: data.lessons.flatMap((l) =>
        l.intervals.map((i) => ({
          id: i.id,
          lessonId: l.id,
          startTime: i.startTime.toISOString(),
          endTime: i.endTime?.toISOString(),
          createdAt: now,
        })),
      ),
    });
  };

  if (studentsLoading || lessonsLoading || scheduledLessonsLoading || preparationsLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <LessonsPageHeader students={students} onAddLesson={addLesson} onAddStudent={addStudent} />

        <div className="grid grid-cols-12 gap-6 min-h-[calc(100vh-200px)]">
          <TodayLessonsPanel
            students={students}
            todayLessons={todayLessons}
            selectedLessonId={selectedLessonId}
            getLessonIntervals={getLessonIntervals}
            getNextPreparationForStudent={getNextPreparationForStudent}
            onSelectLesson={setSelectedLessonId}
            onToggleTimer={toggleTimer}
            onOpenMeet={openMeetLink}
            onDeleteLesson={(id) => deleteLessonMutation.mutate(id)}
            onArchiveLesson={archiveLesson}
          />

          <LessonDetailsPanel
            selectedLesson={selectedLesson}
            students={students}
            intervals={selectedLesson ? getLessonIntervals(selectedLesson.id) : []}
            onToggleTimer={() => selectedLesson && toggleTimer(selectedLesson.id)}
            onUpdateMeetLink={(meetLink) => selectedLesson && updateMeetLink(selectedLesson.id, meetLink)}
            onEditInterval={editInterval}
            onDeleteInterval={(intervalId) => {
              if (selectedLesson) {
                deleteIntervalMutation.mutate({ id: intervalId, lessonId: selectedLesson.id });
              }
            }}
            onEditLesson={editLesson}
          />

          <DayOverviewPanel
            todayLessons={todayLessons}
            students={students}
            lessons={lessons}
            scheduledLessons={scheduledLessons}
            selectedLessonId={selectedLessonId}
            onImportData={handleImportData}
            onClearData={() => clearData.mutate()}
          />
        </div>
      </div>

      <EditIntervalDialog
        interval={editingInterval}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={saveInterval}
      />
    </div>
  );
}
