'use client';
import { useState } from 'react';
import AppImage from '@/components/ui/AppImage';
import type { GalleryImage } from '@/lib/supabase/product-gallery';

interface ProductGalleryProps {
    images: GalleryImage[];
    tag?: string;
    tagBg?: string;
    tagText?: string;
}

export default function ProductGallery({ images, tag, tagBg, tagText }: ProductGalleryProps) {
    const [activeIndex, setActiveIndex] = useState(0);
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
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {images.map((img, i) => (
                        <button
                            key={img.url + i}
                            type="button"
                            onClick={() => setActiveIndex(i)}
                            aria-label={`Show photo ${i + 1}`}
                            className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 transition-shadow duration-200"
                            style={{
                                outline: i === activeIndex ? '2px solid var(--blush-rose)' : '2px solid transparent',
                                outlineOffset: '2px',
                            }}
                        >
                            <AppImage src={img.url} alt={img.alt} fill className="object-cover" sizes="64px" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
