import { useCallback, useEffect, useRef, useState } from 'react';

export interface AsyncState<T> {
  /** Latest successful result. Previous data stays visible while a new request loads. */
  data: T | undefined;
  error: Error | undefined;
  isLoading: boolean;
  /** Re-runs the loader. */
  reload: () => void;
}

interface Settled<T> {
  requestId: string;
  data: T | undefined;
  error: Error | undefined;
}

/**
 * Runs an async loader whenever `key` changes and ignores stale responses.
 * `key` must be a stable string describing the request, for example the serialized filters.
 * Loading state is derived by comparing the current request with the last settled one,
 * so the effect never sets state synchronously.
 */
export function useAsync<T>(loader: () => Promise<T>, key: string): AsyncState<T> {
  const [reloadCount, setReloadCount] = useState(0);
  const [settled, setSettled] = useState<Settled<T>>({
    requestId: '',
    data: undefined,
    error: undefined,
  });
  const loaderRef = useRef(loader);
  const requestId = `${key}#${reloadCount}`;

  useEffect(() => {
    loaderRef.current = loader;
  });

  useEffect(() => {
    let cancelled = false;
    loaderRef.current().then(
      (data) => {
        if (!cancelled) setSettled({ requestId, data, error: undefined });
      },
      (err: unknown) => {
        if (cancelled) return;
        const error = err instanceof Error ? err : new Error(String(err));
        setSettled((previous) => ({ requestId, data: previous.data, error }));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [requestId]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);
  const isLoading = settled.requestId !== requestId;

  return {
    data: settled.data,
    error: isLoading ? undefined : settled.error,
    isLoading,
    reload,
  };
}
