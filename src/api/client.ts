import type { z } from 'zod';
import { API_BASE_URL } from '@/config';
import { authStore } from '@/auth/auth-store';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

type JsonLike = Record<string, unknown> | unknown[];

type RequestBody = JsonLike | FormData | undefined;

interface RequestOptions<TResponse, TBody extends RequestBody = JsonLike | undefined> {
  path: string;
  method?: HttpMethod;
  body?: TBody;
  headers?: Record<string, string>;
  schema?: z.ZodType<TResponse>;
  signal?: AbortSignal;
  skipAuth?: boolean;
  _retried?: boolean;
}

const DEFAULT_HEADERS: Record<string, string> = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

const resolveUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('/')) return `${API_BASE_URL}${path}`;
  return `${API_BASE_URL}/${path}`;
};

const isFormData = (body: RequestBody): body is FormData =>
  typeof FormData !== 'undefined' && body instanceof FormData;

const parseResponseBody = async (response: Response): Promise<unknown> => {
  const contentType = response.headers.get('content-type');
  if (!contentType) return null;
  if (contentType.includes('application/json')) return response.json();
  return response.text();
};

export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

let refreshInFlight: Promise<boolean> | null = null;
let onUnauthenticatedHandler: (() => void) | null = null;

// How close to expiry should we proactively refresh? 30s gives us enough room
// for a slow request to hit the server before the token actually expires.
const PROACTIVE_REFRESH_LEEWAY_S = 30;

export const setOnUnauthenticated = (handler: (() => void) | null) => {
  onUnauthenticatedHandler = handler;
};

const decodeJwtExp = (token: string): number | null => {
  try {
    const payloadSegment = token.split('.')[1];
    if (!payloadSegment) return null;
    const normalised = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalised + '='.repeat((4 - (normalised.length % 4)) % 4);
    const json = atob(padded);
    const data = JSON.parse(json);
    return typeof data.exp === 'number' ? data.exp : null;
  } catch {
    return null;
  }
};

const tokenIsExpiringSoon = (token: string): boolean => {
  const exp = decodeJwtExp(token);
  if (!exp) return false;
  return Date.now() / 1000 > exp - PROACTIVE_REFRESH_LEEWAY_S;
};

const doRefresh = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return false;
    const data = (await response.json()) as {
      user: { id: number; email: string; role: string };
      accessToken: string;
    };
    authStore.setAuth(data.user, data.accessToken);
    return true;
  } catch {
    return false;
  }
};

export const refreshSession = (): Promise<boolean> => {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
};

const buildHeaders = (opts: RequestOptions<unknown>, hasFormBody: boolean) => {
  const headers: Record<string, string> = { ...DEFAULT_HEADERS, ...opts.headers };
  if (hasFormBody) {
    delete headers['Content-Type'];
  }
  if (!opts.skipAuth) {
    const token = authStore.getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  return headers;
};

const handleError = async (response: Response, requestInfo: { method: HttpMethod; url: string }) => {
  const errorPayload = await parseResponseBody(response);
  const extractString = (key: string) =>
    errorPayload && typeof errorPayload === 'object' && key in errorPayload
      ? String((errorPayload as Record<string, unknown>)[key])
      : null;
  const message =
    extractString('error') ?? extractString('message') ?? `Запрос завершился с ошибкой (${response.status})`;

  if (import.meta.env.DEV) {
    console.error('[API]', requestInfo.method, requestInfo.url, {
      status: response.status,
      payload: errorPayload,
    });
  }

  throw new ApiError(message, response.status, errorPayload);
};

export const request = async <TResponse>(options: RequestOptions<TResponse>): Promise<TResponse> => {
  const { path, method = 'GET', body, schema, signal } = options;
  const url = resolveUrl(path);
  const hasFormBody = body !== undefined && isFormData(body);

  // Proactive refresh: if the access token is about to expire, refresh BEFORE
  // sending the request. The singleton in refreshSession() makes parallel calls
  // collapse into one /auth/refresh round-trip, which avoids both the 401
  // storm in DevTools and the reuse-detection race in AuthService.refresh.
  if (!options.skipAuth && !options._retried) {
    const token = authStore.getAccessToken();
    if (token && tokenIsExpiringSoon(token)) {
      await refreshSession();
    }
  }

  const fetchOptions: RequestInit = {
    method,
    headers: buildHeaders(options, hasFormBody),
    credentials: 'include',
    signal,
  };

  if (body !== undefined) {
    fetchOptions.body = hasFormBody ? (body as FormData) : JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[API] Network error', { method, url, error });
    }
    throw new ApiError('Не удалось выполнить запрос к серверу', 0, error);
  }

  if (response.status === 401 && !options.skipAuth && !options._retried) {
    // Don't log this 401 — it's the expected "access token just expired"
    // path. We refresh and retry; the user only sees real failures.
    const refreshed = await refreshSession();
    if (refreshed) {
      return request<TResponse>({ ...options, _retried: true });
    }
    authStore.clear();
    onUnauthenticatedHandler?.();
    await handleError(response, { method, url });
  }

  if (!response.ok) {
    await handleError(response, { method, url });
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const rawData = await parseResponseBody(response);
  const data = schema ? schema.parse(rawData) : (rawData as TResponse);

  if (import.meta.env.DEV) {
    console.debug('[API]', method, url, { status: response.status });
  }

  return data;
};

export const apiClient = {
  get: <TResponse>(
    path: string,
    schema?: z.ZodType<TResponse>,
    options?: Omit<RequestOptions<TResponse>, 'path' | 'method' | 'schema'>,
  ) =>
    request<TResponse>({
      ...options,
      path,
      method: 'GET',
      schema,
    }),

  post: <TResponse, TBody extends RequestBody = JsonLike>(
    path: string,
    body?: TBody,
    schema?: z.ZodType<TResponse>,
    options?: Omit<RequestOptions<TResponse, TBody>, 'path' | 'method' | 'body' | 'schema'>,
  ) =>
    request<TResponse>({
      ...options,
      path,
      method: 'POST',
      body,
      schema,
    } as RequestOptions<TResponse>),

  put: <TResponse, TBody extends RequestBody = JsonLike>(
    path: string,
    body?: TBody,
    schema?: z.ZodType<TResponse>,
    options?: Omit<RequestOptions<TResponse, TBody>, 'path' | 'method' | 'body' | 'schema'>,
  ) =>
    request<TResponse>({
      ...options,
      path,
      method: 'PUT',
      body,
      schema,
    } as RequestOptions<TResponse>),

  delete: <TResponse>(
    path: string,
    schema?: z.ZodType<TResponse>,
    options?: Omit<RequestOptions<TResponse>, 'path' | 'method' | 'schema'>,
  ) =>
    request<TResponse>({
      ...options,
      path,
      method: 'DELETE',
      schema,
    }),
};
