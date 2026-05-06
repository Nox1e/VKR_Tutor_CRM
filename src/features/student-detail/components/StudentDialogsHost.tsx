import { AddCompletedLessonDialog } from '@/components/AddCompletedLessonDialog';
import { AddPaymentDialog } from '@/components/AddPaymentDialog';
import { AddStudentTrialDialog } from '@/components/AddStudentTrialDialog';
import { AssignHomeworkDialog } from '@/components/AssignHomeworkDialog';
import { AssignPreparationDialog } from '@/components/AssignPreparationDialog';
import { CompleteTrialDialog } from '@/components/CompleteTrialDialog';
import { DeleteLessonDialog } from '@/components/DeleteLessonDialog';
import { EditLessonDialog } from '@/components/EditLessonDialog';
import { EditPaidLessonsDialog } from '@/components/EditPaidLessonsDialog';
import { EditStudentTrialDialog } from '@/components/EditStudentTrialDialog';
import { EditTrialResultDialog } from '@/components/EditTrialResultDialog';
import { LearningTrajectoryDialog } from '@/components/LearningTrajectoryDialog';
import { PaymentHistoryDialog } from '@/components/PaymentHistoryDialog';
import { TaskProgressDialog } from '@/components/TaskProgressDialog';
import type {
  Homework,
  Lesson,
  PaymentHistory,
  Preparation,
  Student,
  StudentTrial,
  TrialResult,
} from '@/types';
import type { StudentDetailDialogState } from '../hooks/use-student-detail-dialogs';

interface SelectionTarget {
  id: string;
  title: string;
  type: 'lesson' | 'scheduled';
}

interface Props {
  studentId: string;
  student: Student;
  lessons: Lesson[];
  preparations: Preparation[];
  paymentHistory: PaymentHistory[];
  isPaymentHistoryLoading: boolean;
  trialResults: Record<string, TrialResult | undefined>;
  currentPreparation: Preparation | null;
  currentHomework: Homework | null;
  selectedPreparationTarget: SelectionTarget | null;
  selectedHomeworkTarget: SelectionTarget | null;
  selectedTrial: StudentTrial | null;
  lessonToEdit: Lesson | null;
  lessonToDelete: {
    id: string;
    startTime: Date;
    endTime: Date;
    title?: string;
    isPaid?: boolean;
  } | null;

  dialogs: StudentDetailDialogState;

  onAssignPreparation: (preparationId: string | null) => void;
  onAssignHomework: (homeworkId: string | null) => void;
  onSaveLesson: (
    lessonId: string,
    updates: { startTime: Date; endTime: Date; meetLink?: string; comment?: string },
  ) => void;
  onAddCompletedLesson: (data: {
    studentId: string;
    startTime: Date;
    endTime: Date;
    meetLink?: string;
    comment?: string;
    status: 'archived';
  }) => void;
  onAddPayment: (data: { lessonsCount: number; amount: number }) => void;
  onConfirmDeleteLesson: () => void;
  onDeletePayment: (paymentId: string) => void;
  onSavePaidLessonsCount: (count: number) => void;
  onClearSelectedTrial: () => void;
}

export function StudentDialogsHost({
  studentId,
  student,
  lessons,
  preparations,
  paymentHistory,
  isPaymentHistoryLoading,
  trialResults,
  currentPreparation,
  currentHomework,
  selectedPreparationTarget,
  selectedHomeworkTarget,
  selectedTrial,
  lessonToEdit,
  lessonToDelete,
  dialogs,
  onAssignPreparation,
  onAssignHomework,
  onSaveLesson,
  onAddCompletedLesson,
  onAddPayment,
  onConfirmDeleteLesson,
  onDeletePayment,
  onSavePaidLessonsCount,
  onClearSelectedTrial,
}: Props) {
  return (
    <>
      <TaskProgressDialog
        open={dialogs.taskProgress}
        onOpenChange={(o) => dialogs.set('taskProgress', o)}
        lessons={lessons}
        preparations={preparations}
        trialResults={Object.values(trialResults).filter((r): r is TrialResult => !!r)}
        student={student}
      />

      <LearningTrajectoryDialog
        open={dialogs.learningTrajectory}
        onOpenChange={(o) => dialogs.set('learningTrajectory', o)}
        student={student}
      />

      {selectedPreparationTarget ? (
        <AssignPreparationDialog
          open={dialogs.preparation}
          onOpenChange={(o) => dialogs.set('preparation', o)}
          lessonId={selectedPreparationTarget.id}
          lessonTitle={selectedPreparationTarget.title}
          currentPreparation={currentPreparation}
          onAssign={onAssignPreparation}
        />
      ) : null}

      {selectedHomeworkTarget ? (
        <AssignHomeworkDialog
          open={dialogs.homework}
          onOpenChange={(o) => dialogs.set('homework', o)}
          lessonId={selectedHomeworkTarget.id}
          lessonTitle={selectedHomeworkTarget.title}
          currentHomework={currentHomework}
          onAssign={onAssignHomework}
        />
      ) : null}

      <EditLessonDialog
        open={dialogs.editLesson}
        onOpenChange={(o) => dialogs.set('editLesson', o)}
        lesson={lessonToEdit}
        onSave={onSaveLesson}
      />

      <AddCompletedLessonDialog
        open={dialogs.completedLesson}
        onOpenChange={(o) => dialogs.set('completedLesson', o)}
        studentId={studentId}
        onAdd={onAddCompletedLesson}
      />

      <AddPaymentDialog
        open={dialogs.payment}
        onOpenChange={(o) => dialogs.set('payment', o)}
        studentId={studentId}
        onAdd={onAddPayment}
      />

      <DeleteLessonDialog
        open={dialogs.deleteLesson}
        onOpenChange={(o) => dialogs.set('deleteLesson', o)}
        lesson={lessonToDelete}
        onConfirm={onConfirmDeleteLesson}
      />

      <PaymentHistoryDialog
        open={dialogs.paymentHistory}
        onOpenChange={(o) => dialogs.set('paymentHistory', o)}
        studentId={studentId}
        paymentHistory={paymentHistory}
        onDeletePayment={onDeletePayment}
        isLoading={isPaymentHistoryLoading}
      />

      <EditPaidLessonsDialog
        open={dialogs.editPaidLessons}
        onOpenChange={(o) => dialogs.set('editPaidLessons', o)}
        currentCount={student.paidLessonsCount ?? 0}
        onSave={onSavePaidLessonsCount}
      />

      <AddStudentTrialDialog
        open={dialogs.addTrial}
        onOpenChange={(o) => dialogs.set('addTrial', o)}
        studentId={studentId}
      />

      {selectedTrial ? (
        <EditStudentTrialDialog
          open={dialogs.editTrial}
          onOpenChange={(open) => {
            dialogs.set('editTrial', open);
            if (!open) onClearSelectedTrial();
          }}
          studentTrial={selectedTrial}
        />
      ) : null}

      {selectedTrial ? (
        <CompleteTrialDialog
          open={dialogs.completeTrial}
          onOpenChange={(open) => {
            dialogs.set('completeTrial', open);
            if (!open) onClearSelectedTrial();
          }}
          studentTrial={selectedTrial}
        />
      ) : null}

      {selectedTrial ? (
        <EditTrialResultDialog
          open={dialogs.editTrialResult}
          onOpenChange={(open) => {
            dialogs.set('editTrialResult', open);
            if (!open) onClearSelectedTrial();
          }}
          studentTrial={selectedTrial}
          trialResult={trialResults[selectedTrial.id] ?? null}
        />
      ) : null}
    </>
  );
}
