import React from 'react';
import Link from 'next/link';

interface Crumb {
  label: string;
  href?: string;
}

interface PageHeroProps {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: string;
  breadcrumbs?: Crumb[];
  /** Rendered beside the title on large screens (e.g. a summary card), instead of leaving that space empty. */
  aside?: React.ReactNode;
}

export default function PageHero({ eyebrow, title, subtitle, breadcrumbs, aside }: PageHeroProps) {
  return (
    <section
      className="w-full px-4 md:px-10 pt-32 pb-12 md:pt-40 md:pb-16"
      style={{ background: 'var(--blush-bg)' }}
    >
      <div
        className={
          aside
            ? 'max-w-screen-2xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 lg:items-center'
            : 'max-w-screen-2xl mx-auto'
        }
      >
        <div>
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav
              className="flex items-center flex-wrap gap-1.5 text-xs font-semibold mb-5"
              style={{ color: 'var(--blush-muted)' }}
            >
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <span style={{ color: 'var(--blush-border)' }}>/</span>}
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:opacity-70 transition-opacity">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span style={{ color: 'var(--blush-text)' }}>{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}
          <span
            className="badge-pill mb-4 inline-flex"
            style={{
              background: '#FFFFFF',
              color: 'var(--blush-rose)',
              border: '1px solid var(--blush-border)',
            }}
          >
            {eyebrow}
          </span>
          <h1
            className="font-elegant-serif text-section-title tracking-tight mb-3 max-w-2xl"
            style={{ color: 'var(--blush-text)' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="text-base leading-relaxed max-w-xl"
              style={{ color: 'var(--blush-muted)' }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {aside && <div>{aside}</div>}
      </div>
    </section>
  );
}
