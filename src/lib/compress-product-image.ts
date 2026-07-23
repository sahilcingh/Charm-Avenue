/**
 * Auto-compresses a product photo client-side before upload, instead of
 * asking the admin to pick a smaller file. Draws the image onto a canvas at
 * progressively smaller dimensions/quality until it's under
 * COMPRESSION_TARGET_BYTES, always re-drawing from the ORIGINAL file at each
 * step (not the previous, already-lossy attempt) so quality loss doesn't
 * compound. If no step gets under target, the smallest/most-compressed
 * attempt is used anyway rather than failing outright — it's still far
 * smaller than the original, and validateProductImageFile (MAX_PRODUCT_IMAGE_BYTES,
 * a much higher hard ceiling) is the real backstop for the rare case that
 * doesn't get small enough.
 */
export const COMPRESSION_TARGET_BYTES = 1 * 1024 * 1024;

export const COMPRESSION_STEPS: { maxDimension: number; quality: number }[] = [
    { maxDimension: 1600, quality: 0.82 },
    { maxDimension: 1600, quality: 0.6 },
    { maxDimension: 1200, quality: 0.7 },
    { maxDimension: 1200, quality: 0.5 },
    { maxDimension: 900, quality: 0.6 },
];

function toJpegFilename(originalName: string): string {
    const base = originalName.replace(/\.[^./\\]+$/, '');
    return `${base || 'photo'}.jpg`;
}

/**
 * Orchestration only — takes `attemptStep` as a parameter so this can be
 * unit tested without a real Canvas/Image, which aren't available in the
 * jsdom test environment. The real image-drawing implementation is
 * `renderAtStep` below, used via `compressProductImage`.
 */
export async function compressImageFile(
    file: File,
    attemptStep: (file: File, step: { maxDimension: number; quality: number }) => Promise<Blob>
): Promise<File> {
    if (file.size <= COMPRESSION_TARGET_BYTES) return file;

    let best: Blob = file;
    for (const step of COMPRESSION_STEPS) {
        best = await attemptStep(file, step);
        if (best.size <= COMPRESSION_TARGET_BYTES) break;
    }

    return new File([best], toJpegFilename(file.name), { type: best.type || 'image/jpeg' });
}

async function renderAtStep(file: File, step: { maxDimension: number; quality: number }): Promise<Blob> {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    try {
        const scale = Math.min(1, step.maxDimension / Math.max(bitmap.width, bitmap.height));
        const width = Math.max(1, Math.round(bitmap.width * scale));
        const height = Math.max(1, Math.round(bitmap.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D context unavailable');
        ctx.drawImage(bitmap, 0, 0, width, height);

        return await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
                (blob) => (blob ? resolve(blob) : reject(new Error('Image compression produced no output'))),
                'image/jpeg',
                step.quality
            );
        });
    } finally {
        bitmap.close();
    }
}

/**
 * Public entry point used by the product form. Never throws — if
 * compression fails for any reason (unsupported format, no Canvas support,
 * etc.), falls back to the original file untouched so the existing
 * size-validation safety net still applies.
 */
export async function compressProductImage(file: File): Promise<File> {
    try {
        return await compressImageFile(file, renderAtStep);
    } catch {
        return file;
    }
}
