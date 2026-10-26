import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import { createToast, toastReducer, type Toast, type ToastInput } from '../utils/toast';

interface ToastContextValue {
  toasts: Toast[];
  showToast: (input: ToastInput) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Holds the toast queue and auto-dismiss timers. Each app renders its own
 * ToastViewport that reads `toasts` and calls `dismissToast`.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, dispatch] = useReducer(toastReducer, []);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismissToast = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    dispatch({ type: 'dismiss', id });
  }, []);

  const showToast = useCallback(
    (input: ToastInput) => {
      const toast = createToast(input);
      dispatch({ type: 'show', toast });
      if (toast.durationMs > 0) {
        timers.current.set(
          toast.id,
          setTimeout(() => dismissToast(toast.id), toast.durationMs),
        );
      }
      return toast.id;
    },
    [dismissToast],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => clearTimeout(timer));
      pending.clear();
    };
  }, []);

  const value = useMemo(
    () => ({ toasts, showToast, dismissToast }),
    [toasts, showToast, dismissToast],
  );
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>.');
  return context;
}
