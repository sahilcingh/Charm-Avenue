'use client';
import AppImage from '@/components/ui/AppImage';
import type { GalleryImage } from '@/lib/supabase/product-gallery';
import GalleryThumbnails from './GalleryThumbnails';

interface ProductGalleryProps {
  images: GalleryImage[];
  activeIndex: number;
  onSelectIndex?: (index: number) => void;
  onSelectColor?: (color: string) => void;
  onSelectDefault?: () => void;
  tag?: string;
  tagBg?: string;
  tagText?: string;
}

export default function ProductGallery({
  images,
  activeIndex,
  onSelectIndex,
  onSelectColor,
  onSelectDefault,
  tag,
  tagBg,
  tagText,
}: ProductGalleryProps) {
  const active = images[activeIndex] ?? images[0];

  return (
    // min-w-0 is load-bearing: this is a direct CSS Grid item (ProductDetailInteractive's
    // `grid md:grid-cols-2`), and grid items default to min-width:auto — see GalleryThumbnails
    // for the full story on why that matters here.
    <div className="flex flex-col gap-3 min-w-0">
      <div className="relative aspect-square rounded-4xl overflow-hidden card-bubble">
        <AppImage
          src={active.url}
          alt={active.alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
          data-testid="gallery-hero-image"
        />
        {tag && (
          <span
            className="absolute top-4 left-4 badge-pill shadow-sm"
            style={{ background: tagBg, color: tagText }}
          >
            {tag}
          </span>
        )}
      </div>
      {/* Mobile only — on md+ the same thumbnails render instead in the info column, right under
          the product name (see ProductDetailInteractive), so they're not duplicated on desktop. */}
      <GalleryThumbnails
        images={images}
        activeIndex={activeIndex}
        onSelectIndex={onSelectIndex}
        onSelectColor={onSelectColor}
        onSelectDefault={onSelectDefault}
        className="md:hidden"
      />
    </div>
  );
}
