import { copy } from '@hiddenspot/shared';
import { Button } from './Button';
import { Modal } from './Modal';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

/** Asks before an important action. Cancel is the safe default and comes first. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = copy.actions.cancel,
  tone = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={message}
      footer={
        <>
          <Button variant="secondary" onPress={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onPress={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
