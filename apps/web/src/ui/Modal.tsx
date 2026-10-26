import { X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { IconButton } from './IconButton';
import styles from './Modal.module.css';
import { cx } from './utils';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Hide the title visually but keep it for screen readers. */
  hideTitle?: boolean;
  description?: string;
  /**
   * "dialog" is centred. "sheet" slides up from the bottom on phones and becomes a
   * centred dialog on wider screens. "lightbox" is a dark full-screen viewer.
   */
  variant?: 'dialog' | 'sheet' | 'lightbox';
  size?: 'sm' | 'md' | 'lg';
  footer?: ReactNode;
  /** Close when the backdrop is clicked. Defaults to true. */
  dismissible?: boolean;
  /** Keyboard handler on the whole dialog, e.g. arrow keys in a gallery. */
  onKeyDown?: (event: KeyboardEvent<HTMLDialogElement>) => void;
  children?: ReactNode;
}

/**
 * Modal built on the native <dialog> element: focus is trapped, Escape closes it,
 * the rest of the page becomes inert, and focus returns to the trigger on close.
 */
export function Modal({
  open,
  onClose,
  title,
  hideTitle,
  description,
  variant = 'dialog',
  size = 'md',
  footer,
  dismissible = true,
  onKeyDown,
  children,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  // Content stays mounted while the closing animation plays.
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open) {
      delete dialog.dataset.closing;
      if (!dialog.open) dialog.showModal();
      return;
    }
    if (!dialog.open) return;
    const finish = () => {
      delete dialog.dataset.closing;
      dialog.close();
      setMounted(false);
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish();
      return;
    }
    // Animate out, then close. The timer covers browsers that skip animationend.
    dialog.dataset.closing = 'true';
    const timer = window.setTimeout(finish, 260);
    const onEnd = (event: AnimationEvent) => {
      if (event.target === dialog) finish();
    };
    dialog.addEventListener('animationend', onEnd);
    return () => {
      window.clearTimeout(timer);
      dialog.removeEventListener('animationend', onEnd);
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={cx(styles.dialog, styles[variant], styles[size])}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={() => {
        if (open) onClose();
      }}
      onKeyDown={onKeyDown}
      onCancel={(event) => {
        // Escape goes through onClose so it gets the same closing animation.
        event.preventDefault();
        if (dismissible) onClose();
      }}
      onClick={(event) => {
        if (dismissible && event.target === event.currentTarget) onClose();
      }}
    >
      {open || mounted ? (
        <div className={styles.panel}>
          {variant === 'sheet' ? <span className={styles.handle} aria-hidden="true" /> : null}
          <header className={cx(styles.header, hideTitle && styles.headerBare)}>
            <div className={hideTitle ? 'visually-hidden' : styles.titles}>
              <h2 id={titleId} className="ds-type-h2">
                {title}
              </h2>
              {description ? (
                <p id={descriptionId} className={cx('ds-type-body', styles.description)}>
                  {description}
                </p>
              ) : null}
            </div>
            <IconButton
              icon={X}
              label="Close"
              variant={variant === 'lightbox' ? 'glass' : 'soft'}
              size="sm"
              onClick={onClose}
              className={styles.close}
            />
          </header>
          {children ? <div className={styles.body}>{children}</div> : null}
          {footer ? <footer className={styles.footer}>{footer}</footer> : null}
        </div>
      ) : null}
    </dialog>
  );
}
