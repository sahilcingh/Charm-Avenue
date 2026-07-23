import { describe, it, expect, vi } from 'vitest';
import {
  compressImageFile,
  COMPRESSION_STEPS,
  COMPRESSION_TARGET_BYTES,
} from './compress-product-image';

function fileOfSize(bytes: number, name = 'photo.png'): File {
  return new File([new Uint8Array(bytes)], name, { type: 'image/png' });
}

function blobOfSize(bytes: number, type = 'image/jpeg'): Blob {
  return new Blob([new Uint8Array(bytes)], { type });
}

describe('compressImageFile', () => {
  it('skips compression entirely when the file is already under the target size', async () => {
    const original = fileOfSize(200 * 1024);
    const attemptStep = vi.fn();

    const result = await compressImageFile(original, attemptStep);

    expect(attemptStep).not.toHaveBeenCalled();
    expect(result).toBe(original);
  });

  it('stops at the first step that gets under the target, without trying later steps', async () => {
    const original = fileOfSize(5 * 1024 * 1024);
    const attemptStep = vi
      .fn()
      .mockResolvedValueOnce(blobOfSize(2 * 1024 * 1024)) // step 1: still too big
      .mockResolvedValueOnce(blobOfSize(500 * 1024)); // step 2: fits — should stop here

    const result = await compressImageFile(original, attemptStep);

    expect(attemptStep).toHaveBeenCalledTimes(2);
    expect(result.size).toBe(500 * 1024);
  });

  it('falls back to the last (most compressed) attempt if no step gets under the target (edge case: an unusually dense photo)', async () => {
    const original = fileOfSize(20 * 1024 * 1024);
    const attemptStep = vi
      .fn()
      .mockImplementation(async () => blobOfSize(COMPRESSION_TARGET_BYTES + 1));

    const result = await compressImageFile(original, attemptStep);

    expect(attemptStep).toHaveBeenCalledTimes(COMPRESSION_STEPS.length);
    expect(result.size).toBe(COMPRESSION_TARGET_BYTES + 1);
  });

  it('renames the result to .jpg, since every step re-encodes as JPEG', async () => {
    const original = fileOfSize(5 * 1024 * 1024, 'flower.png');
    const attemptStep = vi.fn().mockResolvedValue(blobOfSize(300 * 1024));

    const result = await compressImageFile(original, attemptStep);

    expect(result.name).toBe('flower.jpg');
    expect(result.type).toBe('image/jpeg');
  });

  it('passes the original file (not a previous lossy attempt) to every step, to avoid compounding quality loss', async () => {
    const original = fileOfSize(5 * 1024 * 1024);
    const attemptStep = vi
      .fn()
      .mockResolvedValueOnce(blobOfSize(2 * 1024 * 1024))
      .mockResolvedValueOnce(blobOfSize(500 * 1024));

    await compressImageFile(original, attemptStep);

    expect(attemptStep.mock.calls[0][0]).toBe(original);
    expect(attemptStep.mock.calls[1][0]).toBe(original);
  });
});
