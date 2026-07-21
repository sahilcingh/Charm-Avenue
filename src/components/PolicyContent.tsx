import React from 'react';

interface Section {
    heading: string;
    body: React.ReactNode;
}

interface PolicyContentProps {
    sections: Section[];
    updatedAt: string;
}

export default function PolicyContent({ sections, updatedAt }: PolicyContentProps) {
    return (
        <section className="w-full px-4 md:px-10 py-14">
            <div className="max-w-screen-md mx-auto">
                <p className="text-sm font-medium mb-10" style={{ color: 'var(--blush-muted)' }}>Last updated: {updatedAt}</p>
                {sections.map((s) => (
                    <div key={s.heading} className="mb-8">
                        <h2 className="font-elegant-serif text-xl md:text-2xl tracking-tight mb-3" style={{ color: 'var(--blush-text)' }}>
                            {s.heading}
                        </h2>
                        <div className="text-base leading-relaxed space-y-3" style={{ color: 'var(--blush-text)', opacity: 0.8 }}>{s.body}</div>
                    </div>
                ))}
            </div>
        </section>
    );
}
