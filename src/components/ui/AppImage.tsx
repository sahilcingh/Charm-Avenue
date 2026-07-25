'use client';

import React, { useState, useCallback, useMemo, useEffect, memo } from 'react';
import Image from 'next/image';

// On-brand soft pink shimmer shown behind every image while it loads,
// since remote images need a manually-supplied blur placeholder.
const SHIMMER_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'>" +
  "<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>" +
  "<stop stop-color='#FBF1EF' offset='0%'/><stop stop-color='#F6D3D6' offset='50%'/>" +
  "<stop stop-color='#FBF1EF' offset='100%'/></linearGradient></defs>" +
  "<rect width='64' height='64' fill='url(#g)'/></svg>";
const SHIMMER_BLUR_DATA_URL = `data:image/svg+xml,${encodeURIComponent(SHIMMER_SVG)}`;

// The sentinel used across the catalog for "no photo yet" (and the default `fallbackSrc` below
// for a real photo that failed to load). Rendered as a real <Image>, the actual PNG at this path
// is a generic gray/blue "broken image" icon that reads as "the site is broken" rather than
// "photo coming soon" — this on-brand placeholder replaces it instead of ever fetching it.
const PLACEHOLDER_SENTINEL = '/assets/images/no_image.png';

function OnBrandPlaceholder({
  alt,
  fill,
  className,
}: {
  alt: string;
  fill: boolean;
  className: string;
}) {
  return (
    <div
      role="img"
      aria-label={alt || 'No photo yet'}
      className={`flex items-center justify-center ${fill ? 'absolute inset-0' : ''} ${className}`}
      style={{
        background: 'var(--blush-bg, #FBF1EF)',
        width: fill ? undefined : '100%',
        height: fill ? undefined : '100%',
      }}
    >
      <svg
        width="38%"
        height="38%"
        viewBox="0 0 48 48"
        fill="none"
        style={{ maxWidth: 64, maxHeight: 64 }}
      >
        <rect
          x="4"
          y="8"
          width="40"
          height="32"
          rx="8"
          stroke="var(--blush-rose, #E8828F)"
          strokeWidth="2.5"
        />
        <circle cx="16" cy="19" r="4" fill="var(--blush-rose, #E8828F)" />
        <path
          d="M8 33l10-9 7 6 6-6 9 9"
          stroke="var(--blush-rose, #E8828F)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

interface AppImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  fill?: boolean;
  sizes?: string;
  onClick?: () => void;
  fallbackSrc?: string;
  loading?: 'lazy' | 'eager';
  unoptimized?: boolean;
  [key: string]: unknown;
}

const AppImage = memo(function AppImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = 85,
  placeholder = 'blur',
  blurDataURL = SHIMMER_BLUR_DATA_URL,
  fill = false,
  sizes,
  onClick,
  fallbackSrc = '/assets/images/no_image.png',
  loading = 'lazy',
  unoptimized = false,
  ...props
}: AppImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // `imageSrc` starts as `src` but then tracks error/loading state independently —
  // without this, a caller swapping `src` on an already-mounted AppImage (e.g. a
  // product card previewing a different color variant) would keep showing the
  // very first image forever, since useState's initializer only runs once.
  useEffect(() => {
    setImageSrc(src);
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  const handleError = useCallback(() => {
    if (!hasError && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
      setHasError(true);
    }
    setIsLoading(false);
  }, [hasError, imageSrc, fallbackSrc]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  const imageClassName = useMemo(() => {
    const classes = [className];
    if (isLoading) classes.push('bg-[#FBF1EF]');
    if (onClick) classes.push('cursor-pointer hover:opacity-90 transition-opacity duration-200');
    return classes.filter(Boolean).join(' ');
  }, [className, isLoading, onClick]);

  const imageProps = useMemo(() => {
    type ImageComponentProps = React.ComponentProps<typeof Image>;
    const baseProps: Omit<Partial<ImageComponentProps>, 'src' | 'alt'> &
      Pick<ImageComponentProps, 'src' | 'alt'> = {
      src: imageSrc,
      alt,
      className: imageClassName,
      quality,
      placeholder,
      unoptimized,
      onError: handleError,
      onLoad: handleLoad,
      onClick,
    };

    if (priority) {
      baseProps.priority = true;
    } else {
      baseProps.loading = loading;
    }

    if (blurDataURL && placeholder === 'blur') {
      baseProps.blurDataURL = blurDataURL;
    }

    return baseProps;
  }, [
    imageSrc,
    alt,
    imageClassName,
    quality,
    placeholder,
    blurDataURL,
    unoptimized,
    priority,
    loading,
    handleError,
    handleLoad,
    onClick,
  ]);

  if (imageSrc === PLACEHOLDER_SENTINEL) {
    return fill ? (
      <div className="relative" style={{ width: '100%', height: '100%' }}>
        <OnBrandPlaceholder alt={alt} fill className={className} />
      </div>
    ) : (
      <div style={{ width: width || 400, height: height || 300 }}>
        <OnBrandPlaceholder alt={alt} fill={false} className={className} />
      </div>
    );
  }

  if (fill) {
    return (
      <div className="relative" style={{ width: '100%', height: '100%' }}>
        <Image
          {...imageProps}
          alt={alt}
          fill
          sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
          style={{ objectFit: 'cover' }}
          {...props}
        />
      </div>
    );
  }

  return (
    <Image
      {...imageProps}
      alt={alt}
      width={width || 400}
      height={height || 300}
      sizes={sizes}
      {...props}
    />
  );
});

AppImage.displayName = 'AppImage';

export default AppImage;
