import { describe, it, expect } from 'vitest';
import { validateProductImageFile, MAX_PRODUCT_IMAGE_BYTES } from './product-image-validation';

function fileOfSize(bytes: number): File {
  return new File([new Uint8Array(bytes)], 'photo.jpg', { type: 'image/jpeg' });
}

describe('validateProductImageFile', () => {
  it('accepts a normally-sized photo', () => {
    expect(validateProductImageFile(fileOfSize(500 * 1024))).toBeNull();
  });

  it('accepts a file exactly at the limit (boundary case)', () => {
    expect(validateProductImageFile(fileOfSize(MAX_PRODUCT_IMAGE_BYTES))).toBeNull();
  });

  it('rejects a file over the limit with a clear, actionable message (failure case reproducing the "Save Changes" crash)', () => {
    const message = validateProductImageFile(fileOfSize(MAX_PRODUCT_IMAGE_BYTES + 1));
    expect(message).not.toBeNull();
    expect(message).toMatch(/too large|under/i);
  });

  it("includes the file's actual size and the limit in the message, so the error is actionable", () => {
    // 12MB phone photo — a realistic real-world trigger for the original bug
    const message = validateProductImageFile(fileOfSize(12 * 1024 * 1024));
    expect(message).toContain('12');
    expect(message).toContain(String(MAX_PRODUCT_IMAGE_BYTES / (1024 * 1024)));
  });
});
