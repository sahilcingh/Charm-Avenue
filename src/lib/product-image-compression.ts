import sharp from 'sharp';

// Admin uploads come straight from phone cameras (often 3000px+, several MB) and were
// previously stored and served byte-for-byte as-is — the single biggest cause of slow
// product photo loads on the storefront. Resizing to a reasonable display size and
// re-encoding as WebP here, once at upload time, means every visitor downloads a small
// file forever after, instead of every visitor downloading the original.
const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 82;

export interface CompressedImage {
  body: Buffer;
  contentType: string;
  ext: string;
}

/**
 * Resizes and re-encodes an uploaded photo for storage. Falls back to the original,
 * unmodified file if sharp can't decode it (corrupt upload or an exotic format) —
 * failing to compress shouldn't block the admin's save.
 */
export async function compressProductImage(file: File): Promise<CompressedImage> {
  const bytes = Buffer.from(await file.arrayBuffer());
  try {
    const body = await sharp(bytes)
      .rotate() // apply EXIF orientation before resizing, or it's locked in sideways
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
    return { body, contentType: 'image/webp', ext: 'webp' };
  } catch {
    return {
      body: bytes,
      contentType: file.type || 'application/octet-stream',
      ext: file.name.split('.').pop() || 'jpg',
    };
  }
}
