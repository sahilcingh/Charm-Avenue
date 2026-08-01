import { describe, it, expect } from 'vitest';
import { renderBillPdf } from './render-bill-pdf';

describe('renderBillPdf (smoke test — verifies the src/-relative logo path actually resolves)', () => {
  it('renders a real PDF buffer without throwing on the logo/font file reads', async () => {
    const buffer = await renderBillPdf({
      orderId: 'abcd1234-ef56-7890-abcd-ef1234567890',
      createdAt: new Date('2026-01-01').toISOString(),
      guestName: 'Test User',
      guestPhone: '9999999999',
      guestAddress: '123 Test St',
      items: [{ name: 'Test Item', quantity: 2, unitPrice: 100 }],
      discountTotal: 0,
      total: 200,
    });
    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
    expect(buffer.length).toBeGreaterThan(1000);
  });
});
