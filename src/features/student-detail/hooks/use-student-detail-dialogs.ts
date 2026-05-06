import { useCallback, useState } from 'react';

export const STUDENT_DETAIL_DIALOG_KEYS = [
  'taskProgress',
  'learningTrajectory',
  'preparation',
  'homework',
  'completedLesson',
  'payment',
  'deleteLesson',
  'paymentHistory',
  'editPaidLessons',
  'editLesson',
  'addTrial',
  'editTrial',
  'completeTrial',
  'editTrialResult',
] as const;

export type StudentDetailDialogKey = (typeof STUDENT_DETAIL_DIALOG_KEYS)[number];

export type StudentDetailDialogState = Record<StudentDetailDialogKey, boolean> & {
  open: (key: StudentDetailDialogKey) => void;
  close: (key: StudentDetailDialogKey) => void;
  set: (key: StudentDetailDialogKey, value: boolean) => void;
};

const initialState: Record<StudentDetailDialogKey, boolean> = STUDENT_DETAIL_DIALOG_KEYS.reduce(
  (acc, key) => ({ ...acc, [key]: false }),
  {} as Record<StudentDetailDialogKey, boolean>,
);

export function useStudentDetailDialogs(): StudentDetailDialogState {
  const [state, setState] = useState<Record<StudentDetailDialogKey, boolean>>(initialState);

  const open = useCallback((key: StudentDetailDialogKey) => {
    setState((prev) => ({ ...prev, [key]: true }));
  }, []);

  const close = useCallback((key: StudentDetailDialogKey) => {
    setState((prev) => ({ ...prev, [key]: false }));
  }, []);

  const set = useCallback((key: StudentDetailDialogKey, value: boolean) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  return { ...state, open, close, set };
}
