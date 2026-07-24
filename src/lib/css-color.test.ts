import { describe, it, expect } from 'vitest';
import { resolveCssColor } from './css-color';

describe('resolveCssColor', () => {
  it('accepts a valid single-word CSS color keyword', () => {
    expect(resolveCssColor('red', '#FFFFFF')).toBe('red');
    expect(resolveCssColor('hotpink', '#FFFFFF')).toBe('hotpink');
  });

  it('is case-insensitive, matching how CSS itself treats color keywords', () => {
    expect(resolveCssColor('RED', '#FFFFFF')).toBe('RED');
  });

  it('accepts a hex color', () => {
    expect(resolveCssColor('#E8828F', '#FFFFFF')).toBe('#E8828F');
  });

  it('falls back for a two-word name that is not a real CSS keyword (failure case)', () => {
    expect(resolveCssColor('Rose Gold', '#FFFFFF')).toBe('#FFFFFF');
  });

  it('falls back for gibberish that is not a color at all', () => {
    expect(resolveCssColor('bloop', '#FFFFFF')).toBe('#FFFFFF');
  });

  it('falls back for null/empty input', () => {
    expect(resolveCssColor(null, '#FFFFFF')).toBe('#FFFFFF');
    expect(resolveCssColor('', '#FFFFFF')).toBe('#FFFFFF');
  });
});
