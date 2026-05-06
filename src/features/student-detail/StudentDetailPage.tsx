import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useAddPayment,
  useApplyNextTrajectoryItem,
  useAssignHomeworkToLesson,
  useAssignHomeworkToScheduledLesson,
  useAssignPreparationToLesson,
  useAssignPreparationToScheduledLesson,
  useCompleteLesson,
  useCreateLesson,
  useDeleteLesson,
  useDeletePaymentHistory,
  useDeleteStudentTrial,
  useSetPaidLessonsCount,
  useToggleLessonPayment,
  useTrajectory,
  useUpdateLesson,
  useUpdateStudent,
} from '@/hooks/useApi';
import { transformApiData, transformToApi } from '@/api';
import { StudentProfileSection } from './components/StudentProfileSection';
import { StudentFinancialSection } from './components/StudentFinancialSection';
import { StudentLessonsSection } from './components/StudentLessonsSection';
import { StudentTrialsSection } from './components/StudentTrialsSection';
import { StudentDetailHeader } from './components/StudentDetailHeader';
import { StudentDialogsHost } from './components/StudentDialogsHost';
import { useStudentDetail } from './hooks/use-student-detail';
import { useStudentDetailDialogs } from './hooks/use-student-detail-dialogs';
import { useTrialResults } from './hooks/use-trial-results';
import { getNextDateForDayOfWeek } from './utils/schedule';
import type { Homework, Lesson, Preparation, ScheduledLesson, Student, StudentTrial } from '@/types';

interface SelectionTarget {
  id: string;
  title: string;
  type: 'lesson' | 'scheduled';
}

const INITIAL_VISIBLE_LESSONS = 4;

