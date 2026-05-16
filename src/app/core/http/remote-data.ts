import type { AppError } from './app-error';

/**
 * Discriminated union for async UI state. Replaces the classic isLoading +
 * data + error trio with an exhaustive `state` field, so templates can never
 * render an impossible combination (success + error, loading + data, etc.).
 */
export type RemoteData<T> =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'success'; data: T }
  | { state: 'error'; error: AppError };

export const remoteIdle = (): RemoteData<never> => ({ state: 'idle' });
export const remoteLoading = (): RemoteData<never> => ({ state: 'loading' });
export const remoteSuccess = <T>(data: T): RemoteData<T> => ({ state: 'success', data });
export const remoteError = (error: AppError): RemoteData<never> => ({ state: 'error', error });

export const isIdle = <T>(rd: RemoteData<T>): rd is { state: 'idle' } => rd.state === 'idle';
export const isLoading = <T>(rd: RemoteData<T>): rd is { state: 'loading' } =>
  rd.state === 'loading';
export const isSuccess = <T>(rd: RemoteData<T>): rd is { state: 'success'; data: T } =>
  rd.state === 'success';
export const isError = <T>(rd: RemoteData<T>): rd is { state: 'error'; error: AppError } =>
  rd.state === 'error';

/**
 * Map the data inside a success without disturbing other states. Useful when
 * a repository returns DTOs but a feature needs domain models.
 */
export const mapRemote = <T, U>(rd: RemoteData<T>, fn: (data: T) => U): RemoteData<U> =>
  rd.state === 'success' ? remoteSuccess(fn(rd.data)) : rd;

/**
 * Unwrap with a default for success, useful in computed signals that need a
 * non-null value before the first response arrives.
 */
export const withDefault = <T>(rd: RemoteData<T>, fallback: T): T =>
  rd.state === 'success' ? rd.data : fallback;
