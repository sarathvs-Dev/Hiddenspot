import { describe, expect, it } from 'vitest';
import {
  EMPTY_SUBMISSION_FORM,
  firstErrorSection,
  isSubmissionSectionComplete,
  issuesToSubmissionErrors,
  toNewSubmissionInput,
  validateSubmissionForm,
  type SubmissionFormValues,
} from '../utils';

const valid: SubmissionFormValues = {
  ...EMPTY_SUBMISSION_FORM,
  name: 'Pine Grove',
  categoryIds: ['peaceful'],
  shortDescription: 'Shady pine forest with misty walking paths.',
  district: 'Idukki',
};

describe('submission form rules', () => {
  it('reports errors for an empty form, starting at the first section', () => {
    const errors = validateSubmissionForm(EMPTY_SUBMISSION_FORM);
    expect(Object.keys(errors).sort()).toEqual([
      'categoryIds',
      'district',
      'name',
      'shortDescription',
    ]);
    expect(firstErrorSection(errors)).toBe(0);
    expect(firstErrorSection({ district: 'x' })).toBe(1);
  });

  it('accepts a minimal valid form and requires both coordinates', () => {
    expect(validateSubmissionForm(valid)).toEqual({});
    expect(validateSubmissionForm({ ...valid, latitude: '10.1' }).latitude).toBeDefined();
    expect(
      validateSubmissionForm({ ...valid, latitude: '95', longitude: '76' }).latitude,
    ).toBeDefined();
  });

  it('requires a positive fee when paid', () => {
    expect(validateSubmissionForm({ ...valid, feeChoice: 'paid' }).feeAmount).toBeDefined();
    expect(validateSubmissionForm({ ...valid, feeChoice: 'paid', feeAmount: '20' })).toEqual({});
  });

  it('counts a section as complete only when it has content and no errors', () => {
    expect([0, 1, 2, 3].map((i) => isSubmissionSectionComplete(i, EMPTY_SUBMISSION_FORM))).toEqual([
      false,
      false,
      false,
      false,
    ]);
    expect([0, 1, 2, 3].map((i) => isSubmissionSectionComplete(i, valid))).toEqual([
      true,
      true,
      false,
      false,
    ]);
    expect(isSubmissionSectionComplete(3, { ...valid, feeChoice: 'paid' })).toBe(false);
    expect(isSubmissionSectionComplete(3, { ...valid, feeChoice: 'free' })).toBe(true);
  });

  it('converts to service input without guessing unknown facts', () => {
    const input = toNewSubmissionInput(
      { ...valid, safetyNotes: 'Slippery\n\n Leeches ' },
      'usr-anu',
    );
    expect(input.submittedBy).toBe('usr-anu');
    expect(input.place.latitude).toBeNull();
    expect(input.place.entryFee).toBeNull();
    expect(input.place.description).toBeNull();
    expect(input.place.safetyNotes).toEqual(['Slippery', 'Leeches']);
  });

  it('maps service issue paths to form fields', () => {
    expect(
      issuesToSubmissionErrors([
        { path: 'place.imageUrls', message: 'bad image' },
        { path: 'place.entryFee', message: 'bad fee' },
      ]),
    ).toEqual({ imageUris: 'bad image', feeAmount: 'bad fee' });
  });
});
