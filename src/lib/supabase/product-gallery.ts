export interface GalleryImage {
  url: string;
  alt: string;
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
