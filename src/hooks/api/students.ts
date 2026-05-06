import { useQuery } from '@tanstack/react-query';
import {
  studentsApi,
  paymentHistoryApi,
  transformApiData,
} from '@/api';
import type { StudentDto } from '@shared/api/contracts';
import { useApiMutation } from '@/api/factory';

export const studentKeys = {
  all: ['students'] as const,
  detail: (id?: string) => ['students', id] as const,
};

export const paymentHistoryKeys = {
  all: ['paymentHistory'] as const,
  byStudent: (id?: string) => ['paymentHistory', id] as const,
};

const lessonsKey = ['lessons'] as const;
const scheduledLessonsKey = ['scheduledLessons'] as const;

export const useStudents = () =>
  useQuery({
    queryKey: studentKeys.all,
    queryFn: studentsApi.getAll,
    select: (data) => data.map(transformApiData.student),
  });

export const useStudent = (studentId?: string) =>
  useQuery({
    queryKey: studentKeys.detail(studentId),
    enabled: !!studentId,
    queryFn: () => studentsApi.getById(studentId!),
    select: transformApiData.student,
  });

export const useCreateStudent = () =>
  useApiMutation({
    mutationFn: studentsApi.create,
    invalidateQueries: [studentKeys.all],
    successToast: { title: 'Ученик добавлен', description: 'Ученик успешно добавлен в базу данных' },
    errorToast: { title: 'Ошибка', description: 'Не удалось добавить ученика' },
  });

export const useUpdateStudent = () =>
  useApiMutation({
    mutationFn: ({ id, student }: { id: string; student: Partial<StudentDto> }) =>
      studentsApi.update(id, student),
    invalidateQueries: [studentKeys.all],
    successToast: { title: 'Ученик обновлен', description: 'Информация об ученике успешно обновлена' },
    errorToast: { title: 'Ошибка', description: 'Не удалось обновить ученика' },
  });

export const useDeleteStudent = () =>
  useApiMutation({
    mutationFn: studentsApi.delete,
    invalidateQueries: [studentKeys.all, lessonsKey, scheduledLessonsKey],
    successToast: { title: 'Ученик удален', description: 'Ученик и все его занятия удалены' },
    errorToast: { title: 'Ошибка', description: 'Не удалось удалить ученика' },
  });

export const useAddPayment = () =>
  useApiMutation({
    mutationFn: ({ studentId, lessonsCount, amount }: {
      studentId: string;
      lessonsCount: number;
      amount: number;
    }) => studentsApi.addPayment(studentId, { lessonsCount, amount }),
    invalidateQueries: [studentKeys.all, lessonsKey, paymentHistoryKeys.all],
    successToast: { title: 'Оплата добавлена', description: 'Оплаченные занятия успешно добавлены' },
    errorToast: { title: 'Ошибка добавления оплаты', description: 'Не удалось добавить оплату' },
  });

export const useSetPaidLessonsCount = () =>
  useApiMutation({
    mutationFn: ({ studentId, count }: { studentId: string; count: number }) =>
      studentsApi.setPaidLessonsCount(studentId, count),
    invalidateQueries: [studentKeys.all],
    successToast: { title: 'Баланс обновлен', description: 'Баланс оплаченных занятий обновлен' },
    errorToast: { title: 'Ошибка обновления баланса', description: 'Не удалось обновить баланс оплаченных занятий' },
  });

export const usePaymentHistory = (studentId?: string) =>
  useQuery({
    queryKey: paymentHistoryKeys.byStudent(studentId),
    queryFn: () => (studentId ? studentsApi.getPaymentHistory(studentId) : paymentHistoryApi.getAll()),
    select: (data) => data.map(transformApiData.paymentHistory),
  });

export const useDeletePaymentHistory = () =>
  useApiMutation({
    mutationFn: (paymentId: string) => paymentHistoryApi.delete(paymentId),
    invalidateQueries: [paymentHistoryKeys.all, studentKeys.all, lessonsKey],
    successToast: { title: 'Запись удалена', description: 'Запись из истории оплат успешно удалена' },
    errorToast: { title: 'Ошибка удаления записи', description: 'Не удалось удалить запись из истории оплат' },
  });
