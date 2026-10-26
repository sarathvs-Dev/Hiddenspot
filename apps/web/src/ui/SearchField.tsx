import { Search, X } from 'lucide-react';
import { useId, type InputHTMLAttributes } from 'react';
import { Icon } from './Icon';
import styles from './SearchField.module.css';
import { cx } from './utils';

export interface SearchFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'value' | 'size' | 'type'
> {
  value: string;
  onChange: (value: string) => void;
  /** Visually hidden label for screen readers. */
  label?: string;
  size?: 'md' | 'lg';
  /** Optional trailing element, such as a submit button. */
  trailing?: React.ReactNode;
}

export function SearchField({
  value,
  onChange,
  label = 'Search spots',
  placeholder = 'Search places, regions or tags',
  size = 'md',
  trailing,
  className,
  ...rest
}: SearchFieldProps) {
  const id = useId();
  return (
    <div className={cx(styles.field, styles[size], className)}>
      <label htmlFor={id} className="visually-hidden">
        {label}
      </label>
      <Icon icon={Search} size="md" className={styles.icon} />
      <input
        id={id}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={styles.input}
        autoComplete="off"
        enterKeyHint="search"
        {...rest}
      />
      {value ? (
        <button
          type="button"
          className={styles.clear}
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          <Icon icon={X} size="sm" />
        </button>
      ) : null}
      {trailing}
    </div>
  );
}
