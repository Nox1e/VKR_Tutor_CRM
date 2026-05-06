import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
  type UseMutationOptions,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

type QueryKeyValue = readonly unknown[];

type QueryKeyInput<TData, TVariables> =
  | QueryKeyValue
  | ((variables: TVariables, data: TData) => QueryKeyValue | QueryKeyValue[]);

interface MutationToastConfig {
  title: string;
  description?: string;
}

export interface UseApiMutationOptions<TData, TVariables, TContext = unknown> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  invalidateQueries?: QueryKeyInput<TData, TVariables>[];
  successToast?: MutationToastConfig | false;
  errorToast?: MutationToastConfig | false;
  onSuccess?: UseMutationOptions<TData, Error, TVariables, TContext>['onSuccess'];
  onError?: UseMutationOptions<TData, Error, TVariables, TContext>['onError'];
}

const resolveQueryKeys = <TData, TVariables>(
  entry: QueryKeyInput<TData, TVariables>,
  variables: TVariables,
  data: TData,
): QueryKeyValue[] => {
  const value = typeof entry === 'function' ? entry(variables, data) : entry;

  if (Array.isArray(value) && value.length > 0 && Array.isArray(value[0])) {
    return value as QueryKeyValue[];
  }

  return [value as QueryKeyValue];
};

/**
 * Generic mutation hook with built-in cache invalidation and optional toasts.
 * Pass `successToast: false` / `errorToast: false` to silence them per-call.
 */
export const useApiMutation = <TData = unknown, TVariables = void, TContext = unknown>(
  options: UseApiMutationOptions<TData, TVariables, TContext>,
) => {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables, TContext>({
    mutationFn: options.mutationFn,
    onSuccess: (data, variables, context) => {
      options.invalidateQueries?.forEach((entry) => {
        resolveQueryKeys(entry, variables, data).forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      });

      if (options.successToast) {
        toast({
          title: options.successToast.title,
          description: options.successToast.description,
        });
      }

      options.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      if (options.errorToast) {
        toast({
          title: options.errorToast.title,
          description: error.message || options.errorToast.description,
          variant: 'destructive',
        });
      }

      options.onError?.(error, variables, context);
    },
  });
};

export type UseApiQueryOptions<TQueryFnData, TData = TQueryFnData> = Omit<
  UseQueryOptions<TQueryFnData, Error, TData, QueryKey>,
  'queryKey' | 'queryFn'
> & {
  queryKey: QueryKey;
  queryFn: () => Promise<TQueryFnData>;
};

/**
 * Thin wrapper around useQuery — keeps the call-site signature consistent
 * with useApiMutation and centralises the Error type.
 */
export const useApiQuery = <TQueryFnData, TData = TQueryFnData>(
  options: UseApiQueryOptions<TQueryFnData, TData>,
): UseQueryResult<TData, Error> => useQuery(options);
