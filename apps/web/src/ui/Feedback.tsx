import { copy, type Toast } from '@hiddenspot/shared';
import { useToast } from '@hiddenspot/shared/react';
import {
  AlertTriangle,
  CircleCheck,
  Compass,
  Info,
  TriangleAlert,
  X,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './Button';
import styles from './Feedback.module.css';
import { Icon } from './Icon';
import { cx } from './utils';

/* ---------------- Empty and error states ---------------- */

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  message?: string;
  action?: ReactNode;
  /** "inline" is smaller, for use inside cards and sections. */
  size?: 'page' | 'inline';
}

export function EmptyState({
  icon = Compass,
  title,
  message,
  action,
  size = 'page',
}: EmptyStateProps) {
  return (
    <div className={cx(styles.empty, styles[size])}>
      <span className={styles.emptyIcon}>
        <Icon icon={icon} size={size === 'page' ? 'lg' : 'md'} />
      </span>
      <h2 className={size === 'page' ? 'ds-type-h2' : 'ds-type-h3'}>{title}</h2>
      {message ? <p className={cx('ds-type-body', styles.emptyMessage)}>{message}</p> : null}
      {action ? <div className={styles.emptyAction}>{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
  size,
}: {
  error?: Error;
  onRetry?: () => void;
  size?: EmptyStateProps['size'];
}) {
  return (
    <div role="alert">
      <EmptyState
        icon={AlertTriangle}
        size={size}
        title={copy.errors.generic.title}
        message={copy.errors.generic.message}
        action={
          onRetry ? (
            <Button variant="primary" onClick={onRetry}>
              {copy.actions.retry}
            </Button>
          ) : undefined
        }
      />
      {error && import.meta.env.DEV ? <p className={styles.debug}>{error.message}</p> : null}
    </div>
  );
}

/* ---------------- Toasts ---------------- */

const TOAST_ICONS: Record<Toast['tone'], LucideIcon> = {
  neutral: Info,
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: XCircle,
};

/** Renders the shared toast queue. Mount once near the app root. */
export function ToastViewport() {
  const { toasts, dismissToast } = useToast();
  return (
    <section className={styles.viewport} aria-label="Notifications" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cx(styles.toast, styles[`tone-${toast.tone}`])}
          role={toast.tone === 'danger' ? 'alert' : 'status'}
        >
          <Icon icon={TOAST_ICONS[toast.tone]} size="md" className={styles.toastIcon} />
          <div className={styles.toastText}>
            <p className="ds-type-label">{toast.title}</p>
            {toast.message ? (
              <p className={cx('ds-type-body-small', styles.toastMessage)}>{toast.message}</p>
            ) : null}
          </div>
          {toast.action ? (
            <button
              type="button"
              className={styles.toastAction}
              onClick={() => {
                toast.action?.onPress();
                dismissToast(toast.id);
              }}
            >
              {toast.action.label}
            </button>
          ) : null}
          <button
            type="button"
            className={styles.toastClose}
            aria-label="Dismiss notification"
            onClick={() => dismissToast(toast.id)}
          >
            <Icon icon={X} size="sm" />
          </button>
        </div>
      ))}
    </section>
  );
}
