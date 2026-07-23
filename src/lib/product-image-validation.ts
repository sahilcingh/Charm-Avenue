/**
 * Kept in sync with the Server Action body size limit in next.config.mjs
 * (set generously above this so the rest of the form's fields have headroom).
 * A photo over this size used to fail silently server-side with no useful
 * message — this catches it client-side, before submission, with one.
 */
export const MAX_PRODUCT_IMAGE_BYTES = 8 * 1024 * 1024;

export function validateProductImageFile(file: File): string | null {
  if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
    const maxMb = MAX_PRODUCT_IMAGE_BYTES / (1024 * 1024);
    const actualMb = (file.size / (1024 * 1024)).toFixed(1);
    return `This photo is ${actualMb}MB — that's too large. Please choose one under ${maxMb}MB.`;
  }
  return null;
}