export const StudentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    student,
    isLoading,
    isError,
    schedule,
    lessons,
    scheduledLessons,
    preparations,
    homeworks,
    paymentHistory,
    completedTrials,
    nextTrial,
    studentTrials,
    trialsCatalogQuery,
    lessonsQuery,
    scheduledLessonsQuery,
    paymentHistoryQuery,
    studentTrialsQuery,
  } = useStudentDetail(id);

  const trialsCatalog = trialsCatalogQuery.data ?? [];

  const [editedStudent, setEditedStudent] = useState<Student | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [visibleLessonsCount, setVisibleLessonsCount] = useState(INITIAL_VISIBLE_LESSONS);
  const [selectedPreparationTarget, setSelectedPreparationTarget] = useState<SelectionTarget | null>(null);
  const [selectedHomeworkTarget, setSelectedHomeworkTarget] = useState<SelectionTarget | null>(null);
  const [lessonToDelete, setLessonToDelete] = useState<{
    id: string;
    startTime: Date;
    endTime: Date;
    title?: string;
    isPaid?: boolean;
  } | null>(null);
  const [lessonToEdit, setLessonToEdit] = useState<Lesson | null>(null);
  const [selectedTrial, setSelectedTrial] = useState<StudentTrial | null>(null);

  const dialogs = useStudentDetailDialogs();
  const { results: trialResults, ensureLoaded: ensureTrialResultLoaded } = useTrialResults(completedTrials);

  const trajectoryQuery = useTrajectory(id);
  const trajectoryNextItem = useMemo(() => {
    const items = trajectoryQuery.data ?? [];
    return items.find((item) => item.status === 'queued') ?? null;
  }, [trajectoryQuery.data]);
  const [trajectoryPromptDismissedFor, setTrajectoryPromptDismissedFor] = useState<string | null>(null);
  const applyNextTrajectoryMutation = useApplyNextTrajectoryItem();

  const updateStudentMutation = useUpdateStudent();
  const createLessonMutation = useCreateLesson();
  const updateLessonMutation = useUpdateLesson();
  const toggleLessonPaymentMutation = useToggleLessonPayment();
  const addPaymentMutation = useAddPayment();
  const setPaidLessonsCountMutation = useSetPaidLessonsCount();
  const deleteLessonMutation = useDeleteLesson();
  const deletePaymentHistoryMutation = useDeletePaymentHistory();
  const assignPreparationToLessonMutation = useAssignPreparationToLesson();
  const assignPreparationToScheduledLessonMutation = useAssignPreparationToScheduledLesson();
  const assignHomeworkToLessonMutation = useAssignHomeworkToLesson();
  const assignHomeworkToScheduledLessonMutation = useAssignHomeworkToScheduledLesson();
  const completeLessonMutation = useCompleteLesson();
  const deleteStudentTrialMutation = useDeleteStudentTrial();

  useEffect(() => {
    if (student) {
      setEditedStudent({ ...student });
      setIsEditing(false);
      setVisibleLessonsCount(INITIAL_VISIBLE_LESSONS);
    } else {
      setEditedStudent(null);
    }
  }, [student]);

  const preparationMap = useMemo(() => {
    const map = new Map<string, Preparation>();
    preparations.forEach((p) => map.set(p.id, p));
    return map;
  }, [preparations]);

  const homeworkMap = useMemo(() => {
    const map = new Map<string, Homework>();
    homeworks.forEach((h) => map.set(h.id, h));
    return map;
  }, [homeworks]);

  const lessonsById = useMemo(() => {
    const map = new Map<string, Lesson>();
    lessons.forEach((l) => map.set(l.id, l));
    return map;
  }, [lessons]);

  const scheduledLessonsById = useMemo(() => {
    const map = new Map<string, ScheduledLesson>();
    scheduledLessons.forEach((l) => map.set(l.id, l));
    return map;
  }, [scheduledLessons]);

  const getPreparationTitle = useCallback(
    (preparationId?: string | null) => (preparationId ? preparationMap.get(preparationId)?.title ?? null : null),
    [preparationMap],
  );

  const getHomeworkTitle = useCallback(
    (homeworkId?: string | null) => (homeworkId ? homeworkMap.get(homeworkId)?.title ?? null : null),
    [homeworkMap],
  );

  const updateField = useCallback(<K extends keyof Student>(field: K, value: Student[K] | undefined) => {
    setEditedStudent((prev) => (prev ? { ...prev, [field]: value } : prev));
  }, []);

  const resolvePreparationForTarget = useCallback(
    (target: SelectionTarget | null) => {
      if (!target) return undefined;
      const preparationId =
        target.type === 'lesson'
          ? lessonsById.get(target.id)?.preparationId
          : scheduledLessonsById.get(target.id)?.preparationId;
      return preparationId ? preparationMap.get(preparationId) : undefined;
    },
    [lessonsById, scheduledLessonsById, preparationMap],
  );

  const resolveHomeworkForTarget = useCallback(
    (target: SelectionTarget | null) => {
      if (!target) return undefined;
      const homeworkId =
        target.type === 'lesson'
          ? lessonsById.get(target.id)?.homeworkId
          : scheduledLessonsById.get(target.id)?.homeworkId;
      return homeworkId ? homeworkMap.get(homeworkId) : undefined;
    },
    [lessonsById, scheduledLessonsById, homeworkMap],
  );

  const handleSave = () => {
    if (!student || !editedStudent) return;
    updateStudentMutation.mutate(
      { id: student.id, student: transformToApi.student(editedStudent) },
      { onSuccess: () => setIsEditing(false) },
    );
  };

  const handleCancel = () => {
    if (student) setEditedStudent({ ...student });
    setIsEditing(false);
  };

  const handleSelectPreparationTarget = (target: SelectionTarget) => {
    setSelectedPreparationTarget(target);
    dialogs.set('preparation', true);
  };

  const handleSelectHomeworkTarget = (target: SelectionTarget) => {
    setSelectedHomeworkTarget(target);
    dialogs.set('homework', true);
  };

  const handleAssignPreparation = (preparationId: string | null) => {
    if (!selectedPreparationTarget) return;
    if (selectedPreparationTarget.type === 'lesson') {
      assignPreparationToLessonMutation.mutate({ lessonId: selectedPreparationTarget.id, preparationId });
    } else {
      assignPreparationToScheduledLessonMutation.mutate({
        lessonId: selectedPreparationTarget.id,
        preparationId,
      });
    }
  };

  const handleAssignHomework = (homeworkId: string | null) => {
    if (!selectedHomeworkTarget) return;
    if (selectedHomeworkTarget.type === 'lesson') {
      assignHomeworkToLessonMutation.mutate({ lessonId: selectedHomeworkTarget.id, homeworkId });
    } else {
      assignHomeworkToScheduledLessonMutation.mutate({
        lessonId: selectedHomeworkTarget.id,
        homeworkId,
      });
    }
  };

  const handleAddCompletedLesson = (lessonData: {
    studentId: string;
    startTime: Date;
    endTime: Date;
    meetLink?: string;
    comment?: string;
    status: 'archived';
  }) => {
    createLessonMutation.mutate(lessonData, {
      onSuccess: async (createdLesson) => {
        try {
          await completeLessonMutation.mutateAsync(createdLesson.id);
        } catch {
          // lesson created but trajectory not consumed — non-critical
        }
      },
    });
  };

  const handleAddPayment = ({ lessonsCount, amount }: { lessonsCount: number; amount: number }) => {
    if (!id) return;
    addPaymentMutation.mutate({ studentId: id, lessonsCount, amount });
  };

  const handleSavePaidLessonsCount = (count: number) => {
    if (!id) return;
    setPaidLessonsCountMutation.mutate(
      { studentId: id, count },
      {
        onSuccess: (updatedStudent) => {
          const dto = transformApiData.student(updatedStudent);
          setEditedStudent((prev) => (prev ? { ...prev, paidLessonsCount: dto.paidLessonsCount } : dto));
        },
      },
    );
  };

  const handleDeleteLessonRequest = (lesson: {
    id: string;
    startTime: Date;
    endTime: Date;
    title?: string;
    isPaid?: boolean;
  }) => {
    setLessonToDelete(lesson);
    dialogs.set('deleteLesson', true);
  };

  const handleEditLesson = (lesson: Lesson) => {
    setLessonToEdit(lesson);
    dialogs.set('editLesson', true);
  };

  const handleSaveLesson = (
    lessonId: string,
    updates: { startTime: Date; endTime: Date; meetLink?: string; comment?: string },
  ) => {
    updateLessonMutation.mutate({ id: lessonId, lesson: updates });
  };

  const handleConfirmDeleteLesson = () => {
    if (lessonToDelete) deleteLessonMutation.mutate(lessonToDelete.id);
  };

  const handleDeletePaymentHistory = (paymentId: string) => {
    deletePaymentHistoryMutation.mutate(paymentId);
  };

  const handleEditTrial = (trial: StudentTrial) => {
    setSelectedTrial(trial);
    dialogs.set('editTrial', true);
  };

  const handleCompleteTrial = (trial: StudentTrial) => {
    setSelectedTrial(trial);
    dialogs.set('completeTrial', true);
  };

  const handleEditTrialResult = async (trial: StudentTrial) => {
    setSelectedTrial(trial);
    await ensureTrialResultLoaded(trial.id);
    dialogs.set('editTrialResult', true);
  };

  const handleDeleteTrial = (trialId: string) => {
    deleteStudentTrialMutation.mutate(trialId);
    setSelectedTrial((prev) => (prev?.id === trialId ? null : prev));
  };

  const trajectoryItemForPrompt =
    trajectoryNextItem && trajectoryNextItem.id !== trajectoryPromptDismissedFor
      ? trajectoryNextItem
      : null;

  const handleApplyTrajectoryNext = () => {
    if (!id || !trajectoryNextItem) return;
    const next = schedule.nextLesson;
    if (!next) return;
    const target =
      next.type === 'existing'
        ? { type: 'lesson' as const, id: (next.lesson as Lesson).id }
        : { type: 'scheduled' as const, id: (next.lesson as ScheduledLesson).id };
    applyNextTrajectoryMutation.mutate({ studentId: id, target });
  };

  const handleDismissTrajectoryPrompt = () => {
    if (trajectoryNextItem) {
      setTrajectoryPromptDismissedFor(trajectoryNextItem.id);
    }
  };

  const handleCopyReminder = async () => {
    if (!editedStudent) return;
    const { currentLesson, nextLesson } = schedule;
    const nameParts = editedStudent.name.split(' ');
    const studentName = nameParts.length > 1 ? nameParts[1] : nameParts[0];

    let lessonTime: string | null = null;
    if (currentLesson) {
      lessonTime = format(currentLesson.startTime, 'HH:mm', { locale: ru });
    } else if (nextLesson?.type === 'existing') {
      lessonTime = format((nextLesson.lesson as Lesson).startTime, 'HH:mm', { locale: ru });
    } else if (nextLesson?.type === 'scheduled') {
      lessonTime = (nextLesson.lesson as ScheduledLesson).startTime;
    }
    if (!lessonTime) return;

    const message = `Привет, ${studentName}!\nНапоминаю про занятие в ${lessonTime}.\nС подготовкой все получилось? Есть какие-то вопросы?`;
    try {
      await navigator.clipboard.writeText(message);
      toast({ title: 'Скопировано!', description: 'Текст напоминания скопирован в буфер обмена' });
    } catch (error) {
      console.error('Ошибка при копировании напоминания:', error);
      toast({ title: 'Ошибка', description: 'Не удалось скопировать текст', variant: 'destructive' });
    }
  };

  const handleCopyTrial = async (trial: StudentTrial) => {
    try {
      const trialData = trialsCatalog.find((item) => item.id === trial.trialId);
      if (!trialData) {
        toast({
          title: 'Ошибка',
          description: 'Пробник не найден в базе данных',
          variant: 'destructive',
        });
        return;
      }
      const parts: string[] = [
        `🏆 ПРОБНИК №${getTrialNumber(trial)}🏆`,
        `Решить пробник по ссылке - ${trialData.link}`,
      ];
      if (trial.comment) parts.push(`Комментарии по решению: ${trial.comment}`);
      if (trial.complications) parts.push(`Усложнения: ${trial.complications}`);
      parts.push(`Дедлайн: ${format(new Date(trial.deadline), 'dd.MM')}`);
      parts.push('! Скриншот результата обязательно пришли мне !');

      await navigator.clipboard.writeText(parts.join('\n\n'));
      toast({ title: 'Скопировано!', description: 'Текст пробника скопирован в буфер обмена' });
    } catch (error) {
      console.error('Ошибка при копировании пробника:', error);
      toast({ title: 'Ошибка', description: 'Не удалось скопировать текст', variant: 'destructive' });
    }
  };

  const getTrialNumber = useCallback(
    (trial: StudentTrial) => {
      const sorted = [...studentTrials].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      return sorted.findIndex((item) => item.id === trial.id) + 1;
    },
    [studentTrials],
  );

  const isDeadlineOverdue = useCallback((deadline: Date) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    now.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);
    return deadlineDate < now;
  }, []);

  if (!id) return null;

  if (isLoading && !student) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">Загружаем информацию о студенте...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !student || !editedStudent) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Студент не найден</h1>
            <Button onClick={() => navigate('/students')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Вернуться к списку студентов
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const today = new Date();
  const currentPreparation = resolvePreparationForTarget(selectedPreparationTarget) ?? null;
  const currentHomework = resolveHomeworkForTarget(selectedHomeworkTarget) ?? null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <StudentDetailHeader
          student={student}
          isEditing={isEditing}
          isSaving={updateStudentMutation.isPending}
          onBack={() => navigate('/students')}
          onStartEdit={() => setIsEditing(true)}
          onCancel={handleCancel}
          onSave={handleSave}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <StudentProfileSection
            student={editedStudent}
            isEditing={isEditing}
            onChange={updateField}
            onPhotoChange={(value) => updateField('photoData', value ?? undefined)}
          />

          <StudentFinancialSection
            student={editedStudent}
            isEditing={isEditing}
            onChange={updateField}
            onAddPaymentClick={() => dialogs.set('payment', true)}
            onPaymentHistoryClick={() => dialogs.set('paymentHistory', true)}
            onEditPaidLessonsClick={() => dialogs.set('editPaidLessons', true)}
          />
        </div>

        <StudentLessonsSection
          isLoading={lessonsQuery.isLoading || scheduledLessonsQuery.isLoading}
          nextLesson={schedule.nextLesson}
          currentLesson={schedule.currentLesson}
          completedLessonsCount={schedule.completedLessonsCount}
          archivedLessons={schedule.archivedLessons}
          visibleLessonsCount={visibleLessonsCount}
          onLoadMoreLessons={() => setVisibleLessonsCount((prev) => prev + 4)}
          onSelectPreparationTarget={handleSelectPreparationTarget}
          onSelectHomeworkTarget={handleSelectHomeworkTarget}
          onTogglePayment={(lessonId, isPaid) =>
            toggleLessonPaymentMutation.mutate({ lessonId, isPaid: !isPaid })
          }
          onAddCompletedLessonClick={() => dialogs.set('completedLesson', true)}
          onTaskProgressClick={() => dialogs.set('taskProgress', true)}
          onLearningTrajectoryClick={() => dialogs.set('learningTrajectory', true)}
          onDeleteLessonRequest={handleDeleteLessonRequest}
          onLessonClick={handleEditLesson}
          onCopyReminder={handleCopyReminder}
          getPreparationTitle={getPreparationTitle}
          getHomeworkTitle={getHomeworkTitle}
          getNextDateForDayOfWeek={getNextDateForDayOfWeek}
          todayDate={today}
          trajectoryNextItem={trajectoryItemForPrompt}
          onApplyTrajectoryNext={handleApplyTrajectoryNext}
          onDismissTrajectoryPrompt={handleDismissTrajectoryPrompt}
          isApplyingTrajectory={applyNextTrajectoryMutation.isPending}
        />

        <StudentTrialsSection
          isLoading={studentTrialsQuery.isLoading}
          nextTrial={nextTrial}
          completedTrials={completedTrials}
          onAddTrialClick={() => dialogs.set('addTrial', true)}
          onEditTrial={handleEditTrial}
          onCompleteTrial={handleCompleteTrial}
          onCopyTrial={handleCopyTrial}
          onEditTrialResult={handleEditTrialResult}
          onDeleteTrial={handleDeleteTrial}
          getTrialNumber={getTrialNumber}
          isDeadlineOverdue={isDeadlineOverdue}
          trialResults={trialResults}
        />
      </div>

      <StudentDialogsHost
        studentId={id}
        student={student}
        lessons={lessons}
        preparations={preparations}
        paymentHistory={paymentHistory}
        isPaymentHistoryLoading={paymentHistoryQuery.isLoading}
        trialResults={trialResults}
        currentPreparation={currentPreparation}
        currentHomework={currentHomework}
        selectedPreparationTarget={selectedPreparationTarget}
        selectedHomeworkTarget={selectedHomeworkTarget}
        selectedTrial={selectedTrial}
        lessonToEdit={lessonToEdit}
        lessonToDelete={lessonToDelete}
        dialogs={dialogs}
        onAssignPreparation={handleAssignPreparation}
        onAssignHomework={handleAssignHomework}
        onSaveLesson={handleSaveLesson}
        onAddCompletedLesson={handleAddCompletedLesson}
        onAddPayment={handleAddPayment}
        onConfirmDeleteLesson={handleConfirmDeleteLesson}
        onDeletePayment={handleDeletePaymentHistory}
        onSavePaidLessonsCount={handleSavePaidLessonsCount}
        onClearSelectedTrial={() => setSelectedTrial(null)}
      />
    </div>
  );
};

export default StudentDetailPage;
