import { AlertCircle, Check, ChevronDown, CircleCheck, Info } from 'lucide-react';
import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import styles from './Form.module.css';
import { Icon } from './Icon';
import { cx } from './utils';

/* ---------------- Validation message ---------------- */

export interface ValidationMessageProps {
  id?: string;
  tone?: 'error' | 'success' | 'info';
  children: ReactNode;
}

const MESSAGE_ICONS = { error: AlertCircle, success: CircleCheck, info: Info } as const;

export function ValidationMessage({ id, tone = 'error', children }: ValidationMessageProps) {
  return (
    <p
      id={id}
      className={cx('ds-type-helper', styles.message, styles[tone])}
      role={tone === 'error' ? 'alert' : undefined}
    >
      <Icon icon={MESSAGE_ICONS[tone]} size="xs" />
      <span>{children}</span>
    </p>
  );
}

/* ---------------- Form field wrapper ---------------- */

interface FieldControlProps {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
}

export interface FormFieldProps {
  /** Stable id for the control, e.g. so an error summary can link to it. Generated when omitted. */
  id?: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  /** Mark the field as optional in the label instead of marking required ones. */
  optional?: boolean;
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
}

/** Label, control, hint and error with correct ids and aria wiring. */
export function FormField({
  id: idProp,
  label,
  hint,
  error,
  required,
  optional,
  className,
  children,
}: FormFieldProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={id} className={cx('ds-type-label', styles.label)}>
        {label}
        {required ? (
          <span className={styles.required} aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
        {optional ? <span className={styles.optional}> (optional)</span> : null}
      </label>
      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        'aria-required': required || undefined,
      })}
      {error ? (
        <ValidationMessage id={errorId}>{error}</ValidationMessage>
      ) : hint ? (
        <p id={hintId} className={cx('ds-type-helper', styles.hint)}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/* ---------------- Controls ---------------- */

type FieldProps = Omit<FormFieldProps, 'children'>;

export interface TextFieldProps
  extends FieldProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'required'> {}

export function TextField({
  id,
  label,
  hint,
  error,
  required,
  optional,
  className,
  ...input
}: TextFieldProps) {
  return (
    <FormField
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      optional={optional}
      className={className}
    >
      {(control) => <input className={styles.input} {...control} {...input} />}
    </FormField>
  );
}

export interface TextAreaProps
  extends FieldProps, Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className' | 'required'> {}

export function TextArea({
  id,
  label,
  hint,
  error,
  required,
  optional,
  className,
  rows = 4,
  ...input
}: TextAreaProps) {
  return (
    <FormField
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      optional={optional}
      className={className}
    >
      {(control) => (
        <textarea
          className={cx(styles.input, styles.textarea)}
          rows={rows}
          {...control}
          {...input}
        />
      )}
    </FormField>
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps
  extends FieldProps, Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className' | 'required'> {
  options: SelectOption[];
  placeholder?: string;
}

/** Native select for the best keyboard, screen reader and mobile behaviour, styled to match. */
export function SelectField({
  id,
  label,
  hint,
  error,
  required,
  optional,
  className,
  options,
  placeholder,
  ...select
}: SelectFieldProps) {
  return (
    <FormField
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      optional={optional}
      className={className}
    >
      {(control) => (
        <div className={styles.selectWrap}>
          <select className={cx(styles.input, styles.select)} {...control} {...select}>
            {placeholder ? <option value="">{placeholder}</option> : null}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Icon icon={ChevronDown} size="sm" className={styles.chevron} />
        </div>
      )}
    </FormField>
  );
}

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'id'> {
  label: string;
  /** "radio" renders the same control for one-of-many choices that share a name. */
  type?: 'checkbox' | 'radio';
  description?: string;
}

export function Checkbox({
  label,
  description,
  className,
  type = 'checkbox',
  ...input
}: CheckboxProps) {
  const id = useId();
  const descriptionId = description ? `${id}-description` : undefined;
  return (
    <div className={cx(styles.checkboxRow, className)}>
      <span className={styles.checkboxControl}>
        <input
          id={id}
          type={type}
          className={cx(styles.checkbox, type === 'radio' && styles.radio)}
          aria-describedby={descriptionId}
          {...input}
        />
        <Icon icon={Check} size="xs" className={styles.checkmark} />
      </span>
      <span className={styles.checkboxText}>
        <label htmlFor={id} className="ds-type-label">
          {label}
        </label>
        {description ? (
          <span id={descriptionId} className={cx('ds-type-helper', styles.hint)}>
            {description}
          </span>
        ) : null}
      </span>
    </div>
  );
}
