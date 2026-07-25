import { describe, it, expect } from 'vitest';
import { contrastRatio } from './color-contrast';

describe('contrastRatio', () => {
  it('computes known reference ratios', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 0);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 1);
  });

  it(
    'the button-safe rose token (--blush-rose-button) passes WCAG AA (4.5:1) for white text ' +
      '(failure case: the original brand rose, --blush-rose, only reaches ~2.6:1 with white text — ' +
      'this dedicated darker token is what every primary CTA button now uses instead)',
    () => {
      expect(contrastRatio('#ffffff', '#c62439')).toBeGreaterThanOrEqual(4.5);
    }
  );

  it('the button-safe WhatsApp-green token (--whatsapp-green-button) passes WCAG AA (4.5:1) for white text', () => {
    expect(contrastRatio('#ffffff', '#1b7e48')).toBeGreaterThanOrEqual(4.5);
  });

  it('documents why the button-safe tokens exist: the original brand colors fail AA for white text', () => {
    expect(contrastRatio('#ffffff', '#e8828f')).toBeLessThan(4.5);
    expect(contrastRatio('#ffffff', '#25d366')).toBeLessThan(4.5);
  });
});
