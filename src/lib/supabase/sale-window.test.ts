import { describe, it, expect } from 'vitest';
import { isSaleWindowActive } from './sale-window';

describe('isSaleWindowActive', () => {
  it('is active when neither bound is set — matches today\'s "always show the discount" behavior', () => {
    expect(isSaleWindowActive(null, null, new Date('2026-01-15T00:00:00Z'))).toBe(true);
  });

  it('is active when now is between both bounds', () => {
    expect(
      isSaleWindowActive(
        '2026-01-01T00:00:00Z',
        '2026-01-31T00:00:00Z',
        new Date('2026-01-15T00:00:00Z')
      )
    ).toBe(true);
  });

  it('is inactive before the start bound', () => {
    expect(
      isSaleWindowActive(
        '2026-02-01T00:00:00Z',
        '2026-02-28T00:00:00Z',
        new Date('2026-01-15T00:00:00Z')
      )
    ).toBe(false);
  });

  it('is inactive after the end bound', () => {
    expect(
      isSaleWindowActive(
        '2026-01-01T00:00:00Z',
        '2026-01-10T00:00:00Z',
        new Date('2026-01-15T00:00:00Z')
      )
    ).toBe(false);
  });

  it('is active with only a start bound set, once that start has passed', () => {
    expect(isSaleWindowActive('2026-01-01T00:00:00Z', null, new Date('2026-01-15T00:00:00Z'))).toBe(
      true
    );
  });

  it('is inactive with only a start bound set, before that start', () => {
    expect(isSaleWindowActive('2026-02-01T00:00:00Z', null, new Date('2026-01-15T00:00:00Z'))).toBe(
      false
    );
  });

  it('is active with only an end bound set, before that end', () => {
    expect(isSaleWindowActive(null, '2026-01-31T00:00:00Z', new Date('2026-01-15T00:00:00Z'))).toBe(
      true
    );
  });

  it('is inactive with only an end bound set, after that end', () => {
    expect(isSaleWindowActive(null, '2026-01-10T00:00:00Z', new Date('2026-01-15T00:00:00Z'))).toBe(
      false
    );
  });
});
