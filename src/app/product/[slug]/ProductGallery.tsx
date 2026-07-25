'use client';
import AppImage from '@/components/ui/AppImage';
import type { GalleryImage } from '@/lib/supabase/product-gallery';

interface ProductGalleryProps {
  images: GalleryImage[];
  /** Which entry in `images` is currently shown as the hero photo and highlighted. Fully
   *  controlled by the parent — see the two callbacks below — so the thumbnail order can stay
   *  stable while only the highlight moves, instead of the gallery reordering itself around
   *  whichever variant happens to be selected. */
  activeIndex: number;
  /** Called when a thumbnail with no `color` tag is clicked (a plain extra product photo) —
   *  just previews that photo without touching the selected color. */
  onSelectIndex?: (index: number) => void;
  /** Called (instead of onSelectIndex) when a color-tagged thumbnail is clicked, so the page's
   *  active color — and its price/stock — switches along with the photo. */
  onSelectColor?: (color: string) => void;
  tag?: string;
  tagBg?: string;
  tagText?: string;
}

export default function ProductGallery({
  images,
  activeIndex,
  onSelectIndex,
  onSelectColor,
  tag,
  tagBg,
  tagText,
}: ProductGalleryProps) {
  const active = images[activeIndex] ?? images[0];

  return (
    <div className="flex flex-col gap-3">
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
      {images.length > 1 && (
        // Vertical padding gives the selected thumbnail's outline (offset 2px outward) room to
        // render fully — without it, this row's implied overflow-y:auto (a side effect of
        // overflow-x-auto) clipped the top/bottom of the ring instead of showing a full circle.
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {images.map((img, i) => (
            <button
              key={img.url + i}
              type="button"
              onClick={() => {
                if (img.color) onSelectColor?.(img.color);
                else onSelectIndex?.(i);
              }}
              aria-label={img.color ? `Show ${img.color}` : `Show photo ${i + 1}`}
              className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 transition-shadow duration-200"
              style={
                // Only the selected thumbnail gets an explicit ring — forcing a transparent
                // outline on the rest used to silently swallow the browser's own default focus
                // ring for keyboard users, since an inline style always wins over it.
                i === activeIndex
                  ? { outline: '2px solid var(--blush-rose)', outlineOffset: '2px' }
                  : undefined
              }
            >
              <AppImage src={img.url} alt={img.alt} fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
