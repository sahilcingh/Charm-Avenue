import { describe, it, expect } from 'vitest';
import { isPlaceholderText } from './placeholder-text';

describe('isPlaceholderText', () => {
  it('treats empty and whitespace-only strings as placeholder text', () => {
    expect(isPlaceholderText('')).toBe(true);
    expect(isPlaceholderText('   ')).toBe(true);
    expect(isPlaceholderText(null)).toBe(true);
    expect(isPlaceholderText(undefined)).toBe(true);
  });

  it('catches common literal placeholder values regardless of case or a slash', () => {
    for (const value of ['N/A', 'n/a', 'NA', 'Na', 'na', 'None', 'null', '-', 'TBD']) {
      expect(isPlaceholderText(value)).toBe(true);
    }
  });

  it('does not flag real copy, even if short', () => {
    expect(isPlaceholderText('Soft and good for hairs.')).toBe(false);
    expect(isPlaceholderText('Anti-tarnish.')).toBe(false);
  });
});
