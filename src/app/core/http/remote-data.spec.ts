import { describe, expect, it } from 'vitest';
import type { AppError } from './app-error';
import {
  isError,
  isIdle,
  isLoading,
  isSuccess,
  mapRemote,
  remoteError,
  remoteIdle,
  remoteLoading,
  remoteSuccess,
  withDefault,
  type RemoteData,
} from './remote-data';

const sampleError: AppError = { kind: 'unknown', cause: null };

describe('RemoteData constructors and guards', () => {
  it('classify each state correctly', () => {
    const cases: { rd: RemoteData<number>; guard: 'idle' | 'loading' | 'success' | 'error' }[] = [
      { rd: remoteIdle(), guard: 'idle' },
      { rd: remoteLoading(), guard: 'loading' },
      { rd: remoteSuccess(42), guard: 'success' },
      { rd: remoteError(sampleError), guard: 'error' },
    ];
    for (const { rd, guard } of cases) {
      expect(isIdle(rd)).toBe(guard === 'idle');
      expect(isLoading(rd)).toBe(guard === 'loading');
      expect(isSuccess(rd)).toBe(guard === 'success');
      expect(isError(rd)).toBe(guard === 'error');
    }
  });
});

describe('mapRemote', () => {
  it('transforms only the success payload', () => {
    expect(mapRemote(remoteSuccess(2), (n) => n * 3)).toEqual(remoteSuccess(6));
  });

  it('passes through non-success states unchanged', () => {
    expect(mapRemote(remoteIdle(), (n: number) => n * 3)).toEqual(remoteIdle());
    expect(mapRemote(remoteLoading(), (n: number) => n * 3)).toEqual(remoteLoading());
    expect(mapRemote(remoteError(sampleError), (n: number) => n * 3)).toEqual(
      remoteError(sampleError),
    );
  });
});

describe('withDefault', () => {
  it('returns success data when available', () => {
    expect(withDefault(remoteSuccess('hit'), 'miss')).toBe('hit');
  });

  it('returns the fallback otherwise', () => {
    expect(withDefault<string>(remoteIdle(), 'miss')).toBe('miss');
    expect(withDefault<string>(remoteLoading(), 'miss')).toBe('miss');
    expect(withDefault<string>(remoteError(sampleError), 'miss')).toBe('miss');
  });
});
