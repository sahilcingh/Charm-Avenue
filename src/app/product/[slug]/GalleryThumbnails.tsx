'use client';
import AppImage from '@/components/ui/AppImage';
import type { GalleryImage } from '@/lib/supabase/product-gallery';

interface GalleryThumbnailsProps {
  images: GalleryImage[];
  /** Which entry in `images` is currently shown as the hero photo and highlighted. Fully
   *  controlled by the parent — see the two callbacks below — so the thumbnail order can stay
   *  stable while only the highlight moves, instead of the gallery reordering itself around
   *  whichever variant happens to be selected. */
  activeIndex: number;
  /** Called when a plain thumbnail (no `color` tag, not the default option) is clicked — just
   *  previews that photo without touching the selected color. */
  onSelectIndex?: (index: number) => void;
  /** Called (instead of onSelectIndex) when a color-tagged thumbnail is clicked, so the page's
   *  active color — and its price/stock — switches along with the photo. */
  onSelectColor?: (color: string) => void;
  /** Called when the `isDefaultOption` thumbnail is clicked, clearing the selected color. */
  onSelectDefault?: () => void;
  /** Toggles which of the two rendered copies (see ProductDetailInteractive) shows at a given
   *  breakpoint — both share the same state, so picking either one behaves identically. */
  className?: string;
}

export default function GalleryThumbnails({
  images,
  activeIndex,
  onSelectIndex,
  onSelectColor,
  onSelectDefault,
  className = '',
}: GalleryThumbnailsProps) {
  if (images.length <= 1) return null;

  return (
    // Vertical padding gives the selected thumbnail's outline (offset 2px outward) room to
    // render fully — without it, this row's implied overflow-y:auto (a side effect of
    // overflow-x-auto) clipped the top/bottom of the ring instead of showing a full circle.
    // snap-scroll/snap-item are the same scroll-snap + touch-momentum classes already relied
    // on for the homepage's Instagram carousel; touchAction: 'pan-x' explicitly tells the
    // browser this row owns horizontal panning so a swipe here isn't ceded to the page's own
    // vertical scroll. min-w-0 is load-bearing wherever this renders as a flex/grid item — grid
    // and flex items default to min-width:auto, which otherwise lets this row's full unscrolled
    // content width silently stretch its ancestor past the viewport instead of being contained
    // and scrolled internally.
    <div
      className={`flex gap-2 overflow-x-auto no-scrollbar snap-scroll py-1 min-w-0 ${className}`}
      style={{ touchAction: 'pan-x' }}
    >
      {images.map((img, i) => (
        <div key={img.url + i} className="flex flex-col items-center gap-1 shrink-0 snap-item">
          <button
            type="button"
            onClick={() => {
              if (img.color) onSelectColor?.(img.color);
              else if (img.isDefaultOption) onSelectDefault?.();
              else onSelectIndex?.(i);
            }}
            aria-label={
              img.label || img.color ? `Show ${img.label ?? img.color}` : `Show photo ${i + 1}`
            }
            className="relative w-16 h-16 rounded-2xl overflow-hidden transition-shadow duration-200"
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
          <span
            data-testid="gallery-thumb-label"
            className="w-16 text-center text-[10px] font-medium leading-tight truncate min-h-[14px]"
            style={{ color: 'var(--blush-muted)' }}
          >
            {img.label ?? ''}
          </span>
        </div>
      ))}
    </div>
  );
}
