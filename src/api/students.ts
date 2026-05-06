import { z } from 'zod';
import { apiClient } from './client';
import {
  studentDtoSchema,
  paymentHistoryDtoSchema,
  type StudentDto,
  type PaymentHistoryDto,
} from '@shared/api/contracts';

const studentsArraySchema = z.array(studentDtoSchema);
const paymentHistoryArraySchema = z.array(paymentHistoryDtoSchema);

export interface CreateStudentPayload {
  name: string;
  photoData?: string;
}

export interface AddPaymentPayload {
  lessonsCount: number;
  amount: number;
}

export type UpdateStudentPayload = Partial<StudentDto> & Record<string, unknown>;

export const studentsApi = {
  getAll: () => apiClient.get<StudentDto[]>('/students', studentsArraySchema),

  getById: (id: string) => apiClient.get<StudentDto>(`/students/${id}`, studentDtoSchema),

  create: (payload: CreateStudentPayload) =>
    apiClient.post<StudentDto, CreateStudentPayload>('/students', payload, studentDtoSchema),

  update: (id: string, payload: UpdateStudentPayload) =>
    apiClient.put<StudentDto, UpdateStudentPayload>(`/students/${id}`, payload, studentDtoSchema),

  delete: (id: string) => apiClient.delete<unknown>(`/students/${id}`),

  addPayment: (id: string, payload: AddPaymentPayload) =>
    apiClient.post<StudentDto, AddPaymentPayload>(`/students/${id}/payment`, payload, studentDtoSchema),

  getPaymentHistory: (id: string) =>
    apiClient.get<PaymentHistoryDto[]>(`/students/${id}/payment-history`, paymentHistoryArraySchema),

  setPaidLessonsCount: (id: string, count: number) =>
    apiClient.put<StudentDto, { count: number }>(`/students/${id}/paid-lessons-count`, { count }, studentDtoSchema),
};
