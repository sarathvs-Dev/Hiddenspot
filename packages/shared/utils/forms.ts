import { copy } from '../content/copy';

/** A field validator returns an error message, or undefined when the value is valid. */
export type FieldValidator = (value: string) => string | undefined;

export const required =
  (label: string): FieldValidator =>
  (value) =>
    value.trim() ? undefined : copy.validation.required(label);

export const minLength =
  (label: string, min: number): FieldValidator =>
  (value) =>
    value.trim().length >= min ? undefined : copy.validation.minLength(label, min);

export const email: FieldValidator = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? undefined : copy.validation.email;

/** Runs validators in order and returns the first error. */
export function validateField(value: string, validators: FieldValidator[]): string | undefined {
  for (const validator of validators) {
    const error = validator(value);
    if (error) return error;
  }
  return undefined;
}

/** Validates a whole form. Returns only the fields that have errors. */
export function validateForm<K extends string>(
  values: Record<K, string>,
  rules: Partial<Record<K, FieldValidator[]>>,
): Partial<Record<K, string>> {
  const errors: Partial<Record<K, string>> = {};
  for (const key of Object.keys(rules) as K[]) {
    const error = validateField(values[key] ?? '', rules[key] ?? []);
    if (error) errors[key] = error;
  }
  return errors;
}

/** Wraps validators for an optional field: an empty value is valid, a filled one must pass. */
export const optional =
  (...validators: FieldValidator[]): FieldValidator =>
  (value) =>
    value.trim() ? validateField(value, validators) : undefined;
