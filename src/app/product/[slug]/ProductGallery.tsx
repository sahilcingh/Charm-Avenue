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
  /** Called when a plain thumbnail (no `color` tag, not the default option) is clicked — just
   *  previews that photo without touching the selected color. */
  onSelectIndex?: (index: number) => void;
  /** Called (instead of onSelectIndex) when a color-tagged thumbnail is clicked, so the page's
   *  active color — and its price/stock — switches along with the photo. */
  onSelectColor?: (color: string) => void;
  /** Called when the `isDefaultOption` thumbnail is clicked, clearing the selected color. */
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
    // `grid md:grid-cols-2`), and grid items default to min-width:auto — meaning without this,
    // the thumbnail row's full intrinsic content width (every thumbnail side by side, unscrolled)
    // was allowed to bubble up and stretch the grid track itself past the viewport, instead of
    // being contained and scrolled by this row's own overflow-x-auto. That silently widened the
    // whole page a little past the screen edge (clipping "Add to Bag" and everything else off
    // the right side) while leaving nothing real for a swipe to scroll, since mobile browsers
    // don't pan a page that's only slightly overflowed this way — it just reads as "stuck."
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
      {images.length > 1 && (
        // Vertical padding gives the selected thumbnail's outline (offset 2px outward) room to
        // render fully — without it, this row's implied overflow-y:auto (a side effect of
        // overflow-x-auto) clipped the top/bottom of the ring instead of showing a full circle.
        // snap-scroll/snap-item are the same scroll-snap + touch-momentum classes already relied
        // on for the homepage's Instagram carousel; touchAction: 'pan-x' explicitly tells the
        // browser this row owns horizontal panning so a swipe here isn't ceded to the page's own
        // vertical scroll — without it, a swipe that started with any vertical drift could get
        // captured by the page instead of scrolling this row.
        <div
          className="flex gap-2 overflow-x-auto no-scrollbar snap-scroll py-1 min-w-0"
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
      )}
    </div>
  );
}
