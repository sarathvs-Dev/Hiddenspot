import type { ValidationIssue } from '../types';

export type DemoDataErrorCode =
  'VALIDATION' | 'NOT_FOUND' | 'FORBIDDEN' | 'INVALID_TRANSITION' | 'CONFLICT';

/** Typed error from the data service. `issues` lists field problems for forms. */
export class DemoDataError extends Error {
  readonly code: DemoDataErrorCode;
  readonly issues: ValidationIssue[];

  constructor(code: DemoDataErrorCode, message: string, issues: ValidationIssue[] = []) {
    super(message);
    this.name = 'DemoDataError';
    this.code = code;
    this.issues = issues;
  }
}

export function isDemoDataError(error: unknown): error is DemoDataError {
  return error instanceof DemoDataError;
}

/** Maps issues to { field: message } for form display. Uses the last path segment as the field. */
export function issuesToFieldErrors(issues: ValidationIssue[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const field = issue.path.split('.').pop() ?? issue.path;
    errors[field] ??= issue.message;
  }
  return errors;
}
