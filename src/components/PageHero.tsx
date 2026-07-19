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
}

export default function PageHero({ eyebrow, title, subtitle, breadcrumbs }: PageHeroProps) {
    return (
        <section className="bg-[#FFE4F4] w-full px-4 md:px-10 pt-32 pb-12 md:pt-40 md:pb-16">
            <div className="max-w-screen-xl mx-auto">
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <nav className="flex items-center flex-wrap gap-1.5 text-xs font-semibold text-[#9B4070] mb-5">
                        {breadcrumbs.map((crumb, i) => (
                            <span key={i} className="flex items-center gap-1.5">
                                {i > 0 && <span className="text-[#FFB3E0]">/</span>}
                                {crumb.href ? (
                                    <Link href={crumb.href} className="hover:text-[#E91E8C] transition-colors">
                                        {crumb.label}
                                    </Link>
                                ) : (
                                    <span className="text-[#3D0030]">{crumb.label}</span>
                                )}
                            </span>
                        ))}
                    </nav>
                )}
                <span className="badge-pill bg-[#FFF0F7] text-[#E91E8C] border border-[#FFCCE8] mb-4 inline-flex">
                    {eyebrow}
                </span>
                <h1 className="font-display text-section-title font-black text-[#3D0030] tracking-tight mb-3 max-w-2xl">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-[#9B4070] text-base leading-relaxed max-w-xl">{subtitle}</p>
                )}
            </div>
        </section>
    );
}
