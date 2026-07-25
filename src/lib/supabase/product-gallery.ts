export interface GalleryImage {
  url: string;
  alt: string;
  /** Set when this thumbnail is a specific color variant's own photo — selecting it should also
   *  switch the page's active color, not just change which thumbnail is highlighted. */
  color?: string;
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
