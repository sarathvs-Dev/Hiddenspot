import type { Tone } from '../theme/components';

export type ToastTone = Extract<Tone, 'neutral' | 'success' | 'warning' | 'danger' | 'info'>;

export interface ToastInput {
  title: string;
  message?: string;
  tone?: ToastTone;
  /** Milliseconds before auto-dismiss. 0 keeps it until dismissed. */
  durationMs?: number;
  action?: { label: string; onPress: () => void };
}

export interface Toast extends Required<Pick<ToastInput, 'title' | 'tone' | 'durationMs'>> {
  id: string;
  message?: string;
  action?: ToastInput['action'];
}

export type ToastAction =
  { type: 'show'; toast: Toast } | { type: 'dismiss'; id: string } | { type: 'clear' };

/** At most this many toasts are visible; older ones drop off first. */
export const MAX_VISIBLE_TOASTS = 3;
export const DEFAULT_TOAST_DURATION_MS = 4000;

/** Pure queue logic shared by both apps' toast providers. */
export function toastReducer(state: Toast[], action: ToastAction): Toast[] {
  switch (action.type) {
    case 'show':
      return [...state.filter((t) => t.id !== action.toast.id), action.toast].slice(
        -MAX_VISIBLE_TOASTS,
      );
    case 'dismiss':
      return state.filter((t) => t.id !== action.id);
    case 'clear':
      return [];
  }
}

let counter = 0;

export function createToast(input: ToastInput): Toast {
  counter += 1;
  return {
    id: `toast-${Date.now().toString(36)}-${counter}`,
    title: input.title,
    message: input.message,
    tone: input.tone ?? 'neutral',
    durationMs: input.durationMs ?? DEFAULT_TOAST_DURATION_MS,
    action: input.action,
  };
}
