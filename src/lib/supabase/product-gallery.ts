export interface GalleryImage {
  url: string;
  alt: string;
  /** Set when this thumbnail is a specific color variant's own photo — selecting it should also
   *  switch the page's active color, not just change which thumbnail is highlighted. */
  color?: string;
  /** Human-readable name shown under this thumbnail (a color name, or "Default") — kept separate
   *  from `color` since not every labeled thumbnail should trigger a color switch when clicked
   *  (a plain extra product photo can carry no label at all). */
  label?: string;
  /** True for the single "back to the base/default photo" thumbnail — clicking it clears the
   *  selected color entirely, unlike a color-tagged thumbnail (switches to that color) or a
   *  plain extra photo (just previews it locally). */
  isDefaultOption?: boolean;
}

/**
 * The main photo (products.image) is always the gallery's first/hero image —
 * there's no separate "cover" concept, so the card grid, cart, and the
 * detail page's initial photo can never disagree. Additional photos are
 * purely supplementary, ordered by sort_order.
 */
export function resolveGalleryImages(
  mainImage: GalleryImage,
  additionalImages: { url: string; alt: string; sort_order: number }[]
): GalleryImage[] {
  const sorted = [...additionalImages].sort((a, b) => a.sort_order - b.sort_order);
  return [mainImage, ...sorted.map((img) => ({ url: img.url, alt: img.alt || mainImage.alt }))];
}
