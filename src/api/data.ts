import { z } from 'zod';
import { apiClient } from './client';
import {
  exportPayloadSchema,
  importPayloadSchema,
  type ExportPayloadDto,
  type ImportPayloadDto,
} from '@shared/api/contracts';

const operationResultSchema = z.object({
  message: z.string().optional(),
}).passthrough();

export const dataApi = {
  export: () => apiClient.get<ExportPayloadDto>('/export', exportPayloadSchema),

  import: (payload: ImportPayloadDto) =>
    apiClient.post<unknown, ImportPayloadDto>('/import', payload, operationResultSchema),

  clear: () => apiClient.delete<unknown>('/clear', operationResultSchema),
};
